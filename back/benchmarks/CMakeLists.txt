# ── Google Benchmark ────────────────────────────────────────────────────────
FetchContent_Declare(
        benchmark
        GIT_REPOSITORY https://github.com/google/benchmark.git
        GIT_TAG        v1.9.1
)
set(BENCHMARK_ENABLE_TESTING OFF CACHE BOOL "" FORCE)
set(BENCHMARK_ENABLE_GTEST_TESTS OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(benchmark)

# ── Benchmarks ───────────────────────────────────────────────────────────────
file(GLOB_RECURSE BENCH_SOURCES CONFIGURE_DEPENDS *.cpp)

if(BENCH_SOURCES)
    add_executable(${PROJECT_NAME}_benchmarks ${BENCH_SOURCES})
    target_link_libraries(${PROJECT_NAME}_benchmarks PRIVATE benchmark::benchmark back_lib)
    target_include_directories(${PROJECT_NAME}_benchmarks PRIVATE
            ${benchmark_SOURCE_DIR}/include
    )
    target_compile_definitions(${PROJECT_NAME}_benchmarks PRIVATE
            BENCHMARK_VERSION="${PROJECT_VERSION}")
endif()