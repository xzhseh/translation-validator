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
    # for linux, check if LLVM 19 is installed
    if ! dpkg -l | grep -q "llvm-19"; then
        echo "[build_alive2_snapshot.sh] LLVM 19 not found"
        read -p "would you like to install LLVM 19 (includes llvm-19, llvm-19-dev, and clang-19)? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "[build_alive2_snapshot.sh] Installing LLVM 19..."
            sudo apt update
            sudo apt install -y llvm-19 llvm-19-dev clang-19
        else
            echo "[build_alive2_snapshot.sh] LLVM 19 installation required but skipped"
            exit 1
        fi
    fi
    LLVM_PATH="/usr/lib/llvm-19"
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
