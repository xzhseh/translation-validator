#include "ValidatorServer.h"

#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/resource.h>
#include <sys/time.h>

#include "llvm_util/compare.h"
#include "llvm_util/llvm2alive.h"
#include "llvm_util/llvm_optimizer.h"
#include "llvm_util/utils.h"
#include "smt/smt.h"

#include "llvm/Analysis/TargetLibraryInfo.h"
#include "llvm/Bitcode/BitcodeReader.h"
#include "llvm/IR/Function.h"
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/LegacyPassManager.h"
#include "llvm/IR/Module.h"
#include "llvm/IRReader/IRReader.h"
#include "llvm/Passes/PassBuilder.h"
#include "llvm/Support/InitLLVM.h"
#include "llvm/Support/Signals.h"
#include "llvm/TargetParser/Triple.h"
#include "llvm/Transforms/Utils/Cloning.h"

using namespace std;

#define LLVM_ARGS_PREFIX ""
#define ARGS_SRC_TGT
#define ARGS_REFINEMENT
#include <fstream>
#include "llvm_util/cmd_args_list.h"

constexpr auto CPP_MANGLING_PREFIX = "_Z";
constexpr auto RUST_MANGLING_PREFIX = "_ZN";
constexpr auto SRC_UB_PROMPT = "WARNING: Source function is always UB";
/// the temporary storage to store the intermediate ir files
constexpr auto TMP_STORAGE_PREFIX = "/tmp/__validator_server__/";
/// the storage to store the logs for validator server
const auto LOG_STORAGE_PREFIX = []() {
    const char* home = getenv("HOME");
    if (!home) {
        // fallback to passwd entry if HOME is not set
        home = getpwuid(getuid())->pw_dir;
    }
    return std::string(home) + "/.translation_validator/validator_server/logs/";
}();
constexpr auto LOG_FILE_DEFAULT_NAME = "validator_server.log";
/// the limit for the size of the generated IR files, currently set to 50000 bytes.
constexpr auto IR_FILE_SIZE_LIMIT = 50000;

namespace {

/// the patterns (i.e., function prefix) to match cpp and rust functions
/// in the provided ir files.
/// ps. the values are `_Z` for cpp and `_ZN` for rust.
llvm::cl::opt<std::string> opt_cpp_pattern {
    "cpp-pattern", llvm::cl::desc("pattern to match cpp functions in ir file"),
    llvm::cl::init(CPP_MANGLING_PREFIX)
};

llvm::cl::opt<std::string> opt_rust_pattern {
    "rust-pattern",
    llvm::cl::desc("pattern to match rust functions in ir file"),
    llvm::cl::init(RUST_MANGLING_PREFIX)
};

}  // namespace

/// a simple RAII wrapper for a client socket
class ClientSocket {
    public:
        explicit ClientSocket(int fd) : fd_(fd) {}
        ~ClientSocket() { if (fd_ >= 0) close(fd_); }
        
        // Prevent copying
        ClientSocket(const ClientSocket&) = delete;
        ClientSocket& operator=(const ClientSocket&) = delete;
        
        int get() const { return fd_; }
    private:
        int fd_;
};

ValidatorServer::ValidatorServer(int port) 
    : port_(port)
    , printer_(std::cout, "validator_server",
               LOG_STORAGE_PREFIX, LOG_FILE_DEFAULT_NAME)
    , server_fd_(socket(AF_INET, SOCK_STREAM, 0))
    , address_ {
        .sin_family = AF_INET,
        .sin_port = htons(port),
        .sin_addr = { .s_addr = INADDR_ANY }
    }
{
    if (server_fd_ < 0) {
        printer_.print_error("failed to create socket", true);
    }

    // check bind result
    if (::bind(server_fd_, reinterpret_cast<struct sockaddr*>(&address_), sizeof(address_)) < 0) {
        close(server_fd_);
        printer_.print_error("failed to bind to port " + std::to_string(port), true);
        exit(EXIT_FAILURE);
    }
}

ValidatorServer::~ValidatorServer() {
    close(server_fd_);
}

