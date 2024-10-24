#!/bin/bash

# Enable stricter error handling
set -euo pipefail

# Remove existing build directory and compile_commands.json
rm -rf build
rm -f compile_commands.json

# Create new build directory and change to it
mkdir build && cd build || exit 1

# Run CMake
if ! cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ..; then
    echo "[build.sh] cmake configuration failed"
    exit 1
fi

# Run make
if ! make; then
    echo "[build.sh] build failed"
    exit 1
fi

# Move compile_commands.json to root directory
if [ -f compile_commands.json ]; then
    mv compile_commands.json ..
    echo "[build.sh] moved \`compile_commands.json\` to root directory"
else
    echo "[build.sh] warning: \`compile_commands.json\` not found"
fi

echo "[build.sh] build completed successfully"
