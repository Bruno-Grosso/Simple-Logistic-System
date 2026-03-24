# ── Project ─────────────────────────────────────────────────────────────────
cmake_minimum_required(VERSION 4.1)
project(SimpleLogisticsSystem VERSION 0.0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 26)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_subdirectory(src)
add_subdirectory(tests)

# ── Main executable ─────────────────────────────────────────────────────────
add_executable(${PROJECT_NAME} main.cpp)
target_link_libraries(${PROJECT_NAME} back_lib)