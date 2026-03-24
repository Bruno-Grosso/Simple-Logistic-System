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

    static auto read_query(std::string_view path) -> std::string;

    // ? Query structs
    // -----------------------------------------------------------------------------------------------------------------
    // ? Users
    struct GetAllUsers {
    };

    struct GetUser {
        const std::string id{};

        explicit GetUser(std::string id) : id{std::move(id)} {
        };
    };

    struct GetUsersByRole {
        const std::string role{};

        explicit GetUsersByRole(std::string role) : role{std::move(role)} {
        };
    };

    struct GetUserData {
        const std::string id{};
        const std::string field{};

        explicit GetUserData(std::string id, std::string field) : id{std::move(id)}, field{std::move(field)} {
        };
    };

    // ? Trucks
    struct GetAllTrucks {
    };

    struct GetTruck {
        const std::string id{};

        explicit GetTruck(std::string id) : id{std::move(id)} {
        };
    };

    struct GetTrucksByModel {
        const std::string model{};

        explicit GetTrucksByModel(std::string model) : model{std::move(model)} {
        };
    };

    struct GetTrucksBySize {
        const std::string size{};

        explicit GetTrucksBySize(std::string size) : size{std::move(size)} {
        };
    };

    struct GetTruckData {
        const std::string id{};
        const std::string field{};

        explicit GetTruckData(std::string id, std::string field) : id{std::move(id)}, field{std::move(field)} {
        };
    };

    // -----------------------------------------------------------------------------------------------------------------

public:
    // RAII
    QueryProcessor() = default;

    ~QueryProcessor() = default;

    // TODO: There has to be a better way to do this
    using Query = std::variant<GetAllUsers, GetUser, GetUsersByRole, GetUserData, GetAllTrucks, GetTruck, GetTrucksBySize,
        GetTrucksByModel, GetTruckData>;

    // ? User queries
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * @brief A query for getting all users
     */
    static auto getAllUsers() -> GetAllUsers { return GetAllUsers{}; }

    /**
     * @brief A query for getting a specific user by id
     */
    static auto getUser(const std::string &id) -> GetUser { return GetUser(id); };

    /**
     * @brief A query for getting users by their role
     */
    static auto getUsersByRole(const std::string &role) -> GetUsersByRole { return GetUsersByRole(role); };

    /**
     * @brief A query for fetching a field of some user by their id
     */
    static auto getUserData(const std::string &id, const std::string &field) -> GetUserData {
        return GetUserData(id, field);
    };
    // -----------------------------------------------------------------------------------------------------------------

    // ? Truck queries
    /**
     * @brief A query for getting all trucks
     */
    static auto getAllTrucks() -> GetAllTrucks { return GetAllTrucks{}; }

    /**
     * @brief A query for getting a specific truck by id
     */
    static auto getTruck(const std::string &id) -> GetTruck { return GetTruck(id); };

    /**
     * @brief A query for getting trucks by their size
     */
    static auto getTrucksBySize(const std::string &size) -> GetTrucksBySize { return GetTrucksBySize(size); };

    /**
     * @brief A query for getting trucks by their model
     */
    static auto getTrucksByModel(const std::string &model) -> GetTrucksByModel { return GetTrucksByModel(model); };

    /**
     * @brief A query for fetching a field of some truck by their id
     */
    static auto getTruckData(const std::string &id, const std::string &field) -> GetTruckData {
        return GetTruckData(id, field);
    };

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
