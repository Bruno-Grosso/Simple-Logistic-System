# ── Project ─────────────────────────────────────────────────────────────────
cmake_minimum_required(VERSION 4.1)

# macOS + Homebrew g++: the linker must see the Xcode SDK or you get:
#   ld: library 'System' not found
if(APPLE)
    execute_process(
        COMMAND xcrun --show-sdk-path
        OUTPUT_VARIABLE LOGISYS_OSX_SYSROOT
        OUTPUT_STRIP_TRAILING_WHITESPACE
        ERROR_QUIET
        RESULT_VARIABLE LOGISYS_XCRUN_SDK
    )
    if(LOGISYS_XCRUN_SDK EQUAL 0 AND LOGISYS_OSX_SYSROOT)
        set(CMAKE_OSX_SYSROOT "${LOGISYS_OSX_SYSROOT}" CACHE PATH "macOS SDK for GNU g++ link" FORCE)
        set(ENV{SDKROOT} "${LOGISYS_OSX_SYSROOT}")
    else()
        message(
            WARNING
            "Could not run `xcrun --show-sdk-path`. If linking fails with 'library System not found', "
            "install Xcode or Command Line Tools.")
    endif()
endif()

# macOS: C++26 is not available with Apple Clang in CMake today. Use real GNU g++
# from Homebrew. Do NOT use /usr/bin/g++ — it is a Clang wrapper.
# Override any time with: cmake -DCMAKE_CXX_COMPILER=/opt/homebrew/bin/g++-14 ...
if(APPLE)
    if(NOT CMAKE_CXX_COMPILER)
        find_program(
            LOGISYS_MACOS_GNU_CXX
            NAMES g++-15 g++-14 g++-13 g++-12 g++
            PATHS
                /opt/homebrew/opt/gcc/bin
                /opt/homebrew/bin
                /usr/local/opt/gcc/bin
                /usr/local/bin
            NO_DEFAULT_PATH
        )
        if(NOT LOGISYS_MACOS_GNU_CXX)
            message(
                FATAL_ERROR
                "On macOS this project needs GNU G++ (C++26). Apple Clang is not enough.\n"
                "  brew install gcc\n"
                "Then remove the build dir and run cmake again, or set explicitly, e.g.:\n"
                "  cmake -DCMAKE_CXX_COMPILER=/opt/homebrew/bin/g++-14 -S . -B build")
        endif()
        set(CMAKE_CXX_COMPILER "${LOGISYS_MACOS_GNU_CXX}" CACHE FILEPATH "C++ compiler" FORCE)
    endif()
endif()

project(SimpleLogisticsSystem VERSION 0.0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 26)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS ON)

if(APPLE AND NOT CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
    message(
        FATAL_ERROR
        "Compiler is '${CMAKE_CXX_COMPILER_ID}' but this project requires GNU G++ on macOS for C++26.\n"
        "  cmake -DCMAKE_CXX_COMPILER=/opt/homebrew/bin/g++-14 -S . -B build")
endif()

add_subdirectory(src)
add_subdirectory(tests)

# ── Main executable ─────────────────────────────────────────────────────────
add_executable(${PROJECT_NAME} main.cpp)
target_link_libraries(${PROJECT_NAME} back_lib)