void ValidatorServer::start() {
    bind(server_fd_, (struct sockaddr *) &address_, sizeof(address_));
    listen(server_fd_, 3);
    printer_.print_info("validator server running at: " +
                      std::string("http://127.0.0.1:") + std::to_string(port_) + std::string("/"),
                      true);

    // create the temporary storage directory if not exists,
    // no need for log storage directory since the `write_log` in `Printer`
    // will take care of the directory creation.
    if (!std::filesystem::exists(TMP_STORAGE_PREFIX)) {
        bool created = std::filesystem::create_directories(TMP_STORAGE_PREFIX);
        bool exists = std::filesystem::exists(TMP_STORAGE_PREFIX);
        if (!created && !exists) {
            printer_.print_error("failed to create temporary storage directory: " +
                                 std::string(TMP_STORAGE_PREFIX), true);
        }
    }

    while (true) {
        struct sockaddr_in client_addr {};
        socklen_t client_len = sizeof(client_addr);
        int client_socket = accept(server_fd_, (struct sockaddr*) &client_addr, &client_len);

        if (client_socket < 0) {
            printer_.print_error("failed to accept client connection", true);
            continue;
        }

        printer_.log("accepted client connection from socket " + std::to_string(client_socket));
        recv_and_process_relay_server_request(client_socket);
    }
}

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
/// :: <length><blankspace><message>
/// where <length> is the exact length of the <message>.
bool read_relay_message(int client_socket, std::string &buffer) {
    constexpr auto MAX_LENGTH_BUFFER_SIZE = 8;
    // first read the length of the message
    size_t n { 0 };
    char length_buffer[MAX_LENGTH_BUFFER_SIZE + 1] { 0 };

    while ((read(client_socket, length_buffer + n, 1)) > 0) {
        if (length_buffer[n] == ' ') {
            // calculate the length of the message
            size_t length = std::atoi(length_buffer);
            // make sure the buffer has enough space to hold the message
            buffer.resize(length);
            // read the rest of the message until the length is reached
            read_until_length(client_socket, buffer.data(), length);
            break;
        } else if (!isdigit(length_buffer[n])) {
            // malformed message
            return false;
        } else {
            n += 1;
            if (n >= MAX_LENGTH_BUFFER_SIZE) {
                // length buffer overflow
                return false;
            }
        }
    }

    return true;
}

void ValidatorServer::recv_and_process_relay_server_request(int client_socket) {
    // the fork here is to isolate the alive2 verifier environment with the
    // validator server, i.e., a single, isolated process will be used to handle
    // each individual validation/generate request, this is needed because alive2's
    // verifier has its own "bug" that will cause mysterious segmentation faults
    // if running the `llvm_util::Verifier::compareFunctions` multiple times in
    // the same process.
    pid_t pid = fork();
    if (pid < 0) {
        printer_.print_error("failed to fork process for client request", true);
        exit(EXIT_FAILURE);
    } else if (pid == 0) {
        try {
            #ifdef __APPLE__
                // skip setting memory limit on macOS as it requires root privileges..
                printer_.print_info("skipping setting memory limit on macOS", true);
            #else
                // set resource limits for the current child process to prevent
                // overwhelming/crashing/OOMing the validator server.
                struct rlimit mem_limit {
                    // 512 MB soft limit
                    .rlim_cur = static_cast<rlim_t>(512 * 1024 * 1024),
                    // 1 GB hard limit
                    .rlim_max = static_cast<rlim_t>(1024 * 1024 * 1024)
                };

                if (setrlimit(RLIMIT_AS, &mem_limit) != 0) {
                    printer_.print_error("failed to set memory limit for child process: " +
                                       std::to_string(pid) + "; error: " + std::strerror(errno), true);
                    exit(EXIT_FAILURE);
                }
            #endif

            // set the CPU time limit for the child process for all platforms
            struct rlimit cpu_limit {
                // 30 seconds CPU time
                .rlim_cur = 30,
                // 60 seconds hard limit
                .rlim_max = 60
            };
            if (setrlimit(RLIMIT_CPU, &cpu_limit) != 0) {
                printer_.print_error("failed to set CPU limit for child process: " +
                                   std::to_string(pid) + "; error: " + std::strerror(errno), true);
                exit(EXIT_FAILURE);
            }

            ClientSocket socket(client_socket);

            // read the command from the relay server
            auto command = [this, &socket, pid]() -> std::string {
                std::string buffer;
                if (!read_relay_message(socket.get(), buffer)) {
                    printer_.print_error("failed to read message from client for child process: " +
                                       std::to_string(pid), true);
                    exit(EXIT_FAILURE);
                }
                return buffer;
            }();

            // process the command and get the result
            const auto result = [this, &command]() -> std::string {
                if (command.starts_with("VALIDATE")) {
                    return handle_validate_command(command);
                } else if (command.starts_with("GENERATE")) {
                    return handle_generate_command(command);
                }
                printer_.print_error("unknown command received: " + command, true);
                exit(EXIT_FAILURE);
            }();

            // send response back to relay server
            const auto response = std::to_string(result.length()) + " " + result;
            if (send(socket.get(), response.c_str(), response.length(), 0) < 0) {
                printer_.print_error("failed to send response for child process: " +
                                   std::to_string(pid), true);
            }

            exit(EXIT_SUCCESS);
        } catch (const std::exception &e) {
            printer_.print_error("child process error: " + std::string(e.what()) +
                                 "; pid: " + std::to_string(pid), true);
            exit(EXIT_FAILURE);
        }
    } else {
        // parent process simply returns
        return;
    }
}

