#!/bin/bash

# enable stricter error handling
set -euo pipefail

EXECUTABLE="./build/translation_validator"

# check if the executable exists
if [ ! -f "$EXECUTABLE" ]; then
    echo "error: executable not found, did you build the project?"
    exit 1
fi

# run the executable
"$EXECUTABLE"
