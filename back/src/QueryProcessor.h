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
    // -----------------------------------------------------------------------------------------------------------------
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
    // -----------------------------------------------------------------------------------------------------------------

    // ? Trucks
    // -----------------------------------------------------------------------------------------------------------------
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

    // ? Deposits
    // -----------------------------------------------------------------------------------------------------------------
    struct GetDeposit {
        const std::string id{};

        explicit GetDeposit(std::string id) : id{std::move(id)} {
        };
    };

    struct GetDepositData {
        const std::string id{};
        const std::string field{};

        explicit GetDepositData(std::string id, std::string field) : id{std::move(id)}, field{std::move(field)} {
        };
    };
    // -----------------------------------------------------------------------------------------------------------------

    // ? Orders
    // -----------------------------------------------------------------------------------------------------------------
    struct GetOrder {
        const std::string id{};

        explicit GetOrder(std::string id) : id{std::move(id)} {
        };
    };

    struct GetOrderData {
        const std::string id{};
        const std::string field{};

        explicit GetOrderData(std::string id, std::string field) : id{std::move(id)}, field{std::move(field)} {
        };
    };

    struct GetOrdersByFinalDestination {
        const std::string final_destination{};

        explicit GetOrdersByFinalDestination(std::string final_destination) : final_destination{std::move(final_destination)} {
        };
    };

    struct GetOrdersByReceiver {
        const std::string receiver_id{};

        explicit GetOrdersByReceiver(std::string receiver_id) : receiver_id{std::move(receiver_id)} {
        };
    };

    struct GetOrdersBySender {
        const std::string sender_id{};

        explicit GetOrdersBySender(std::string sender_id) : sender_id{std::move(sender_id)} {
        };
    };
    // -----------------------------------------------------------------------------------------------------------------

    // ? Products
    // -----------------------------------------------------------------------------------------------------------------
    struct GetProduct {
        const std::string id{};

        explicit GetProduct(std::string id) : id{std::move(id)} {
        };
    };

    struct GetProductData {
        const std::string id{};
        const std::string field{};

        explicit GetProductData(std::string id, std::string field) : id{std::move(id)}, field{std::move(field)} {
        };
    };
    // -----------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------

public:
    // RAII
    QueryProcessor() = default;

    ~QueryProcessor() = default;

    // TODO: There has to be a better way to do this
    using Query = std::variant<GetAllUsers, GetUser, GetUsersByRole, GetUserData, GetAllTrucks, GetTruck, GetTrucksBySize,
        GetTrucksByModel, GetTruckData, GetDeposit, GetDepositData, GetOrder, GetOrderData, GetOrdersByFinalDestination,
        GetOrdersByReceiver, GetOrdersBySender, GetProduct, GetProductData>;

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

    // ? Deposit queries
    /**
     * @brief A query for getting a specific deposit by id
     */
    static auto getDeposit(const std::string &id) -> GetDeposit { return GetDeposit(id); };

    /**
     * @brief A query for fetching a field of some deposit by their id
     */
    static auto getDepositData(const std::string &id, const std::string &field) -> GetDepositData {
        return GetDepositData(id, field);
    };

    // ? Order queries
    /**
     * @brief A query for getting a specific order by id
     */
    static auto getOrder(const std::string &id) -> GetOrder { return GetOrder(id); };

    /**
     * @brief A query for fetching a field of some order by their id
     */
    static auto getOrderData(const std::string &id, const std::string &field) -> GetOrderData {
        return GetOrderData(id, field);
    };

    /**
     * @brief A query for getting orders by their final destination
     */
    static auto getOrdersByFinalDestination(const std::string &final_destination) -> GetOrdersByFinalDestination {
        return GetOrdersByFinalDestination(final_destination);
    };

    /**
     * @brief A query for getting orders by their receiver id
     */
    static auto getOrdersByReceiver(const std::string &receiver_id) -> GetOrdersByReceiver {
        return GetOrdersByReceiver(receiver_id);
    };

    /**
     * @brief A query for getting orders by their sender id
     */
    static auto getOrdersBySender(const std::string &sender_id) -> GetOrdersBySender {
        return GetOrdersBySender(sender_id);
    };

    // ? Product queries
    /**
     * @brief A query for getting a specific product by id
     */
    static auto getProduct(const std::string &id) -> GetProduct { return GetProduct(id); };

    /**
     * @brief A query for fetching a field of some product by their id
     */
    static auto getProductData(const std::string &id, const std::string &field) -> GetProductData {
        return GetProductData(id, field);
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
