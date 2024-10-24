#ifndef PREPROCESSOR_H
#define PREPROCESSOR_H

#include <string>
#include <filesystem>
#include <iostream>

class Preprocessor {
public:
    Preprocessor(const std::string& cpp_source, const std::string& rust_source)
        : cpp_source_(cpp_source), rust_source_(rust_source) {}

    bool process(std::string& cpp_ir, std::string& rust_ir) {
        cpp_ir = "examples/" + getBaseName(cpp_source_) + "_cpp.ll";
        rust_ir = "examples/" + getBaseName(rust_source_) + "_rust.ll";

        if (!std::filesystem::exists(cpp_ir)) {
            std::cerr << "IR file not found: " << cpp_ir << "\n";
            std::cerr << "Please generate the IR file for " << cpp_source_ << "\n";
            return false;
        }

        if (!std::filesystem::exists(rust_ir)) {
            std::cerr << "IR file not found: " << rust_ir << "\n";
            std::cerr << "Please generate the IR file for " << rust_source_ << "\n";
            return false;
        }

        return true;
    }

private:
    std::string getBaseName(const std::string& path) {
        return std::filesystem::path(path).stem().string();
    }

    std::string cpp_source_;
    std::string rust_source_;
};

#endif // PREPROCESSOR_H
