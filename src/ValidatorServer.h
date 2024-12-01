#pragma once

#include <string>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <fstream>
#include <sstream>

#include "Printer.h"
#include "Comparer.h"

/// a simple validator server that handles the validate (/api/validate) and
/// generate (/api/generate) requests sent from the relay server, the typical
/// workflow is, i.e.,
///   1. accepts connection (blocks)
///   2. parse the command
///   3. fork new process and call the corresponding handler
///   4. parent process will return to accept new connection
/// the important part is that, each validation/generate request runs in
/// isolation due to alive2's internal bug.
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

    /// handle the validate request sent from the relay server,
    /// will be called in a separate forked process after the VALIDATE command
    /// is properly parsed in `handle_validate_command`.
    auto handle_validate_request(
        const std::string &cpp_ir,
        const std::string &rust_ir,
        const std::string &cpp_function_name,
        const std::string &rust_function_name) const -> std::string;

    /// handle the generate request sent from the relay server,
    /// will be called in a separate forked process after the GENERATE command
    /// is properly parsed in `handle_generate_command`.
    auto handle_generate_request(
        const std::string &cpp_code,
        const std::string &rust_code) const -> std::string;

    /// handle the VALIDATE command sent from the relay server.
    auto handle_validate_command(const std::string &command) const -> std::string;

    /// handle the GENERATE command sent from the relay server.
    auto handle_generate_command(const std::string &command) const -> std::string;

    /// receive the request from the relay server and process it.
    void recv_and_process_relay_server_request(int client_socket);
};
