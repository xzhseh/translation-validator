#ifndef PRINTER_H
#define PRINTER_H

#include <iostream>

#include "llvm_util/compare.h"

class Printer {
public:
    explicit Printer(std::ostream &os) : os(os) {}

    /// print verification summary
    void print_summary(const llvm_util::Verifier &verifier) const {
        os << "----------------------------------------\n";
        os << "summary:\n"
           << "  " << verifier.num_correct << " correct translations\n"
           << "  " << verifier.num_unsound << " incorrect translations\n"
           << "  " << verifier.num_failed << " failed to prove\n";
    }

private:
    std::ostream &os;
};

#endif  // PRINTER_H
