//
// Created by be on 3/23/26.
//

#include "App.h"

#include <print>
#include <stdexcept>

// Global lifetime
int App::rc{};
sqlite3* App::db{};
QueryProcessor App::qp{};

auto App::init() -> void {
    rc = sqlite3_open(db_path.data(), &db);

    if (rc != SQLITE_OK)
        throw std::runtime_error("Can't open database");

    std::println("Opened database at: {}\n", db_path);
}

auto App::run() -> void {
    const auto query1 = qp.getQuery(QueryProcessor::getAllUsers()), query2 = qp.getQuery(
        QueryProcessor::getUser("Some ID"));
    std::println("Query1: {}", query1);
    std::println("Query2: {}\n", query2);
    char *error_message{};

    std::println("Query 1 result:");
    rc = sqlite3_exec(
        db,
        query1.c_str(),
        [](void *, const int argc, char **argv, char **colName) -> int {
            for (int i = 0; i < argc; i++)
                std::println("{}: {}", colName[i], (argv[i] ? argv[i] : "NULL"));

            std::println("----");
            return 0;
        },
        nullptr,
        &error_message
    );

    if (rc != SQLITE_OK)
        throw std::runtime_error(error_message);

    std::println("Query 2 result:");
    rc = sqlite3_exec(
        db,
        query2.c_str(),
        [](void *, const int argc, char **argv, char **colName) -> int {
            for (int i = 0; i < argc; i++)
                std::println("Found {}: {}", colName[i], (argv[i] ? argv[i] : "NULL"));

            std::println("----");
            return 0;
        },
        nullptr,
        &error_message
    );

    if (rc != SQLITE_OK)
        throw std::runtime_error(error_message);
}

auto App::cleanup() -> void {
    sqlite3_close(db);
}
