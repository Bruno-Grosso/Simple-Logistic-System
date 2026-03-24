//
// Created by be on 3/23/26.
//

#include "App.h"

#include <drogon/drogon.h>
#include <print>
#include <stdexcept>

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
    drogon::app().registerHandler(
        "/clients",
        [](const drogon::HttpRequestPtr &req,
           std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
            const auto clients_query = App::qp.getQuery(QueryProcessor::getAllUsers());
            std::vector<std::string> clients;

            rc = sqlite3_exec(db, clients_query.c_str(),
                              [](void *data, int argc, char **argv, char **colName) -> int {
                                  auto* clients = static_cast<std::vector<std::string>*>(data);

                                  if (argv[1]) {
                                      clients->emplace_back(argv[1]);
                                  }
                                  return 0;
                              }, &clients, nullptr);

            Json::Value arr(Json::arrayValue);

            for (const auto &c: clients) {
                Json::Value obj;
                obj["name"] = c;
                arr.append(obj);
            }

            auto resp = drogon::HttpResponse::newHttpJsonResponse(arr);
            callback(resp);
        },
        {drogon::Get}
    );

    drogon::app()
            .addListener("0.0.0.0", 8848)
            .run();
}

auto App::cleanup() -> void {
    sqlite3_close(db);
}
