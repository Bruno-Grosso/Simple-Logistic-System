//
// Created by be on 3/25/26.
//

#include <drogon/drogon.h>

#include "Controller.h"
#include "App.h"

#include <span>
#include <ranges>

using namespace drogon;

auto Controller::init() -> void {
    app().registerHandler(
        "/clients",
        [](const HttpRequestPtr &_,
           std::function<void(const HttpResponsePtr &)> &&callback) {
            const auto clients_query = App::qp.getQuery(QueryProcessor::getAllUsers());
            Json::Value arr(Json::arrayValue);

            App::rc = sqlite3_exec(App::db, clients_query.c_str(),
                                   [](void *data, const int argc, char **argv, char **colName) -> int {
                                       auto *l_arr = static_cast<Json::Value *>(data);
                                       Json::Value obj;

                                       const auto columns = std::span(colName, argc);

                                       for (const auto values = std::span(argv, argc); auto [val, col]: std::views::zip(values, columns)) {
                                           obj[col] = val ? val : "";
                                       }

                                       l_arr->append(obj);
                                       return 0;
                                   }, &arr, nullptr);

            const auto resp = HttpResponse::newHttpJsonResponse(arr);
            callback(resp);
        },
        {Get}
    );
}

auto Controller::run() -> void {
    app().addListener("0.0.0.0", 8848).run();
}
