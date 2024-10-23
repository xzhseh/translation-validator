#include "cache/cache.h"
#include "llvm_util/compare.h"
#include "llvm_util/llvm2alive.h"
#include "llvm_util/llvm_optimizer.h"
#include "llvm_util/utils.h"
#include "smt/smt.h"
#include "tools/transform.h"
#include "util/version.h"

#include "llvm/Analysis/TargetLibraryInfo.h"
#include "llvm/Bitcode/BitcodeReader.h"
#include "llvm/InitializePasses.h"
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/Function.h"
#include "llvm/IR/Module.h"
#include "llvm/IR/LegacyPassManager.h"
#include "llvm/IRReader/IRReader.h"
#include "llvm/Passes/PassBuilder.h"
#include "llvm/Support/InitLLVM.h"
#include "llvm/Support/Signals.h"
#include "llvm/TargetParser/Triple.h"
#include "llvm/Transforms/Utils/Cloning.h"

#include <fstream>
#include <iostream>
#include <sstream>
#include <utility>

using namespace tools;
using namespace util;
using namespace std;
using namespace llvm_util;

#define LLVM_ARGS_PREFIX ""
#define ARGS_SRC_TGT
#define ARGS_REFINEMENT
#include "llvm_util/cmd_args_list.h"

namespace {
llvm::cl::opt<std::string> opt_cpp_file(llvm::cl::Positional,
    llvm::cl::desc("C++ bitcode file"),
    llvm::cl::Required);

llvm::cl::opt<std::string> opt_rust_file(llvm::cl::Positional,
    llvm::cl::desc("Rust bitcode file"),
    llvm::cl::Required);

// Add options for function name patterns
llvm::cl::opt<std::string> opt_cpp_pattern("cpp-pattern",
    llvm::cl::desc("Pattern to match C++ functions"),
    llvm::cl::init("_Z"));

llvm::cl::opt<std::string> opt_rust_pattern("rust-pattern",
    llvm::cl::desc("Pattern to match Rust functions"),
    llvm::cl::init("_ZN"));
}

int main(int argc, char **argv) {
    // Proper initialization
    llvm::sys::PrintStackTraceOnErrorSignal(argv[0]);
    llvm::InitLLVM X(argc, argv);
    llvm::EnableDebugBuffering = true;
    llvm::LLVMContext Context;

    // Parse command line
    llvm::cl::ParseCommandLineOptions(argc, argv);

    // Load modules
    auto cppModule = openInputFile(Context, opt_cpp_file);
    auto rustModule = openInputFile(Context, opt_rust_file);
    
    // Setup verifier
    auto &DL = cppModule->getDataLayout();
    llvm::Triple targetTriple(cppModule->getTargetTriple());
    llvm::TargetLibraryInfoWrapperPass TLI(targetTriple);
    
    llvm_util::initializer llvm_util_init(std::cout, DL);
    smt::smt_initializer smt_init;
    Verifier verifier(TLI, smt_init, std::cout);

    // Compare functions
    for (auto &cppFunc : *cppModule) {
        if (cppFunc.isDeclaration()) continue;
        if (!cppFunc.getName().starts_with(opt_cpp_pattern)) continue;

        // Find matching Rust function
        for (auto &rustFunc : *rustModule) {
            if (rustFunc.isDeclaration()) continue;
            if (!rustFunc.getName().starts_with(opt_rust_pattern)) continue;

            if (!verifier.compareFunctions(cppFunc, rustFunc)) {
                // Handle verification failure
            }
        }
    }

    // Print summary
    std::cout << "Summary:\n"
              << "  " << verifier.num_correct << " correct translations\n"
              << "  " << verifier.num_unsound << " incorrect translations\n"
              << "  " << verifier.num_failed << " failed to prove\n";

    return verifier.num_errors > 0;
}
