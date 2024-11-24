#include "ValidatorServer.h"

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

ValidatorServer::ValidatorServer(int port) 
    : port_(port)
    , printer_(std::cout, "validator_server")
    , server_fd_(socket(AF_INET, SOCK_STREAM, 0))
    , address_ {
        .sin_family = AF_INET,
        .sin_addr = { .s_addr = INADDR_ANY },
        .sin_port = htons(port)
    }
{
    if (server_fd_ < 0) {
        printer_.print_error("failed to create socket");
    }

    // check bind result
    if (::bind(server_fd_, reinterpret_cast<struct sockaddr*>(&address_), sizeof(address_)) < 0) {
        close(server_fd_);
        printer_.print_error("failed to bind to port " + std::to_string(port));
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
                       std::string("http://127.0.0.1:") + std::to_string(port_) + std::string("/"));

    while (true) {
        struct sockaddr_in client_addr {};
        socklen_t client_len = sizeof(client_addr);
        int client_socket = accept(server_fd_, (struct sockaddr*) &client_addr, &client_len);
        
        if (client_socket < 0) {
            printer_.print_error("failed to accept client connection");
            continue;
        }
        
        printer_.log("accepted client connection from socket " + std::to_string(client_socket));
        process_client(client_socket);
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
/// <length><blankspace><message>
/// where <length> is the exact length of the <message>.
bool read_relay_message(int client_socket, std::string &buffer) {
    // first read the length of the message
    size_t n { 0 };
    char length_buffer[9] { 0 };

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
            if (n > 8) {
                // length buffer overflow
                return false;
            }
        }
    }

    return true;
}

void ValidatorServer::process_client(int client_socket) {
    std::string buffer {};
    if (!read_relay_message(client_socket, buffer)) {
        printer_.print_error("failed to read message from client");
        close(client_socket);
        return;
    }

    std::string command { std::move(buffer) };
    std::string result {};
    if (command.starts_with("VALIDATE")) {
        // <VALIDATE>__CPPIR__<cpp_ir>__RUSTIR__<rust_ir>__FUNCTION__<function_name>
        std::string cpp_ir_separator { "__CPPIR__" };
        std::string rust_ir_separator { "__RUSTIR__" };
        std::string function_name_separator { "__FUNCTION__" };

        size_t pos1 = command.find(cpp_ir_separator);
        size_t pos2 = command.find(rust_ir_separator, pos1 + cpp_ir_separator.length());
        size_t pos3 = command.find(function_name_separator, pos2 + rust_ir_separator.length());

        std::string cpp_ir = command.substr(pos1 + cpp_ir_separator.length(), pos2 - pos1 - cpp_ir_separator.length());
        std::string rust_ir = command.substr(pos2 + rust_ir_separator.length(), pos3 - pos2 - rust_ir_separator.length());
        std::string function_name = command.substr(pos3 + function_name_separator.length());

        result = handle_validate_request(cpp_ir, rust_ir, function_name);
    } else if (command.starts_with("GENERATE")) {
        // <GENERATE>__CPPCODE__<cpp_code>__RUSTCODE__<rust_code>
        std::string cpp_code_separator { "__CPPCODE__" };
        std::string rust_code_separator { "__RUSTCODE__" };

        size_t pos1 = command.find(cpp_code_separator);
        size_t pos2 = command.find(rust_code_separator, pos1 + cpp_code_separator.length());

        std::string cpp_code = command.substr(pos1 + cpp_code_separator.length(), pos2 - pos1 - cpp_code_separator.length());
        std::string rust_code = command.substr(pos2 + rust_code_separator.length());

        result = handle_generate_request(cpp_code, rust_code);
    }

    // send the result back to the client
    std::string validator_message { std::to_string(result.length()) + " " + std::move(result) };
    send(client_socket, validator_message.c_str(), validator_message.length(), 0);
    close(client_socket);
}

auto open_input_file(llvm::LLVMContext &context,
                     const std::string &path) -> std::unique_ptr<llvm::Module> {
    llvm::SMDiagnostic err {};
    auto module = llvm::parseIRFile(path, err, context);

    if (!module) {
        err.print("open_input_file", llvm::errs());
        return nullptr;
    }

    return module;
}

auto ValidatorServer::handle_validate_request(
    const std::string &cpp_ir, 
    const std::string &rust_ir,
    const std::string &function_name) -> std::string {

    // write IR to temporary files
    std::string cpp_file = "/tmp/__validator_server_cpp_ir.ll";
    std::string rust_file = "/tmp/__validator_server_rust_ir.ll";
    std::ofstream(cpp_file) << cpp_ir;
    std::ofstream(rust_file) << rust_ir;

    // set up validation components
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

    std::stringstream verifier_buffer;
    llvm_util::Verifier verifier { target_library_info, smt_initializer, verifier_buffer };

    Comparer comparer { *cpp_module, *rust_module, opt_cpp_pattern,
                       opt_rust_pattern, verifier, !function_name.empty(),
                       function_name, function_name };

    auto results = comparer.compare();
    return verifier_buffer.str();
}

auto ValidatorServer::handle_generate_request(
    const std::string &cpp_code,
    const std::string &rust_code) -> std::string {

    std::string separator { "__GENERATED_IR_SEPARATOR__" };

    // write source files to temp location
    std::string cpp_src = "/tmp/validator_server_temp.cpp";
    std::string rust_src = "/tmp/validator_server_temp.rs";
    std::string cpp_ir = "/tmp/validator_server_temp_cpp.ll";
    std::string rust_ir = "/tmp/validator_server_temp_rs.ll";

    // write the source code
    std::ofstream(cpp_src) << cpp_code;
    std::ofstream(rust_src) << rust_code;

    // generate IR using the same commands as `scripts/src2ir.py`
    if (system(("clang++ -O0 -S -emit-llvm " + cpp_src + " -o " + cpp_ir).c_str()) != 0) {
        return "failed to generate C++ IR";
    }
    if (system(("rustc --emit=llvm-ir --crate-type=lib " + rust_src + " -o " + rust_ir).c_str()) != 0) {
        return "failed to generate Rust IR";
    }
    printer_.log("generated IR files: `" + cpp_ir + "` and `" + rust_ir + "`");

    // read the generated IR files
    std::ifstream cpp_ir_file(cpp_ir);
    std::ifstream rust_ir_file(rust_ir);
    std::stringstream cpp_ir_content, rust_ir_content;
    cpp_ir_content << cpp_ir_file.rdbuf();
    rust_ir_content << rust_ir_file.rdbuf();

    // return both IRs separated by the separator
    return cpp_ir_content.str() + separator + rust_ir_content.str();
}

int main() {
    ValidatorServer server { 3002 };
    server.start();
    return 0;
}
