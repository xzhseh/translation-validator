cmake_minimum_required(VERSION 3.13)
project(RelayServer CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_BUILD_TYPE Debug)

# set the policy for FindBoost module
if(POLICY CMP0167)
    cmake_policy(SET CMP0167 NEW)
endif()

# find required packages for HTTP server
find_package(Boost REQUIRED COMPONENTS system filesystem thread)
find_package(OpenSSL REQUIRED)
find_package(cpprestsdk REQUIRED)

# add relay server executable
add_executable(relay_server RelayServer.cpp)

# link only what server needs
target_link_libraries(relay_server PRIVATE
    cpprestsdk::cpprest
    Boost::system
    Boost::filesystem
    Boost::thread
    OpenSSL::SSL
    OpenSSL::Crypto
)

# add any compile definitions if needed
target_compile_definitions(relay_server PRIVATE
    _TURN_OFF_PLATFORM_STRING
)
