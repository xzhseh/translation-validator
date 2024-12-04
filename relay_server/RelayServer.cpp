#include <atomic>
#include <cpprest/http_listener.h>
#include <cpprest/json.h>
#include <csignal>
#include <filesystem>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <string>
#include <thread>
#include <arpa/inet.h>

#include "../src/Printer.h"

using namespace web;
using namespace web::http;
using namespace web::http::experimental::listener;

/// the storage to store the logs for relay server
const auto LOG_STORAGE_PREFIX = []() {
    const char* home = getenv("HOME");
    if (!home) {
        // fallback to passwd entry if HOME is not set
        home = getpwuid(getuid())->pw_dir;
    }
    return std::string(home) + "/.translation_validator/relay_server/logs/";
}();
constexpr auto LOG_FILE_DEFAULT_NAME = "relay_server.log";

/// the RelayServer is a relay server that,
///   0. runs/listens on port 3001.
///   1. receives a request from the client, i.e., the `validator-frontend`, from port 3001.
///   2. sends the request (in plain text) to the actual validator server that runs the alive2 verifier
///      through port 3002 via a simple TCP connection.
///   3. relays the response from the validator server back to the frontend,
///      which will then render/update the result.
class RelayServer {
public:
    RelayServer(const std::string &url) : listener(url) {
        listener.support(
            // only support POST requests
            methods::POST,
            // register the post handler
            std::bind(&RelayServer::handle_post, this, std::placeholders::_1)
        );
    }

    void handle_post(http_request request) {
        auto path = uri::decode(request.relative_uri().path());
        printer_.log("received request: " + path);

        if (path == "/api/generate-ir") {
            handle_generate_ir(request);
        } else if (path == "/api/validate") {
            handle_validate(request);
        } else {
            // invalid request
            request.reply(status_codes::NotFound);
        }
    }

    void reply_with_error(http_request request, const std::string &error_message) {
        json::value response {};
        response["error"] = json::value::string(error_message);
        request.reply(status_codes::InternalError, response);
    }

    /// `POST /api/generate-ir`
    void handle_generate_ir(http_request request) {
        printer_.log("received generate-ir request");
        request.extract_json().then([this, &request](json::value body) {
            try {
                check_request_body(body, { "cppCode", "rustCode" });
                auto cpp_code = body["cppCode"].as_string();
                auto rust_code = body["rustCode"].as_string();

                // format command and send to validator
                std::string command {
                    std::string("GENERATE") +
                    "__CPPCODE__" + std::move(cpp_code) +
                    "__RUSTCODE__" + std::move(rust_code)
                };
                std::string result = send_to_validator(std::move(command));
                if (result == "error") {
                    throw std::runtime_error("failed to send command for generating IR");
                } else if (result.find("failed to generate") != std::string::npos ||
                           result.find("compilation timed out (10s) or failed") != std::string::npos ||
                           result.find("generated IR file exceeds the size limit") != std::string::npos ||
                           result.find("generated IR file exceeds the length limit") != std::string::npos) {
                    throw std::runtime_error(result);
                }

                // parse result into cpp and rust IR by reading the generated IR files
                std::string separator { "__GENERATED_IR_SEPARATOR__" };
                auto irs = result.find(separator);
                auto cpp_ir = result.substr(0, irs);
                auto rust_ir = result.substr(irs + separator.length());

                // create response
                json::value response {};
                response["cppIR"] = json::value::string(cpp_ir);
                response["rustIR"] = json::value::string(rust_ir);

                return response;
            } catch (const std::exception &e) {
                reply_with_error(request, e.what());
                // note: need to re-throw to break the promise chain
                throw;
            }
        }).then([&request](json::value response) {
            request.reply(status_codes::OK, response);
        }).wait();
    }

    /// `POST /api/validate`
    void handle_validate(http_request request) {
        printer_.log("received validate request");
        request.extract_json().then([this, &request](json::value body) {
            try {
                check_request_body(body, { "cppIR", "rustIR", "cppFunctionName", "rustFunctionName" });
                auto cpp_ir = body["cppIR"].as_string();
                auto rust_ir = body["rustIR"].as_string();
                auto cpp_function_name = body["cppFunctionName"].as_string();
                auto rust_function_name = body["rustFunctionName"].as_string();

                // format command and send to validator
                std::string command {
                    std::string("VALIDATE") +
                    "__CPPIR__" + std::move(cpp_ir) +
                    "__RUSTIR__" + std::move(rust_ir) +
                    "__CPP_FUNCTION__" + std::move(cpp_function_name) +
                    "__RUST_FUNCTION__" + std::move(rust_function_name)
                };
                std::string result = send_to_validator(std::move(command));
                if (result == "error") {
                    throw std::runtime_error("failed to send command for validating IR");
                } else if (result.find("multiple functions found") != std::string::npos ||
                           result.find("function not found") != std::string::npos ||
                           result.find("no functions found") != std::string::npos) {
                    throw std::runtime_error(result);
                }

                // parse validation result
                bool success = result.find("Transformation seems to be correct!") != std::string::npos;
                int num_errors = success ? 0 : 1;

                // create response
                json::value response {};
                response["success"] = json::value::boolean(success);
                response["verifier_output"] = json::value::string(result);
                response["num_errors"] = json::value::number(num_errors);

                return response;
            } catch (const std::exception &e) {
                // same as `handle_generate_ir`
                reply_with_error(request, e.what());
                throw;
            }
        }).then([&request](json::value response) {
            request.reply(status_codes::OK, response);
        }).wait();
    }

