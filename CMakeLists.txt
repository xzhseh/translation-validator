# the CMakeLists.txt for default llvm build, recommended with the bundled alive2
cmake_minimum_required(VERSION 3.13)
project(TranslationValidator C CXX)

set(CMAKE_BUILD_TYPE Debug)
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -g")
set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -frtti -fexceptions")
if(APPLE)
    # suppress the ld warning about duplicate libraries
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,-w")
endif()

# find the llvm version
find_package(LLVM REQUIRED CONFIG)
message(STATUS "Found LLVM ${LLVM_PACKAGE_VERSION}")
message(STATUS "Using LLVMConfig.cmake in: ${LLVM_DIR}")

# include llvm headers
include_directories(${LLVM_INCLUDE_DIRS})
link_directories(${LLVM_LIBRARY_DIRS})

# find z3
find_package(Z3 REQUIRED)
include_directories(${Z3_INCLUDE_DIRS})
add_definitions(${Z3_DEFINITIONS})

# set the path to alive2
# make sure you have built alive2 first either through `make alive2`
# or the automatic build when running `make full_build`.
set(ALIVE2_DIR "${CMAKE_CURRENT_SOURCE_DIR}/alive2_snapshot")

# include alive2 headers
include_directories(${ALIVE2_DIR})

# add source files
add_executable(standalone src/standalone.cpp)
add_executable(validator_server src/ValidatorServer.cpp)

llvm_map_components_to_libnames(llvm_libs
    Core
    Support
    IRReader
    BitReader
    MC
    Option
    Analysis
    Target
    TargetParser
)

# link against llvm, z3, and alive2
target_link_libraries(standalone PRIVATE
    ${Z3_LIBRARIES}
    ${ALIVE2_DIR}/build/libir.a
    ${ALIVE2_DIR}/build/libsmt.a
    ${ALIVE2_DIR}/build/libutil.a
    ${ALIVE2_DIR}/build/libtools.a
    ${ALIVE2_DIR}/build/libllvm_util.a         # for `llvm_util::initializer`
    ${llvm_libs}                               # will trigger ld warning(s) regarding duplicate libraries but that's fine
)

# link against llvm, z3, and alive2
target_link_libraries(validator_server PRIVATE
    ${Z3_LIBRARIES}
    ${ALIVE2_DIR}/build/libir.a
    ${ALIVE2_DIR}/build/libsmt.a
    ${ALIVE2_DIR}/build/libutil.a
    ${ALIVE2_DIR}/build/libtools.a
    ${ALIVE2_DIR}/build/libllvm_util.a         # for `llvm_util::initializer`
    ${llvm_libs}                               # will trigger ld warning(s) regarding duplicate libraries but that's fine
)
