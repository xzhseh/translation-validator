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
    # Check if LLVM 19 is installed
    if ! dpkg -l | grep -q "llvm-19"; then
        echo "[build_alive2_snapshot.sh] LLVM 19 not found"
        read -p "would you like to install LLVM 19 from official LLVM repository? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "[build_alive2_snapshot.sh] removing old LLVM versions..."
            sudo apt remove -y llvm-* libllvm*
            
            echo "[build_alive2_snapshot.sh] adding the LLVM repository and installing dependencies..."
            wget https://apt.llvm.org/llvm.sh
            chmod +x llvm.sh
            sudo ./llvm.sh 19 all
            rm llvm.sh
            
            # Install other dependencies
            sudo apt install -y ninja-build build-essential \
                            re2c libhiredis-dev libedit-dev \
                            libzstd-dev libcurl4-openssl-dev
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
