import os
import subprocess

def convert_src_to_ir(source_folder, ir_folder):
    # walk through all subdirectories and the corresponding source files
    for root, _, files in os.walk(source_folder):
        for file in files:
            # get relative path from `source_folder` to maintain structure
            rel_path = os.path.relpath(root, source_folder)
            base_name = os.path.splitext(file)[0]
            
            # create corresponding ir folder structure
            ir_subfolder = os.path.join(ir_folder, rel_path)
            if not os.path.exists(ir_subfolder):
                os.makedirs(ir_subfolder)
            
            source_path = os.path.join(root, file)
            if file.endswith('.cpp'):
                ir_path = os.path.join(ir_subfolder, f"{base_name}_cpp.ll")
            elif file.endswith('.rs'):
                ir_path = os.path.join(ir_subfolder, f"{base_name}_rs.ll")
            else:
                assert False, f"unsupported file type: {file}"
            
            if not os.path.exists(ir_path):
                if file.endswith('.cpp'):
                    command = f"clang++ -O0 -S -emit-llvm {source_path} -o {ir_path}"
                elif file.endswith('.rs'):
                    command = f"rustc --emit=llvm-ir --crate-type=lib {source_path} -o {ir_path}"
                subprocess.run(command, shell=True, check=True)
                print(f"converted {source_path} to {ir_path}")
            else:
                print(f"ir file {ir_path} already exists, skipping conversion.")

def main():
    source_folder = 'examples/source'
    ir_folder = 'examples/ir'

    if not os.path.exists(ir_folder):
        os.makedirs(ir_folder)

    convert_src_to_ir(source_folder, ir_folder)

if __name__ == "__main__":
    main()
