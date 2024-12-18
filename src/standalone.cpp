#include <sstream>

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
constexpr auto SRC_UB_PROMPT = "WARNING: Source function is always UB";

#include "Comparer.h"
#include "Printer.h"
#include "Preprocessor.h"

namespace {

/// the patterns (i.e., function prefix) to match cpp and rust functions
/// in the provided ir files.
/// ps. the values are `_Z` for cpp and `_ZN` for rust.
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
    Printer printer { std::cout, "standalone" };

    // preprocess the command line arguments
    Preprocessor preprocessor { argc, argv };
    auto [cpp_func_name, rust_func_name] = preprocessor.get_function_names();
    bool use_specified_function_name = preprocessor.use_specified_function_name();
    std::vector<char *> preprocessed_argv { argv[0] };
    if (!preprocessor.process(preprocessed_argv)) {
        printer.print_error("preprocess failed");
        return EXIT_FAILURE;
    }

    auto cpp_module = open_input_file(context, preprocessed_argv[1]);
    auto rust_module = open_input_file(context, preprocessed_argv[2]);
    if (!cpp_module || !rust_module) {
        printer.print_error("failed to open input files");
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
    std::stringstream verifier_buffer {};
    llvm_util::Verifier verifier { target_library_info, smt_initializer,
                                  verifier_buffer };

    Comparer comparer { *cpp_module, *rust_module, opt_cpp_pattern,
                        opt_rust_pattern, verifier, use_specified_function_name,
                        cpp_func_name, rust_func_name };
    auto results = comparer.compare();
    if (!results.success && results.error_message.find("multiple functions") != std::string::npos) {
        // indicates the multiple functions are found, but no function name has
        // been specified with the corresponding options.
        return EXIT_FAILURE;
    }

    // check for potential source undefined behavior
    std::string verifier_output { verifier_buffer.str() };
    if (verifier_output.find(SRC_UB_PROMPT) != std::string::npos) {
        printer.print_src_ub_prompt();

        llvm_util::Verifier reversed_verifier { target_library_info,
                                                 smt_initializer,
                                                 std::cout };

        // switch the order of modules
        Comparer reversed_comparer { *rust_module, *cpp_module, opt_rust_pattern,
                                       opt_cpp_pattern, reversed_verifier };
        auto reversed_results = reversed_comparer.compare();

        printer.print_summary(reversed_verifier.num_correct,
                              reversed_verifier.num_unsound,
                              reversed_verifier.num_failed, reversed_results);
        return reversed_verifier.num_errors > 0;
    } else {
        printer.print_summary(verifier.num_correct, verifier.num_unsound,
                              verifier.num_failed, results, verifier_output);
        return verifier.num_errors > 0;
    }
}
