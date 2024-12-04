#!/bin/bash

# enable stricter error handling
set -euo pipefail

# remove existing build directory
rm -rf alive2_snapshot/build

# create new build directory and change to it
mkdir alive2_snapshot/build && cd alive2_snapshot/build || exit 1

# determine platform and set LLVM path
if [[ "$OSTYPE" == "darwin"* ]]; then
    # for macOS, check if LLVM is installed via Homebrew first
    if ! brew list llvm &>/dev/null; then
        echo "[build_alive2_snapshot.sh] LLVM 19 not found in Homebrew"
        read -p "would you like to install LLVM 19 via Homebrew? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "[build_alive2_snapshot.sh] installing LLVM 19 via Homebrew..."
            brew install llvm
        else
            echo "[build_alive2_snapshot.sh] LLVM 19 installation required but skipped"
            exit 1
        fi
    fi
    LLVM_PATH=$(brew --prefix llvm)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # check if LLVM-19 is installed
    if [[ ! -d "/usr/lib/llvm-19" ]]; then
        echo "[build_alive2_snapshot.sh] LLVM-19 not found"
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
            echo "[build_alive2_snapshot.sh] LLVM-19 installation required but skipped, attempting to find alternative LLVM versions..."
            # try to find other LLVM versions, preferring the newest available
            for version in {18..14}; do
                if [[ -d "/usr/lib/llvm-${version}" ]]; then
                    LLVM_PATH="/usr/lib/llvm-${version}"
                    echo "[build_alive2_snapshot.sh] found LLVM-${version} at ${LLVM_PATH}"
                    echo "[build_alive2_snapshot.sh] warning: using LLVM-${version} instead of LLVM-19 may cause compatibility issues"
                    break
                fi
            done

            if [[ -z "${LLVM_PATH:-}" ]]; then
                echo "[build_alive2_snapshot.sh] no suitable LLVM installation found"
                exit 1
            fi
        fi
    else
        # use system LLVM-19 if found
        LLVM_PATH="/usr/lib/llvm-19"
    fi
else
    # windows or other platforms
    echo "[build_alive2_snapshot.sh] unsupported platform: $OSTYPE"
    exit 1
fi

# run cmake with platform-specific LLVM path
if ! cmake -GNinja -DCMAKE_PREFIX_PATH=$LLVM_PATH -DBUILD_TV=1 -DCMAKE_BUILD_TYPE=Release ..; then
    echo "[build_alive2_snapshot.sh] cmake configuration failed"
    exit 1
fi

# run ninja for final build
if ! ninja; then
    echo "[build_alive2_snapshot.sh] build failed"
    exit 1
fi

echo "[build_alive2_snapshot.sh] build completed successfully for alive2"
