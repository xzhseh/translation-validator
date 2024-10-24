#include <fstream>
#include <iostream>
#include <sstream>
#include <utility>

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

using namespace tools;
using namespace util;
using namespace std;
using namespace llvm_util;

#define LLVM_ARGS_PREFIX ""
#define ARGS_SRC_TGT
#define ARGS_REFINEMENT
#include "llvm_util/cmd_args_list.h"

#define CPP_MANGLING_PREFIX "_Z"
#define RUST_MANGLING_PREFIX "_ZN"

#include "Printer.h"

namespace {

/// the first positional argument, i.e., the source cpp ir file.
llvm::cl::opt<std::string> opt_cpp_file {
    llvm::cl::Positional,
    llvm::cl::desc("c++ llvm ir file (i.e., add_cpp.ll)"),
    llvm::cl::Required
};

/// the second positional argument, i.e., the target/translated rust ir file.
llvm::cl::opt<std::string> opt_rust_file {
    llvm::cl::Positional,
    llvm::cl::desc("rust llvm ir file (i.e., add_rust.ll)"),
    llvm::cl::Required
};

/// the patterns (i.e., function prefix) to match cpp and rust functions
/// in the provided ir files.
/// note that this could be changed by manually specifying the `-cpp-pattern` and
/// `-rust-pattern` options on the command line when running the translation
/// validator.
///
/// ps. the default values are `_Z` for cpp and `_ZN` for rust.
llvm::cl::opt<std::string> opt_cpp_pattern {
    "cpp-pattern",
    llvm::cl::desc("pattern to match cpp functions in ir file"),
    llvm::cl::init(CPP_MANGLING_PREFIX)
};

llvm::cl::opt<std::string> opt_rust_pattern {
    "rust-pattern",
    llvm::cl::desc("pattern to match rust functions in ir file"),
    llvm::cl::init(RUST_MANGLING_PREFIX)
};

}  // namespace

int main(int argc, char *argv[]) {
    // basic initializations
    llvm::sys::PrintStackTraceOnErrorSignal(argv[0]);
    llvm::InitLLVM X { argc, argv };
    llvm::EnableDebugBuffering = true;
    llvm::LLVMContext Context {};

    // parse command line arguments for the input files and (potential) patterns
    llvm::cl::ParseCommandLineOptions(argc, argv);

    auto cppModule = openInputFile(Context, opt_cpp_file);
    auto rustModule = openInputFile(Context, opt_rust_file);
    
    // set up the target library info by the data layout and target triple from `cppModule`.
    // note: `targetLibraryInfo` is needed for different platforms.
    auto &dataLayout = cppModule->getDataLayout();
    llvm::Triple targetTriple { cppModule->getTargetTriple() };
    llvm::TargetLibraryInfoWrapperPass targetLibraryInfo { targetTriple };
    
    // initialize the llvm utilities and smt solver (i.e., z3).
    llvm_util::initializer llvmUtilInitializer { std::cout, dataLayout };
    smt::smt_initializer smtInitializer {};

    // set up the verifier to compare the cpp and rust functions in llvm ir level.
    Verifier verifier { targetLibraryInfo, smtInitializer, std::cout };

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

    Printer printer { std::cout };
    printer.printSummary(verifier);

    return verifier.num_errors > 0;
}
