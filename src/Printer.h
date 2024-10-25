#ifndef PRINTER_H
#define PRINTER_H

#include <iostream>

#include "llvm_util/compare.h"

#define BOLD_YELLOW "\033[1;33m"
#define BOLD_GREEN "\033[1;32m"
#define BOLD_RED "\033[1;31m"
#define BOLD_BLUE "\033[1;34m"
#define RESET_COLOR "\033[0m"

class Printer {
public:
    explicit Printer(std::ostream &os) : os(os) {}

    /// print verification summary
    void print_summary(const llvm_util::Verifier &verifier) const {
        os << BOLD_BLUE << "========================================\n";
        os << "SUMMARY:\n"
           << "  " << BOLD_GREEN << verifier.num_correct << " correct translations\n"
           << "  " << BOLD_RED << verifier.num_unsound << " incorrect translations\n"
           << "  " << BOLD_YELLOW << verifier.num_failed << " failed to prove\n";
        os << RESET_COLOR;
    }

    void print_src_ub_prompt() const {
        os << BOLD_YELLOW
           << "*********************************************************************\n"
           << "* NOTE: undefined behavior detected in the source cpp module,       *\n"
           << "*       switching the order of modules and verifying again.         *\n"
           << "*********************************************************************\n"
           << RESET_COLOR;
    }

    void print_error(const std::string &module_name,
                     const std::string &message) const {
        os << BOLD_RED << "[" << module_name << "] " << message << RESET_COLOR
           << "\n";
    }

private:
    std::ostream &os;
};

#endif  // PRINTER_H
