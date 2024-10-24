#ifndef PRINTER_H
#define PRINTER_H

#include <iostream>

#include "llvm_util/compare.h"

class Printer {
public:
    explicit Printer(std::ostream &os) : os(os) {}

    /// print verification summary
    void printSummary(const llvm_util::Verifier &verifier) const {
        os << "----------------------------------------\n";
        os << "Summary:\n"
           << "  " << verifier.num_correct << " correct translations\n"
           << "  " << verifier.num_unsound << " incorrect translations\n"
           << "  " << verifier.num_failed << " failed to prove\n";
    }

    /// print function comparison header
    void printComparisonHeader(const std::string &cppName, const std::string &rustName) const {
        os << "Comparing functions:\n"
           << "  C++: " << cppName << "\n"
           << "  Rust: " << rustName << "\n";
    }

    /// print verification result
    void printVerificationResult(bool success) const {
        os << (success ? "Transformation seems to be correct!\n" 
                      : "Transformation verification failed!\n");
    }

private:
    std::ostream &os;
};

#endif // PRINTER_H
