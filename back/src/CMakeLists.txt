set(CMAKE_CXX_STANDARD 26)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ── Main lib ────────────────────────────────────────────────────────────────
file(GLOB_RECURSE SRC_FILES CONFIGURE_DEPENDS *.cpp)
add_library(back_lib ${SRC_FILES})

target_include_directories(back_lib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_link_libraries(back_lib PRIVATE SQLite::SQLite3)
