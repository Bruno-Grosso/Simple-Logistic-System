# ── Project ─────────────────────────────────────────────────────────────────
cmake_minimum_required(VERSION 4.1)
project(SimpleLogisticsSystem VERSION 0.0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 26)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

# ── Google Test ─────────────────────────────────────────────────────────────
FetchContent_Declare(
        googletest
        GIT_REPOSITORY https://github.com/google/googletest.git
        GIT_TAG        v1.15.2
)
set(INSTALL_GTEST OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# ── Google Benchmark ────────────────────────────────────────────────────────
FetchContent_Declare(
        benchmark
        GIT_REPOSITORY https://github.com/google/benchmark.git
        GIT_TAG        v1.9.1
)
set(BENCHMARK_ENABLE_TESTING OFF CACHE BOOL "" FORCE)
set(BENCHMARK_ENABLE_GTEST_TESTS OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(benchmark)

# ── SQLite 3 ────────────────────────────────────────────────────────────────
find_package(SQLite3 REQUIRED)

# ── Main executable ─────────────────────────────────────────────────────────
file(GLOB_RECURSE SOURCES CONFIGURE_DEPENDS src/*.cpp)

add_executable(${PROJECT_NAME} ${SOURCES})
target_link_libraries(${PROJECT_NAME} PRIVATE SQLite::SQLite3)

# ── Tests ────────────────────────────────────────────────────────────────────
enable_testing()

file(GLOB_RECURSE TEST_SOURCES CONFIGURE_DEPENDS tests/*.cpp)

if(TEST_SOURCES)
    add_executable(${PROJECT_NAME}_tests ${TEST_SOURCES})
    target_link_libraries(${PROJECT_NAME}_tests PRIVATE GTest::gtest_main)
    include(GoogleTest)
    gtest_discover_tests(${PROJECT_NAME}_tests)
endif()

# ── Benchmarks ───────────────────────────────────────────────────────────────
file(GLOB_RECURSE BENCH_SOURCES CONFIGURE_DEPENDS benchmarks/*.cpp)

if(BENCH_SOURCES)
    add_executable(${PROJECT_NAME}_benchmarks ${BENCH_SOURCES})
    target_link_libraries(${PROJECT_NAME}_benchmarks PRIVATE benchmark::benchmark)
    target_include_directories(${PROJECT_NAME}_benchmarks PRIVATE
            ${benchmark_SOURCE_DIR}/include
    )
    target_compile_definitions(${PROJECT_NAME}_benchmarks PRIVATE
            BENCHMARK_VERSION="${PROJECT_VERSION}")
endif()