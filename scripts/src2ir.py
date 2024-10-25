import os
import subprocess

def convert_cpp_to_ir(source_folder, ir_folder):
    for file in os.listdir(source_folder):
        if file.endswith('.cpp'):
            base_name = os.path.splitext(file)[0]
            source_path = os.path.join(source_folder, file)
            ir_path = os.path.join(ir_folder, f"{base_name}_cpp.ll")
            if not os.path.exists(ir_path):
                # note for the clang++ command:
                #   -O0: disable optimizations
                #   -S: output assembly (llvm ir in this case)
                #   -emit-llvm: generate llvm ir instead of native assembly
                command = f"clang++ -O0 -S -emit-llvm {source_path} -o {ir_path}"
                subprocess.run(command, shell=True, check=True)
                print(f"converted {file} to {ir_path}")
            else:
                print(f"ir file {ir_path} already exists, skipping conversion.")

def convert_rs_to_ir(source_folder, ir_folder):
    for file in os.listdir(source_folder):
        if file.endswith('.rs'):
            base_name = os.path.splitext(file)[0]
            source_path = os.path.join(source_folder, file)
            ir_path = os.path.join(ir_folder, f"{base_name}_rs.ll")
            if not os.path.exists(ir_path):
                # note for the rustc command:
                #   --emit=llvm-ir: output llvm ir
                #   --crate-type=lib: compile as a library
                command = f"rustc --emit=llvm-ir --crate-type=lib {source_path} -o {ir_path}"
                subprocess.run(command, shell=True, check=True)
                print(f"converted {file} to {ir_path}")
            else:
                print(f"ir file {ir_path} already exists, skipping conversion.")

def main():
    source_folder = 'examples/source'
    ir_folder = 'examples/ir'

    if not os.path.exists(ir_folder):
        os.makedirs(ir_folder)

    convert_cpp_to_ir(source_folder, ir_folder)
    convert_rs_to_ir(source_folder, ir_folder)

if __name__ == "__main__":
    main()