auto ValidatorServer::handle_validate_command(const std::string &command) const -> std::string {
    static const std::string cpp_ir_separator { "__CPPIR__" };
    static const std::string rust_ir_separator { "__RUSTIR__" };
    static const std::string cpp_function_name_separator { "__CPP_FUNCTION__" };
    static const std::string rust_function_name_separator { "__RUST_FUNCTION__" };

    const auto pos1 = command.find(cpp_ir_separator);
    const auto pos2 = command.find(rust_ir_separator, pos1 + cpp_ir_separator.length());
    const auto pos3 = command.find(cpp_function_name_separator, pos2 + rust_ir_separator.length());
    const auto pos4 = command.find(rust_function_name_separator, pos3 + cpp_function_name_separator.length());

    if (pos1 == std::string::npos || pos2 == std::string::npos || pos3 == std::string::npos || pos4 == std::string::npos) {
        printer_.print_error("invalid validate command format", true);
        exit(EXIT_FAILURE);
    }

    const auto cpp_ir = command.substr(pos1 + cpp_ir_separator.length(),
                                     pos2 - pos1 - cpp_ir_separator.length());
    const auto rust_ir = command.substr(pos2 + rust_ir_separator.length(),
                                      pos3 - pos2 - rust_ir_separator.length());
    const auto cpp_function_name = command.substr(pos3 + cpp_function_name_separator.length(),
                                                 pos4 - pos3 - cpp_function_name_separator.length());
    const auto rust_function_name = command.substr(pos4 + rust_function_name_separator.length());

    return handle_validate_request(cpp_ir, rust_ir, cpp_function_name, rust_function_name);
}

auto ValidatorServer::handle_generate_command(const std::string &command) const -> std::string {
    static const std::string cpp_code_separator { "__CPPCODE__" };
    static const std::string rust_code_separator { "__RUSTCODE__" };

    const auto pos1 = command.find(cpp_code_separator);
    const auto pos2 = command.find(rust_code_separator, pos1 + cpp_code_separator.length());

    if (pos1 == std::string::npos || pos2 == std::string::npos) {
        printer_.print_error("invalid generate command format", true);
        exit(EXIT_FAILURE);
    }

    const auto cpp_code = command.substr(pos1 + cpp_code_separator.length(),
                                       pos2 - pos1 - cpp_code_separator.length());
    const auto rust_code = command.substr(pos2 + rust_code_separator.length());

    return handle_generate_request(cpp_code, rust_code);
}

auto open_input_file(llvm::LLVMContext &context, const std::string &path) -> std::unique_ptr<llvm::Module> {
    llvm::SMDiagnostic err {};
    auto module = llvm::parseIRFile(path, err, context);

    if (!module) {
        err.print("open_input_file", llvm::errs());
        return nullptr;
    }

    return module;
}

/// generate a random hash based on the current time and the source code/IRs,
/// note that the `cpp` and `rust` could be the source code or the IRs.
auto generate_random_hash(const std::string &cpp, const std::string &rust) -> std::string {
    return std::to_string(std::hash<std::string>{}(cpp + rust + 
                      std::to_string(std::chrono::system_clock::now().time_since_epoch().count())));
}