    void start() {
        try {
            listener.open().wait();
            printer_.print_info("relay server running at: " + listener.uri().to_string(), true);
        } catch (const std::exception& e) {
            printer_.print_error("error starting relay server: " + std::string(e.what()), true);
        }
    }

private:
    http_listener listener;
    Printer printer_ { std::cout, "relay_server",
                      LOG_STORAGE_PREFIX, LOG_FILE_DEFAULT_NAME };

    /// the validator server runs on "127.0.0.1:3002".
    const std::string validator_host { "127.0.0.1" };
    const int validator_port { 3002 };

    void read_until_length(int client_socket, char *buffer, size_t length) {
        size_t n { 0 };
        while (n < length) {
            size_t bytes_read = read(client_socket, buffer + n, length - n);
            if (bytes_read == 0) {
                throw std::runtime_error("connection closed by client");
            }
            n += bytes_read;
        }
    }

    /// the protocol between messages sent from the relay server is,
    /// <length><blankspace><message>
    /// where <length> is the exact length of the <message>.
    bool read_validator_message(int client_socket, std::string &buffer) {
        // first read the length of the message
        size_t n { 0 };
        char length_buffer[9] { 0 };

        while ((read(client_socket, length_buffer + n, 1)) > 0) {
            if (length_buffer[n] == ' ') {
                // calculate the length of the message
                size_t length = std::atoi(length_buffer);
                buffer.resize(length);
                // read the rest of the message until the length is reached
                read_until_length(client_socket, buffer.data(), length);
                break;
            } else if (!isdigit(length_buffer[n])) {
                // malformed message
                return false;
            } else {
                n += 1;
                if (n > 8) {
                    // length buffer overflow
                    return false;
                }
            }
        }

        return true;
    }

    /// create a TCP connection with the validator server.
    /// this function will block until the connection is established.
    int make_connection_with_validator(bool &error) {
        int sock = socket(AF_INET, SOCK_STREAM, 0);
        if (sock < 0) {
            throw std::runtime_error("failed to create socket");
        }

        struct sockaddr_in serv_addr = {
            .sin_family = AF_INET,
            .sin_port = htons(validator_port),
            .sin_addr = {}
        };

        if (inet_pton(AF_INET, validator_host.c_str(), &serv_addr.sin_addr) <= 0) {
            close(sock);
            printer_.print_error("invalid address", true);
            error = true;
            return -1;
        }

        if (connect(sock, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0) {
            close(sock);
            printer_.print_error("connection failed", true);
            error = true;
            return -1;
        }
        printer_.log("connected to validator server");
        return sock;
    }

    /// send a command to the alive2 verifier server through a simple TCP connection.
    /// note that this function will create a temporary TCP socket and then close it.
    /// this function will block until the command is sent and the response is received.
    auto send_to_validator(std::string command) -> std::string {
        bool error { false };
        int sock = make_connection_with_validator(error);
        if (error) {
            return { "error" };
        }

        // follows the format: <length><blankspace><command>
        std::string relay_message { std::to_string(command.length()) + " " + std::move(command) };
        ssize_t sent_bytes = send(sock, relay_message.c_str(), relay_message.length(), 0);
        if (sent_bytes < 0 || static_cast<size_t>(sent_bytes) != relay_message.length()) {
            close(sock);
            printer_.print_error("failed to send command", true);
            return { "error" };
        }

        std::string buffer {};
        if (!read_validator_message(sock, buffer)) {
            close(sock);
            printer_.print_error("failed to read validator message", true);
            return { "error" };
        }

        close(sock);
        return buffer;
    }

    void check_request_body(const json::value &body, std::vector<std::string> required_fields) {
        for (const auto &field : required_fields) {
            if (!body.has_field(field)) {
                throw std::invalid_argument(field + " is required");
            }
        }
    }
};

std::atomic<bool> keep_running { true };

void signal_handler(int signum) {
    keep_running = false;
}

int main() {
    RelayServer server { "http://127.0.0.1:3001" };
    server.start();

    while (keep_running) {
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }

    return 0;
}
