//
// Created by be on 3/22/26.
//

#include "QueryProcessor.h"

#include <fstream>
#include <sstream>
#include <stdexcept>

auto QueryProcessor::read_query(std::string_view path) -> std::string {
    std::ifstream file(path.data());
    std::stringstream buffer;
    buffer << file.rdbuf();

    return buffer.str();
}

auto QueryProcessor::getQuery(const Query &query) -> std::string {
    return std::visit([this](const auto &q) -> std::string {
        using T = std::decay_t<decltype(q)>;

        if constexpr (std::is_same_v<T, GetAllUsers>) {
            return read_query(base_location + "get_all_users.sql");
        }
        else if constexpr (std::is_same_v<T, GetUser>) {
            std::string base_query = read_query(base_location + "get_user.sql");

            return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
        }
        else throw std::runtime_error("Invalid Query type");
    }, query);
}