auto ValidatorServer::handle_validate_request(
        const std::string &cpp_ir,
        const std::string &rust_ir,
        const std::string &cpp_function_name,
        const std::string &rust_function_name) const -> std::string {
    bool use_specified_function_name = cpp_function_name != "EMPTY" && rust_function_name != "EMPTY";
    printer_.log(std::string("use specified function name: ") + (use_specified_function_name ? "true" : "false") +
                "; cpp function name: " + cpp_function_name + "; rust function name: " + rust_function_name);

    // generate unique hash for this request
    auto random_hash = generate_random_hash(cpp_ir, rust_ir);

    // write IR to temporary files
    std::string cpp_file = TMP_STORAGE_PREFIX + random_hash + "_cpp.ll";
    std::string rust_file = TMP_STORAGE_PREFIX + random_hash + "_rs.ll";
    std::ofstream(cpp_file) << cpp_ir;
    std::ofstream(rust_file) << rust_ir;

    // set up validation components
    std::stringstream verifier_buffer {};
    {
        llvm::LLVMContext context {};
        auto cpp_module = open_input_file(context, cpp_file);
        auto rust_module = open_input_file(context, rust_file);

        if (!cpp_module || !rust_module) {
            return "failed to parse IR files";
        }

        auto &data_layout = cpp_module->getDataLayout();
        llvm::Triple target_triple { cpp_module->getTargetTriple() };
        llvm::TargetLibraryInfoWrapperPass target_library_info { target_triple };

        llvm_util::initializer llvm_util_initializer { std::cout, data_layout };
        smt::smt_initializer smt_initializer {};

        llvm_util::Verifier verifier { target_library_info, smt_initializer, verifier_buffer };

        Comparer comparer { *cpp_module, *rust_module, opt_cpp_pattern,
                         opt_rust_pattern, verifier, use_specified_function_name,
                         cpp_function_name, rust_function_name };

        auto results = comparer.compare();
        if (!results.success && results.error_message == "multiple functions found") {
            // if multiple functions are found,
            // the verifier will return the corresponding error message.
            verifier_buffer.str("multiple functions found with the provided IRs, "
                                "have you specified the function names for validation?");
        } else if (!results.success && results.error_message.find("function not found") != std::string::npos) {
            // if the function is not found..
            verifier_buffer.str(results.error_message);
        } else if (!results.success && results.error_message.find("no functions found") != std::string::npos) {
            // if no functions are found.. (e.g., rust function without the `pub` keyword)
            verifier_buffer.str("no functions found in the provided IRs, "
                                "please double check your IRs for syntax errors and potential missing keywords. "
                                "(e.g., `pub` keyword for rust function)");
        }
    }

    // cleanup the intermediate files
    std::remove(cpp_file.c_str());
    std::remove(rust_file.c_str());

    return verifier_buffer.str();
}

