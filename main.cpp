#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <llvm/IR/Module.h>
#include <llvm/IRReader/IRReader.h>
#include <llvm/Support/SourceMgr.h>
#include "ir/function.h"
#include "ir/memory.h"
#include "smt/smt.h"
#include "tools/transform.h"
#include "util/errors.h"

std::string readFile(const std::string& filename) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        throw std::runtime_error("Unable to open file: " + filename);
    }
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

bool validateTranslation(const std::string& cppIR, const std::string& rustIR) {
    llvm::LLVMContext Context;
    llvm::SMDiagnostic Err;

    std::unique_ptr<llvm::Module> CppModule = llvm::parseIRFile(cppIR, Err, Context);
    if (!CppModule) {
        std::cerr << "Error parsing C++ IR file" << std::endl;
        return false;
    }

    std::unique_ptr<llvm::Module> RustModule = llvm::parseIRFile(rustIR, Err, Context);
    if (!RustModule) {
        std::cerr << "Error parsing Rust IR file" << std::endl;
        return false;
    }

    tools::Transform transform;
    
    // TODO: Populate the transform object with source and target functions
    // This step depends on how to compare the modules
    // Might need to iterate through functions in both modules
    // and create Transform objects for each pair of functions to compare

    // Create a TransformVerify object
    bool check_each_var = true;
    tools::TransformVerify verifier(transform, check_each_var);

    // Verify the transformation
    util::Errors errors = verifier.verify();

    bool equivalent = !errors; // Use the bool operator of Errors

    if (equivalent) {
        std::cout << "Translation is semantically equivalent" << std::endl;
    } else {
        std::cout << "Translation is not semantically equivalent" << std::endl;
        // Print out the errors
        std::cerr << errors << std::endl;
    }

    // Print warnings if any
    if (errors.hasWarnings()) {
        std::cerr << "Warnings:" << std::endl;
        errors.printWarnings(std::cerr);
    }

    return equivalent;
}

int main(int argc, char* argv[]) {
    if (argc != 3) {
        std::cerr << "Usage: " << argv[0] << " <cpp_ir_file> <rust_ir_file>" << std::endl;
        return 1;
    }

    std::string cppIRFile = argv[1];
    std::string rustIRFile = argv[2];

    try {
        bool result = validateTranslation(cppIRFile, rustIRFile);
        return result ? 0 : 1;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}