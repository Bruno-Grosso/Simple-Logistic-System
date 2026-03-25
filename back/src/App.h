//
// Created by be on 3/23/26.
//

#ifndef SIMPLELOGISTICSSYSTEM_APP_H
#define SIMPLELOGISTICSSYSTEM_APP_H

#include <sqlite3.h>
#include <string_view>

#include "QueryProcessor.h"

class App {
public:
    // ? These are all global lifetimes
    // ! This should change for the final build in the dockerfile
    static constexpr std::string_view db_path{"../../db/db.db"};
    static QueryProcessor qp;
    static sqlite3 *db;
    static int rc;

    static auto init() -> void;

    static auto run() -> void;

    static auto cleanup() -> void;
};

#endif //SIMPLELOGISTICSSYSTEM_APP_H
