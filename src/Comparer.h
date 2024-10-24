#ifndef COMPARER_H
#define COMPARER_H

#include <string>
#include <vector>

#include "llvm/IR/Module.h"
#include "llvm/Support/CommandLine.h"
#include "llvm_util/compare.h"

class Comparer {
public:
    struct ComparisonResult {
        bool success;
        std::string cpp_name;
        std::string rust_name;
        std::string error_message;
    };

    Comparer(llvm::Module &cpp_module, llvm::Module &rust_module,
             llvm::cl::opt<std::string> &cpp_pattern,
             llvm::cl::opt<std::string> &rust_pattern,
             llvm_util::Verifier &verifier)
        : cpp_module_(&cpp_module),
          rust_module_(&rust_module),
          cpp_pattern_(cpp_pattern),
          rust_pattern_(rust_pattern),
          verifier_(verifier) {}

    // Compare all functions and return results
    std::vector<ComparisonResult> compare() {
        std::vector<ComparisonResult> results;

        for (auto &cpp_func : *cpp_module_) {
            if (should_skip_function(cpp_func)) continue;

            auto result = find_and_compare_matching_function(cpp_func);
            if (result.has_value()) {
                results.push_back(std::move(*result));
            }
        }

        return results;
    }

   private:
    bool should_skip_function(const llvm::Function &func) const {
        return func.isDeclaration() ||
               !func.getName().starts_with(cpp_pattern_);
    }

    std::optional<ComparisonResult> find_and_compare_matching_function(
        llvm::Function &cpp_func) {
        for (auto &rust_func : *rust_module_) {
            if (rust_func.isDeclaration()) continue;
            if (!rust_func.getName().starts_with(rust_pattern_)) continue;

            ComparisonResult result;
            result.cpp_name = cpp_func.getName().str();
            result.rust_name = rust_func.getName().str();

            try {
                result.success =
                    verifier_.compareFunctions(cpp_func, rust_func);
                if (!result.success) {
                    result.error_message = "Functions are not equivalent";
                }
                return result;
            } catch (const std::exception &e) {
                result.success = false;
                result.error_message = e.what();
                return result;
            }
        }

        return std::nullopt;  // No matching Rust function found
    }

private:
    llvm::Module *cpp_module_;
    llvm::Module *rust_module_;
    std::string cpp_pattern_;
    std::string rust_pattern_;
    llvm_util::Verifier &verifier_;
};

#endif  // COMPARER_H
