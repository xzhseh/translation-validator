## translation validator

### overview
this tool compares the source function in cpp with the target function in rust, and verifies whether the rust function is a correct translation/semantic equivalent of the cpp function using alive2 in llvm ir level.

**ps**. you could find all source files to be verified in the `examples/source` directory.

### prerequisites
- follow the instructions in [alive2](https://github.com/AliveToolkit/alive2) to build and configure alive2, and also the specific llvm version.
  - you should build the llvm from source (i.e., the latest main branch), with RTTI and exceptions turned on.

- based on the provided `CMakeLists_Template`, create your own `CMakeLists.txt` by replacing the placeholder for the paths, you may need to change the `.dylib` to `.so` or `.a` depending on your OS.

### build and run
through `make build`, `make run`, or `make build_and_run`.

note: a `compile_commands.json` will be automatically generated in the build directory and moved to the root directory, this is generally used by clangd for code navigation, you may need to reload the window to make it work.

### generate the ir files
either through `make generate_ir` or `make clean_and_generate_ir`.

**note**: the source file, e.g., `examples/source/add.rs`, will be converted to `add_rs.ll` and put in the `examples/ir/add/add_rs.ll` path, check the `scripts/src2ir.py` for more details.
