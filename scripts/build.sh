#!/bin/bash

# enable stricter error handling
set -euo pipefail

# remove existing build directory
rm -rf build

# create new build directory and change to it
mkdir build && cd build || exit 1

# run cmake
if ! cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ..; then
    echo "[build.sh] cmake configuration failed"
    exit 1
fi

# run make
if ! make; then
    echo "[build.sh] build failed"
    exit 1
fi

echo "[build.sh] build completed successfully"
