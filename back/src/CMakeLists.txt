set(CMAKE_CXX_STANDARD 26)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ── Web framework (Drogon, that for whatever reason links SQLite as well) ───
find_package(Drogon REQUIRED)

# ── Main lib ────────────────────────────────────────────────────────────────
file(GLOB_RECURSE SRC_FILES CONFIGURE_DEPENDS *.cpp)
add_library(back_lib ${SRC_FILES})

target_include_directories(back_lib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_link_libraries(back_lib PRIVATE Drogon::Drogon)