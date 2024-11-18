#ifndef COMPARER_H
#define COMPARER_H

#include <string>
#include <vector>

#include "llvm/IR/Module.h"
#include "llvm/Support/CommandLine.h"
#include "llvm_util/compare.h"

#include "Printer.h"

class Comparer {
public:
    Comparer(llvm::Module &cpp_module, llvm::Module &rust_module,
             llvm::cl::opt<std::string> &cpp_pattern,
             llvm::cl::opt<std::string> &rust_pattern,
             llvm_util::Verifier &verifier)
        : cpp_module_(&cpp_module),
          rust_module_(&rust_module),
          cpp_pattern_(cpp_pattern),
          rust_pattern_(rust_pattern),
          verifier_(verifier),
          printer_(std::cout, "comparer") {}

    /// compare the source function in `cpp_module` with the target function
    /// in `rust_module`.
    /// note: currently only supports one-to-one comparison.
    ComparisonResult compare() {
        std::vector<llvm::Function *> cpp_funcs {};
        std::vector<llvm::Function *> rust_funcs {};

        for (auto &cpp_func : *cpp_module_) {
            if (should_skip_function(cpp_func, cpp_pattern_)) {
                continue;
            }
            cpp_funcs.push_back(&cpp_func);
        }
        for (auto &rust_func : *rust_module_) {
            if (should_skip_function(rust_func, rust_pattern_)) {
                continue;
            }
            rust_funcs.push_back(&rust_func);
        }

        if (auto cpp_empty = check_empty(cpp_funcs)) {
            return *cpp_empty;
        }
        if (auto rust_empty = check_empty(rust_funcs)) {
            return *rust_empty;
        }
        if (auto cpp_multiple = check_multiple(cpp_funcs)) {
            return *cpp_multiple;
        }
        if (auto rust_multiple = check_multiple(rust_funcs)) {
            return *rust_multiple;
        }

        auto cpp_func = cpp_funcs[0];
        auto rust_func = rust_funcs[0];

        bool success { false };
        try {
            success = verifier_.compareFunctions(*cpp_func, *rust_func);
        } catch (const std::exception &e) {
            printer_.print_error(e.what());
            return ComparisonResult {
                .success = false,
                .error_message = e.what()
            };
        }

        return ComparisonResult {
            .success = success,
            .cpp_name = cpp_func->getName().str(),
            .rust_name = rust_func->getName().str(),
            .error_message = success ? "" : "functions are not semantically equivalent"
        };
    }

private:
    /// check if the function should be skipped
    auto should_skip_function(const llvm::Function &func,
                              const std::string &pattern) -> bool const {
        return func.isDeclaration() || !func.getName().starts_with(pattern);
    }

    auto check_empty(const std::vector<llvm::Function *> &funcs)
        -> std::optional<ComparisonResult> {
        if (funcs.empty()) {
            printer_.print_error("no functions found");
            return ComparisonResult {
                .success = false,
                .error_message = "no functions found"
            };
        }
        return std::nullopt;
    }

    auto check_multiple(const std::vector<llvm::Function *> &funcs)
        -> std::optional<ComparisonResult> {
        if (funcs.size() > 1) {
            printer_.print_error("multiple functions found");
            return ComparisonResult {
                .success = false,
                .error_message = "multiple functions found"
            };
        }
        return std::nullopt;
    }

    llvm::Module *cpp_module_;
    llvm::Module *rust_module_;
    std::string cpp_pattern_;
    std::string rust_pattern_;
    llvm_util::Verifier &verifier_;
    Printer printer_;
};

#endif  // COMPARER_H
