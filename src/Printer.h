#ifndef PRINTER_H
#define PRINTER_H

#include <iostream>
#include <fstream>
#include <functional>
#include <fcntl.h>
#include <errno.h>
#include <unistd.h>
#include <pwd.h>
#include <mutex>

#define BOLD_YELLOW "\033[1;33m"
#define BOLD_GREEN "\033[1;32m"
#define P_GREEN "\033[0;32m"
#define BOLD_RED "\033[1;31m"
#define BOLD_BLUE "\033[1;34m"
#define RESET_COLOR "\033[0m"

struct ComparisonResult {
    bool success;
    std::string cpp_name;
    std::string rust_name;
    std::string error_message;
};

class Printer {
public:
    explicit Printer(std::ostream &os,
                     std::string module_name = "",
                     std::string log_storage_prefix = "",
                     std::string log_file_name = "") :
        os_(os),
        module_name_(module_name),
        log_storage_prefix_(log_storage_prefix),
        log_file_name_(log_file_name) {}

    /// print verification summary
    void print_summary(const size_t num_correct,
                       const size_t num_unsound,
                       const size_t num_failed,
                       const ComparisonResult &result,
                       const std::string &verifier_output = "") const {
        if (!verifier_output.empty()) {
            os_ << verifier_output << std::endl;
        }

        os_ << BOLD_BLUE << "========================================\n";
        os_ << "COMPARING:\n"
           << "  " << result.cpp_name << BOLD_GREEN << " (source)" << BOLD_BLUE
           << " <-> " << result.rust_name << BOLD_GREEN << " (target)"
           << RESET_COLOR << "\n";
        if (!result.error_message.empty()) {
            os_ << BOLD_RED << "  error: " << result.error_message << "\n";
        }
        os_ << BOLD_BLUE;
        os_ << "SUMMARY:\n"
           << "  " << BOLD_GREEN << num_correct << " correct translations\n"
           << "  " << BOLD_RED << num_unsound << " incorrect translations\n"
           << "  " << BOLD_YELLOW << num_failed << " failed to prove\n";
        os_ << RESET_COLOR;
    }

    void print_src_ub_prompt() const {
        os_ << BOLD_YELLOW
           << "*********************************************************************\n"
           << "* NOTE: undefined behavior detected in the source cpp module,       *\n"
           << "*       switching the order of modules and verifying again.         *\n"
           << "*********************************************************************\n"
           << RESET_COLOR;
    }

    void print_error(const std::string &message, bool log_to_file = false) const {
        os_ << BOLD_RED << "[" << module_name_ << "::ERROR] " << message << RESET_COLOR
           << "\n";
        if (log_to_file) {
            write_log(message);
        }
    }

    void print_info(const std::string &message, bool log_to_file = false) const {
        os_ << P_GREEN << "[" << module_name_ << "::INFO] " << message << RESET_COLOR << "\n";
        if (log_to_file) {
            write_log(message);
        }
    }

    void log(const std::string &message, bool log_to_file = true) const {
        os_ << P_GREEN << "[" << module_name_ << "::LOG] " << message
           << RESET_COLOR << "\n";
        if (log_to_file) {
            write_log(message);
        }
    }

    void write_log(const std::string &message) const {
        // for multi-threaded logging, this does not interfere/affect
        // the file level locking for multi-process scenario since each process
        // has its own forked mutex.
        std::lock_guard<std::mutex> lock_guard { thread_log_mutex_ };

        if (log_storage_prefix_.empty() || log_file_name_.empty()) {
            // do not write log if the log storage prefix or file name is not set
            return;
        }

        // ensure the log storage directory exists
        if (!std::filesystem::exists(log_storage_prefix_)) {
            bool result = std::filesystem::create_directories(log_storage_prefix_);
            if (!result && !std::filesystem::exists(log_storage_prefix_)) {
                // to prevent the strange (potential caching) error of the incorrect
                // return value of `std::filesystem::create_directories`, we check
                // both to ensure the directory does not exist.
                print_error("failed to create log storage directory: " +
                            log_storage_prefix_);
            }
        }

        std::string log_path { log_storage_prefix_ + log_file_name_ };

        // use O_APPEND to ensure atomic appends
        int fd { open(log_path.c_str(), O_WRONLY | O_APPEND | O_CREAT, 0644) };
        if (fd == -1) {
            print_error("failed to open log file: " + std::string(strerror(errno)));
            return;
        }

        // RAII wrapper for file descriptor
        struct FileGuard {
            int fd;
            ~FileGuard() { if (fd != -1) close(fd); }
        } guard{ fd };

        // acquire exclusive lock
        struct flock lock {
            .l_type = F_WRLCK,
            .l_whence = SEEK_SET,
            .l_start = 0,
            // lock the entire file
            .l_len = 0
        };

        if (fcntl(fd, F_SETLKW, &lock) == -1) {
            return;
        }

        // get the current timestamp
        auto now { std::chrono::system_clock::now() };
        auto time { std::chrono::system_clock::to_time_t(now) };
        std::string timestamp { std::ctime(&time) };
        // remove the newline character at the end of the timestamp
        timestamp.pop_back();

        // prepare the log entry
        std::string log_entry { "[" + timestamp + "] " + message + "\n" };

        // write the log entry atomically
        if (write(fd, log_entry.c_str(), log_entry.length()) == -1) {
            print_error("failed to write to log file: " + std::string(strerror(errno)));
        }
    }

private:
    std::ostream &os_;
    std::string module_name_;
    std::string log_storage_prefix_;
    std::string log_file_name_;
    mutable std::mutex thread_log_mutex_;
};
#endif  // PRINTER_H
