#!/bin/bash

# Enable stricter error handling
set -euo pipefail

# Define the path to your executable
# Replace 'your_executable' with the actual name of your program
EXECUTABLE="./build/translation_validator"

# Check if the executable exists
if [ ! -f "$EXECUTABLE" ]; then
    echo "Error: Executable not found. Did you build the project?"
    exit 1
fi

# Run the executable
"$EXECUTABLE"
