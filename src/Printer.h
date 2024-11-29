#ifndef PRINTER_H
#define PRINTER_H

#include <iostream>
#include <functional>

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
    explicit Printer(std::ostream &os, std::string module_name = "") :
        os_(os),
        module_name_(module_name) {}

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

    void print_error(const std::string &message,
                     std::function<void(const std::string &)> logging_hook = nullptr) const {
        os_ << BOLD_RED << "[" << module_name_ << "] " << message << RESET_COLOR
           << "\n";
        if (logging_hook) {
            logging_hook(message);
        }
    }

    void print_info(const std::string &message,
                    std::function<void(const std::string &)> logging_hook = nullptr) const {
        os_ << P_GREEN << "[" << module_name_ << "] " << message << RESET_COLOR << "\n";
        if (logging_hook) {
            logging_hook(message);
        }
    }

    void log(const std::string &message,
             std::function<void(const std::string &)> logging_hook = nullptr) const {
        os_ << P_GREEN << "[" << module_name_ << "::LOG] " << message
           << RESET_COLOR << "\n";
        if (logging_hook) {
            logging_hook(message);
        }
    }

private:
    std::ostream &os_;
    std::string module_name_;
};
#endif  // PRINTER_H

