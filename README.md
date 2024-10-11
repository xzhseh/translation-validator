### prerequisites
- follow the instructions in [alive2](https://github.com/alive2/alive2) to build and configure alive2, also the specific llvm with RTTI and exceptions turned on.
  - I basically build the llvm from source (i.e., the latest main branch) and build the alive2 upon it.

- based on the provided `CMakeLists_Template`, create your own `CMakeLists.txt` by replacing the placeholder for the paths.

### build
```bash
bash scripts/build.sh
```

note: a `compile_commands.json` will be automatically generated in the build directory and moved to the root directory, this is generally used by clangd for code navigation, you may need to reload the window to make it work.

### run
```bash
bash scripts/run.sh
```
