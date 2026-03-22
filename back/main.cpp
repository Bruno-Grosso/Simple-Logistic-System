//
// Created by be on 3/20/26.
//

#include <iostream>
#include <print>

#include <sqlite3.h>

#include "src/QueryProcessor.h"

// ! We will have to change this at some point for the docker build
#define DB_PATH "../../db/db.db"

auto main() -> int {
    QueryProcessor qp;

    sqlite3* db;
    auto rc = sqlite3_open(DB_PATH, &db);

    if (rc != SQLITE_OK) {
        std::cerr << "Can't open database: " << rc << "\n";
        return 1;
    }
    std::println("Opened database at: {}\n", DB_PATH);

    const auto query1 = qp.getQuery(QueryProcessor::getAllUsers()), query2 = qp.getQuery(QueryProcessor::getUser("Some ID"));
    std::println("Query1: {}", query1);
    std::println("Query2: {}\n", query2);
    char* error_message{};

    std::println("Query 1 result:");
    rc = sqlite3_exec(
        db,
        query1.c_str(),
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

    std::println("Query 2 result:");
    rc = sqlite3_exec(
        db,
        query2.c_str(),
        [](void*, const int argc, char** argv, char** colName) -> int {
            for (int i = 0; i < argc; i++)
                std::println("Found {}: {}", colName[i], (argv[i] ? argv[i] : "NULL"));

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

    return EXIT_SUCCESS;
}