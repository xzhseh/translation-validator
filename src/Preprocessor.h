#ifndef PREPROCESSOR_H
#define PREPROCESSOR_H

#include <filesystem>
#include <iostream>
#include <string>
#include <vector>

const std::string DEFAULT_IR_DIR = "examples/ir/";
const std::string CPP_IR_SUFFIX = "_cpp.ll";
const std::string RUST_IR_SUFFIX = "_rust.ll";

static std::string cpp_path_;
static std::string rust_path_;

class Preprocessor {
public:
    Preprocessor(int argc, char *argv[]) {
        if (argc != 2) {
            print_error("preprocessor expects exactly 2 arguments");
            exit(1);
        }
        base_name_ = std::string(argv[1]);
    }

    auto process(std::vector<char *> &argv) -> bool {
        if (argv.size() != 1) {
            print_error("expect argv vector to have exactly 1 element, i.e., argv[0].");
            exit(1);
        }

        cpp_path_ = DEFAULT_IR_DIR + base_name_ + CPP_IR_SUFFIX;
        rust_path_ = DEFAULT_IR_DIR + base_name_ + RUST_IR_SUFFIX;

        argv.push_back(&cpp_path_[0]);
        argv.push_back(&rust_path_[0]);

        return check_ir_file_exists(cpp_path_, true) &&
               check_ir_file_exists(rust_path_, false);
    }

private:
    auto check_ir_file_exists(const std::string &path, bool is_cpp) -> bool {
        if (!std::filesystem::exists(path)) {
            auto message = get_language_name(is_cpp) + " ir file not found: " + str_path(path);
            print_error(message);
            message = std::string("please generate the ") + get_language_name(is_cpp) +
                      " ir file for " + str_path(path);
            print_error(message);
            return false;
        }
        return true;
    }

    auto get_language_name(bool is_cpp) -> std::string {
        return is_cpp ? "cpp" : "rust";
    }

    auto str_path(const std::string &path_name) -> std::string {
        return std::string("`") + path_name + std::string("`");
    }

    void print_error(const std::string &message) {
        std::cerr << "[preprocessor] " << message << "\n";
    }

    std::string base_name_ { "" };
};

#endif  // PREPROCESSOR_H
