#ifndef PREPROCESSOR_H
#define PREPROCESSOR_H

#include <cstdlib>
#include <filesystem>
#include <iostream>
#include <string>
#include <vector>

#include "Printer.h"

const std::string DEFAULT_IR_DIR = "examples/ir/";
const std::string FIXED_IR_DIR = "examples/ir_fixed/";

const std::string CPP_IR_SUFFIX = "_cpp.ll";
const std::string RUST_IR_SUFFIX = "_rs.ll";
const std::string FIXED_CPP_IR_SUFFIX = "_cpp_fixed.ll";

static std::string cpp_path_;
static std::string rust_path_;

class Preprocessor {
public:
    Preprocessor(int argc, char *argv[]) {
        if (argc != 2 && argc != 3) {
            printer_.print_error("preprocessor expects at most 3 arguments");
            exit(EXIT_FAILURE);
        }
        base_name_ = std::string(argv[1]);
        if (argc == 3) {
            // todo: refactor this part
            if (std::string(argv[2]) == "--fixed") {
                is_fixed_ = true;
            } else {
                printer_.print_error("unknown argument: " + std::string(argv[2]));
                exit(EXIT_FAILURE);
            }
        }
    }

    auto process(std::vector<char *> &argv) -> bool {
        if (argv.size() != 1) {
            printer_.print_error("expect argv vector to have exactly 1 element, i.e., argv[0].");
            exit(EXIT_FAILURE);
        }

        // currently only portions of the cpp ir files need to be fixed,
        // e.g., `add_cpp.ll` -> `add_cpp_fixed.ll`.
        if (is_fixed_) {
            cpp_path_ = FIXED_IR_DIR + base_name_ + "/" + base_name_ + FIXED_CPP_IR_SUFFIX;
        } else {
            cpp_path_ = DEFAULT_IR_DIR + base_name_ + "/" + base_name_ + CPP_IR_SUFFIX;
        }
        rust_path_ = DEFAULT_IR_DIR + base_name_ + "/" + base_name_ + RUST_IR_SUFFIX;

        argv.push_back(&cpp_path_[0]);
        argv.push_back(&rust_path_[0]);

        return check_ir_file_exists(cpp_path_, true, is_fixed_) &&
               check_ir_file_exists(rust_path_, false);
    }

private:
    auto check_ir_file_exists(const std::string &path,
                              bool is_cpp,
                              bool is_fixed = false) -> bool {
        if (!std::filesystem::exists(path)) {
            if (is_fixed) {
                printer_.print_error("fixed " + get_language_name(is_cpp) +
                                     " ir file not found: " + str_path(path));
                printer_.print_error("please ensure you are specifying the existing fixed "
                                     "cpp ir file in the `examples/ir_fixed/` directory");
                exit(EXIT_FAILURE);
            }
            auto message = get_language_name(is_cpp) + " ir file not found: " + str_path(path);
            printer_.print_error(message);
            message = std::string("please generate the ") + get_language_name(is_cpp) +
                      " ir file for " + str_path(path) +
                      " by running `make generate_ir`";
            printer_.print_error(message);
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

    std::string base_name_ { "" };
    bool is_fixed_ { false };
    Printer printer_ { std::cout, "preprocessor" };
};

#endif  // PREPROCESSOR_H
