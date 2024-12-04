#!/bin/bash

# enable stricter error handling
set -euo pipefail

# remove existing build directory
rm -rf build

# create new build directory and change to it
mkdir build && cd build || exit 1

# determine platform and set LLVM path
if [[ "$OSTYPE" == "darwin"* ]]; then
    # for macOS, check if LLVM is installed via Homebrew first
    if ! brew list llvm &>/dev/null; then
        echo "[build.sh] LLVM 19 not found in Homebrew"
        read -p "would you like to install LLVM 19 via Homebrew? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "[build.sh] installing LLVM 19 via Homebrew..."
            brew install llvm
        else
            echo "[build.sh] LLVM 19 installation required but skipped"
            exit 1
        fi
    fi
    LLVM_PATH=$(brew --prefix llvm)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # check if LLVM-19 is installed
    if [[ ! -d "/usr/lib/llvm-19" ]]; then
        echo "[build.sh] LLVM-19 not found"
        read -p "would you like to install LLVM-19 from official LLVM repository? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # install other dependencies
            sudo apt install -y ninja-build build-essential \
                            re2c libhiredis-dev libedit-dev \
                            libzstd-dev libcurl4-openssl-dev
            # install LLVM-19
            sudo apt install -y llvm-19
            LLVM_PATH="/usr/lib/llvm-19"
        else
            echo "[build.sh] LLVM-19 installation required but skipped, attempting to find alternative LLVM versions..."
            # try to find other LLVM versions, preferring the newest available
            for version in {18..14}; do
                if [[ -d "/usr/lib/llvm-${version}" ]]; then
                    LLVM_PATH="/usr/lib/llvm-${version}"
                    echo "[build.sh] found LLVM-${version} at ${LLVM_PATH}"
                    echo "[build.sh] warning: using LLVM-${version} instead of LLVM-19 may cause compatibility issues"
                    break
                fi
            done

            if [[ -z "${LLVM_PATH:-}" ]]; then
                echo "[build.sh] no suitable LLVM installation found"
                exit 1
            fi
        fi
    else
        # use system LLVM-19 if found
        LLVM_PATH="/usr/lib/llvm-19"
    fi
else
    # windows or other platforms
    echo "[build.sh] unsupported platform: $OSTYPE"
    exit 1
fi

# run cmake, the llvm path should be consistent as alive2's
if ! cmake -DCMAKE_PREFIX_PATH=$LLVM_PATH -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ..; then
    echo "[build.sh] cmake configuration failed"
    exit 1
fi

# run make
if ! make; then
    echo "[build.sh] build failed"
    exit 1
fi

echo "[build.sh] build completed successfully for both standalone and validator_server"
