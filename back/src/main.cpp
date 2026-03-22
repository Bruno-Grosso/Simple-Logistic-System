//
// Created by be on 3/20/26.
//

#include <iostream>
#include <memory>
#include <ostream>
#include <sqlite3.h>
#include <print>

// ! We will have to change this at some point for the docker build
#define DB_PATH "../../db/db.db"

auto main() -> int {
    sqlite3* db;
    auto rc = sqlite3_open(DB_PATH, &db);

    if (rc != SQLITE_OK) {
        std::cerr << "Can't open database: " << rc << "\n";
        return 1;
    }
    std::println("Opened database at: {}\n", DB_PATH);

    const auto query = "SELECT * FROM users;";
    char* error_message{};

    rc = sqlite3_exec(
        db,
        query,
        [](void*, const int argc, char** argv, char** colName) -> int {
            for (int i = 0; i < argc; i++)
                std::println("{}: {}", colName[i], (argv[i] ? argv[i] : "NULL"));

            std::println("----");
            return 0;
        },
        nullptr,
        &error_message
    );

    if (rc != SQLITE_OK) {
        std::cerr << "SQL error: " << error_message << "\n";
        sqlite3_free(error_message);
    }

    sqlite3_close(db);

    return 0;
}