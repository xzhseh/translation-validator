#pragma once

#include <string>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <fstream>
#include <sstream>

#include "Printer.h"
#include "Comparer.h"

class ValidatorServer {
public:
    ValidatorServer(int port);
    ~ValidatorServer();
    void start();

private:
    int server_fd_;
    int port_;
    struct sockaddr_in address_;
    Printer printer_;

    auto handle_validate_request(
        const std::string &cpp_ir,
        const std::string &rust_ir,
        const std::string &function_name) -> std::string;

    auto handle_generate_request(
        const std::string &cpp_code,
        const std::string &rust_code) -> std::string;

    void process_client(int client_socket);
};
