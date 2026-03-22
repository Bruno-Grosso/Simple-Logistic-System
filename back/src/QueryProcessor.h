//
// Created by be on 3/22/26.
//

#ifndef SIMPLELOGISTICSSYSTEM_QUERY_PROCESSOR_H
#define SIMPLELOGISTICSSYSTEM_QUERY_PROCESSOR_H

#include <string>
#include <string_view>
#include <utility>
#include <variant>


class QueryProcessor {
    const std::string base_location = "../../db/queries/";

    struct GetAllUsers {
    };

    struct GetUser {
        const std::string id{};
        explicit GetUser(std::string id) : id{std::move(id)} {};
    };

    static auto read_query(std::string_view path) -> std::string;

public:
    // RAII
    QueryProcessor() = default;
    ~QueryProcessor() = default;

    using Query = std::variant<GetAllUsers, GetUser>;

    /**
     * @brief A query for getting all users
     */
    static auto getAllUsers() -> GetAllUsers {return GetAllUsers{};}

    /**
     * @brief A query for getting a specific user by id
     */
    static auto getUser(const std::string &id) -> GetUser {return GetUser(id);};

    /**
     * @brief Loads an SQL query from a file.
     *
     * Reads the contents of a `.sql` file and returns it as a string
     * so it can be executed later using SQLite.
     *
     * @param query Relative or absolute path to the SQL file.
     * @return std::string The SQL query as a string.
     *
     * @throws std::runtime_error If the file cannot be opened.
     */
    auto getQuery(const Query &query) -> std::string;
};


#endif //SIMPLELOGISTICSSYSTEM_QUERY_PROCESSOR_H
