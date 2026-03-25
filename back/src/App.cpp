//
// Created by be on 3/23/26.
//

#include "App.h"

#include <print>
#include <stdexcept>

#include "Controller.h"

// Global lifetime
int App::rc{};
sqlite3 *App::db{};
QueryProcessor App::qp{};

auto App::init() -> void {
    rc = sqlite3_open(db_path.data(), &db);

    if (rc != SQLITE_OK)
        throw std::runtime_error("Can't open database");

    std::println("Opened database at: {}\n", db_path);
}

auto App::run() -> void {
    Controller::init();
    Controller::run();
}

auto App::cleanup() -> void {
    sqlite3_close(db);
}