auto ValidatorServer::handle_generate_request(
        const std::string &cpp_code,
        const std::string &rust_code) const -> std::string {

    std::string separator { "__GENERATED_IR_SEPARATOR__" };

    // generate unique hash for this request
    auto random_hash = generate_random_hash(cpp_code, rust_code);

    // write source files to temp location
    std::string cpp_src = TMP_STORAGE_PREFIX + random_hash + ".cpp";
    std::string rust_src = TMP_STORAGE_PREFIX + random_hash + ".rs";
    std::string cpp_ir = TMP_STORAGE_PREFIX + random_hash + "_cpp.ll";
    std::string rust_ir = TMP_STORAGE_PREFIX + random_hash + "_rs.ll";

    // create and explicitly close the files
    // note: this is important to keep the consistency between macOS and linux when
    //       handling temporary file cleanup.
    {
        std::ofstream cpp_file(cpp_src);
        cpp_file << cpp_code;
        printer_.log("writing to cpp file: " + cpp_src);
        cpp_file.flush();
        cpp_file.close();

        std::ofstream rust_file(rust_src);
        rust_file << rust_code;
        printer_.log("writing to rust file: " + rust_src);
        rust_file.flush();
        rust_file.close();
    }

    // helper function to check if a command exists
    auto command_exists = [](const std::string &cmd) -> bool {
        return std::system(("which " + cmd + " > /dev/null 2>&1").c_str()) == 0;
    };

    // get the timeout command for the current platform
    auto get_timeout_cmd = [&](int timeout_seconds) -> std::string {
        #ifdef __APPLE__
            if (command_exists("gtimeout")) {
                return "gtimeout " + std::to_string(timeout_seconds) + "s ";
            } else if (command_exists("timeout")) {
                return "timeout " + std::to_string(timeout_seconds) + "s ";
            } else {
                printer_.print_info("no timeout command found for macOS, "
                                   "please install gnu-timeout or timeout", true);
                return "";
            }
        #else
            // for all other platforms, use the built-in timeout command.
            if (command_exists("timeout")) {
                return "timeout " + std::to_string(timeout_seconds) + "s ";
            } else {
                printer_.print_info("no timeout command found for your platform, "
                                   "please install timeout", true);
                return "";
            }
        #endif
    };

    // generate IR using the same commands as `scripts/src2ir.py`
    // todo: allows user to specify a specific optimization level
    if (std::system((get_timeout_cmd(10) + "clang++ -O0 -S -emit-llvm " + cpp_src + " -o " + cpp_ir).c_str()) != 0) {
        std::string cpp_compile_error = std::string{ "C++ compilation timed out (10s) or failed. " } +
               "Please check for: 1) syntax errors 2) complex template metaprogramming 3) recursive types.";
        printer_.print_error(cpp_compile_error, true);
        return cpp_compile_error;
    }
    if (std::system((get_timeout_cmd(10) + "rustc --emit=llvm-ir --crate-type=lib " + rust_src + " -o " + rust_ir).c_str()) != 0) {
        std::string rust_compile_error = std::string{ "Rust compilation timed out (10s) or failed. " } +
               "Please check for: 1) syntax errors 2) complex macros 3) type recursion.";
        printer_.print_error(rust_compile_error, true);
        return rust_compile_error;
    }
    printer_.log("generated IR files: `" + cpp_ir + "` and `" + rust_ir + "`");

    // read the generated IR files with security size check
    std::ifstream cpp_ir_file(cpp_ir);
    std::ifstream rust_ir_file(rust_ir);

    // check if the generated IR files exceed the size limit
    auto check_ir_file_size = [&](const std::filesystem::path &path, const std::string &name)
        -> std::pair<bool, std::string> {
        if (std::filesystem::file_size(path) > IR_FILE_SIZE_LIMIT) {
            std::string file_exceeds_error = name + " generated IR file exceeds the size limit (" +
                                                std::to_string(IR_FILE_SIZE_LIMIT) + " bytes), "
                                                "please check your code for complex types or macros.";
            printer_.print_error(file_exceeds_error, true);
            return { true, file_exceeds_error };
        }
        return { false, "" };
    };

    std::filesystem::path cpp_ir_path(cpp_ir);
    std::filesystem::path rust_ir_path(rust_ir);

    auto [cpp_ir_exceeds_limit, cpp_ir_exceeds_error] = check_ir_file_size(cpp_ir_path, "C++");
    if (cpp_ir_exceeds_limit) {
        return cpp_ir_exceeds_error;
    }
    auto [rust_ir_exceeds_limit, rust_ir_exceeds_error] = check_ir_file_size(rust_ir_path, "Rust");
    if (rust_ir_exceeds_limit) {
        return rust_ir_exceeds_error;
    }

    // helper function to cleanup the intermediate files
    auto cleanup_intermediate_files = [&]() {
        std::remove(cpp_src.c_str());
        std::remove(rust_src.c_str());
        std::remove(cpp_ir.c_str());
        std::remove(rust_ir.c_str());
    };

    std::stringstream cpp_ir_content, rust_ir_content;
    cpp_ir_content << cpp_ir_file.rdbuf();
    // there may be discrepancies between the number of characters from `std::stringstream`
    // and the actual bytes read from the file, so we also need to check the length of the string.
    // note: both file_size and string_length share the same limit of `50000`.
    if (cpp_ir_content.str().length() > IR_FILE_SIZE_LIMIT) {
        std::string cpp_ir_length_error = "C++ generated IR file exceeds the length limit (" +
                                           std::to_string(IR_FILE_SIZE_LIMIT) + " bytes), "
                                           "please check your code for complex types or macros.";
        printer_.print_error(cpp_ir_length_error, true);
        cleanup_intermediate_files();
        return cpp_ir_length_error;
    }
    rust_ir_content << rust_ir_file.rdbuf();
    if (rust_ir_content.str().length() > IR_FILE_SIZE_LIMIT) {
        std::string rust_ir_length_error = "Rust generated IR file exceeds the length limit (" +
                                           std::to_string(IR_FILE_SIZE_LIMIT) + " bytes), "
                                           "please check your code for complex types or macros.";
        printer_.print_error(rust_ir_length_error, true);
        cleanup_intermediate_files();
        return rust_ir_length_error;
    }

    // cleanup the generated intermediate files before returning
    cleanup_intermediate_files();

    // return both IRs separated by the separator
    return cpp_ir_content.str() + separator + rust_ir_content.str();
}

int main() {
    ValidatorServer server { 3002 };
    server.start();
    return EXIT_SUCCESS;
}
