#!/bin/bash

# enable stricter error handling
set -euo pipefail

# check and enter the server directory
if ! cd relay_server; then
    echo "[build_relay.sh] failed to enter relay_server directory, are you in the root directory?"
    exit 1
fi

# remove existing build directory
rm -rf build

# create new build directory and change to it
mkdir build && cd build || exit 1

# run cmake
if ! cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ..; then
    echo "[build_relay.sh] cmake configuration failed"
    exit 1
fi

# run make
if ! make; then
    echo "[build_relay.sh] build failed"
    exit 1
fi

echo "[build_relay.sh] build completed successfully"
