#include <iostream>

#include "llvm_util/compare.h"
#include "llvm_util/llvm2alive.h"
#include "llvm_util/llvm_optimizer.h"
#include "llvm_util/utils.h"
#include "smt/smt.h"

#include "llvm/Analysis/TargetLibraryInfo.h"
#include "llvm/Bitcode/BitcodeReader.h"
#include "llvm/IR/Function.h"
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/LegacyPassManager.h"
#include "llvm/IR/Module.h"
#include "llvm/IRReader/IRReader.h"
#include "llvm/Passes/PassBuilder.h"
#include "llvm/Support/InitLLVM.h"
#include "llvm/Support/Signals.h"
#include "llvm/TargetParser/Triple.h"
#include "llvm/Transforms/Utils/Cloning.h"

using namespace std;

#define LLVM_ARGS_PREFIX ""
#define ARGS_SRC_TGT
#define ARGS_REFINEMENT
#include <fstream>
#include "llvm_util/cmd_args_list.h"

constexpr auto CPP_MANGLING_PREFIX = "_Z";
constexpr auto RUST_MANGLING_PREFIX = "_ZN";

#include "Comparer.h"
#include "Printer.h"
#include "Preprocessor.h"

namespace {

/// the patterns (i.e., function prefix) to match cpp and rust functions
/// in the provided ir files.
/// note that this could be changed by manually specifying the `-cpp-pattern`
/// and
/// `-rust-pattern` options on the command line when running the translation
/// validator.
///
/// ps. the default values are `_Z` for cpp and `_ZN` for rust.
llvm::cl::opt<std::string> opt_cpp_pattern {
    "cpp-pattern", llvm::cl::desc("pattern to match cpp functions in ir file"),
    llvm::cl::init(CPP_MANGLING_PREFIX)
};

llvm::cl::opt<std::string> opt_rust_pattern {
    "rust-pattern",
    llvm::cl::desc("pattern to match rust functions in ir file"),
    llvm::cl::init(RUST_MANGLING_PREFIX)
};

}  // namespace

void print_error(const std::string &message) {
    std::cerr << "[main] " << message << "\n";
}

auto open_input_file(llvm::LLVMContext &context,
                     const std::string &path) -> std::unique_ptr<llvm::Module> {
    llvm::SMDiagnostic err {};
    auto module = llvm::parseIRFile(path, err, context);

    if (!module) {
        err.print("open_input_file", llvm::errs());
        return nullptr;
    }

    return module;
}

int main(int argc, char *argv[]) {
    // basic initializations
    llvm::sys::PrintStackTraceOnErrorSignal(argv[0]);
    llvm::InitLLVM init_llvm { argc, argv };
    llvm::EnableDebugBuffering = true;
    llvm::LLVMContext context {};

    // preprocess the command line arguments
    Preprocessor preprocessor { argc, argv };
    std::vector<char *> preprocessed_argv { argv[0] };
    if (!preprocessor.process(preprocessed_argv)) {
        print_error("preprocess failed");
        return EXIT_FAILURE;
    }

    auto cpp_module = open_input_file(context, preprocessed_argv[1]);
    auto rust_module = open_input_file(context, preprocessed_argv[2]);
    if (!cpp_module || !rust_module) {
        print_error("failed to open input files");
        return EXIT_FAILURE;
    }

    // set up the target library info by the data layout and target triple from
    // `cpp_module`. note: `target_library_info` is needed for different
    // platforms.
    auto &data_layout = cpp_module->getDataLayout();
    llvm::Triple target_triple { cpp_module->getTargetTriple() };
    llvm::TargetLibraryInfoWrapperPass target_library_info { target_triple };

    // initialize the llvm utilities and smt solver (i.e., z3).
    llvm_util::initializer llvm_util_initializer { std::cout, data_layout };
    smt::smt_initializer smt_initializer {};

    // set up the verifier to compare the cpp and rust functions in llvm ir
    // level.
    llvm_util::Verifier verifier {target_library_info, smt_initializer, std::cout };

    Comparer comparer {*cpp_module, *rust_module, opt_cpp_pattern,
                      opt_rust_pattern, verifier };
    auto results = comparer.compare();

    Printer printer { std::cout };
    printer.print_summary(verifier);

    return verifier.num_errors > 0;
}
