#include <cpprest/http_listener.h>
#include <cpprest/json.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <string>
#include <arpa/inet.h>

using namespace web;
using namespace web::http;
using namespace web::http::experimental::listener;

/// the validator server is a **relay** server that,
///   0. runs/listens on port 3001.
///   1. receives a request from the client, i.e., the `validator-frontend`, from port 3001.
///   2. sends the request (in plain text) to the actual server that runs the alive2 verifier
///      through port 3002 via a simple TCP connection.
///   3. relays the response from the server back to the frontend, which will then render/update the result.
class ValidatorServer {
public:
    ValidatorServer(const std::string& url) : listener(url) {
        listener.support(
            // only support POST requests
            methods::POST,
            // register the post handler
            std::bind(&ValidatorServer::handle_post, this, std::placeholders::_1)
        );
    }

    void handle_post(http_request request) {
        auto path = uri::decode(request.relative_uri().path());
        
        if (path == "/api/generate-ir") {
            handle_generate_ir(request);
        } else if (path == "/api/validate") {
            handle_validate(request);
        } else {
            // invalid request
            request.reply(status_codes::NotFound);
        }
    }

    /// `POST /api/generate-ir`
    void handle_generate_ir(http_request request) {
        request.extract_json().then([this, &request](json::value body) {
            try {
                check_request_body(body, { "cppCode", "rustCode" });
                auto cpp_code = body["cppCode"].as_string();
                auto rust_code = body["rustCode"].as_string();

                // format command and send to validator
                std::string command = "GENERATE\n" + cpp_code + "\n" + rust_code;
                std::string result = send_to_validator(command);

                // parse result into cpp and rust IR
                size_t separator = result.find("\n---SEPARATOR---\n");
                std::string cpp_ir = result.substr(0, separator);
                std::string rust_ir = result.substr(separator + 16);

                // create response
                json::value response {};
                response["cppIR"] = json::value::string(cpp_ir);
                response["rustIR"] = json::value::string(rust_ir);

                return response;
            } catch (const std::exception& e) {
                // create error message as string instead of json::value
                request.reply(status_codes::InternalError, utility::conversions::to_string_t(e.what()));
                // note: need to re-throw to break the promise chain
                throw;
            }
        }).then([&request](json::value response) {
            request.reply(status_codes::OK, response);
        }).wait();
    }

    /// `POST /api/validate`
    void handle_validate(http_request request) {
        request.extract_json().then([this, &request](json::value body) {
            try {
                check_request_body(body, { "cppIR", "rustIR" });
                auto cpp_ir = body["cppIR"].as_string();
                auto rust_ir = body["rustIR"].as_string();
                std::string function_name { "" };
                if (body.has_field("functionName")) {
                    function_name = body["functionName"].as_string();
                }

                // format command and send to validator
                std::string command { "VALIDATE\n" + cpp_ir + "\n" + rust_ir + "\n" + function_name };
                std::string result = send_to_validator(command);

                // parse validation result
                bool success = result.find("Validation successful") != std::string::npos;
                int num_errors = std::count(result.begin(), result.end(), '\n');

                // create response
                json::value response {};
                response["success"] = json::value::boolean(success);
                response["verifier_output"] = json::value::string(result);
                response["num_errors"] = json::value::number(num_errors);

                return response;
            } catch (const std::exception& e) {
                // same as `handle_generate_ir`
                request.reply(status_codes::InternalError, utility::conversions::to_string_t(e.what()));
                throw;
            }
        }).then([&request](json::value response) {
            request.reply(status_codes::OK, response);
        }).wait();
    }

    void start() {
        try {
            listener.open().wait();
            std::cout << "server running at: " << listener.uri().to_string() << std::endl;
        } catch (const std::exception& e) {
            std::cout << "error starting server: " << e.what() << std::endl;
        }
    }

private:
    http_listener listener;

    /// the validator server runs on "127.0.0.1:3002".
    const std::string validator_host { "127.0.0.1" };
    const int validator_port { 3002 };

    /// send a command to the alive2 verifier server through a simple TCP connection.
    /// note that this function will create a temporary TCP socket and then close it.
    /// this function will block until the command is sent and the response is received.
    auto send_to_validator(const std::string &command) -> std::string {
        int sock = socket(AF_INET, SOCK_STREAM, 0);
        struct sockaddr_in serv_addr = {
            .sin_family = AF_INET,
            .sin_port = htons(validator_port),
            .sin_addr = {}
        };
        inet_pton(AF_INET, validator_host.c_str(), &serv_addr.sin_addr);

        connect(sock, (struct sockaddr *) &serv_addr, sizeof(serv_addr));
        send(sock, command.c_str(), command.length(), 0);

        char buffer[4096] = {0};
        read(sock, buffer, 4096);
        close(sock);

        return std::string(buffer);
    }

    void check_request_body(const json::value &body, std::vector<std::string> required_fields) {
        for (const auto &field : required_fields) {
            if (!body.has_field(field)) {
                throw std::invalid_argument(field + " is required");
            }
        }
    }
};

int main() {
    ValidatorServer server { "http://127.0.0.1:3001" };
    server.start();

    std::cout << "press ENTER to exit." << std::endl;
    std::string line;
    std::getline(std::cin, line);

    return 0;
} 