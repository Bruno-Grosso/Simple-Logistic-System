//
// Created by be on 3/22/26.
//

#ifndef SIMPLELOGISTICSSYSTEM_QUERY_PROCESSOR_H
#define SIMPLELOGISTICSSYSTEM_QUERY_PROCESSOR_H

#include <functional>
#include <string>
#include <string_view>
#include <utility>
#include <variant>
#include <drogon/HttpResponse.h>


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

    // ? Warehouses
    // -----------------------------------------------------------------------------------------------------------------
    struct GetWarehouse {
        const std::string id{};

        explicit GetWarehouse(std::string id) : id{std::move(id)} {
        };
    };

    struct GetWarehouseData {
        const std::string id{};
        const std::string field{};

        explicit GetWarehouseData(std::string id, std::string field) : id{std::move(id)}, field{std::move(field)} {
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

        explicit GetOrdersByFinalDestination(std::string final_destination) : final_destination{
            std::move(final_destination)
        } {
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

    // ? Suppliers
    // -----------------------------------------------------------------------------------------------------------------
    struct GetAllSuppliers {
    };

    struct GetSupplier {
        const std::string id{};

        explicit GetSupplier(std::string id) : id{std::move(id)} {
        };
    };

    struct GetSuppliersByLocation {
        const std::string location{};

        explicit GetSuppliersByLocation(std::string location) : location{std::move(location)} {
        };
    };

    struct GetSupplierData {
        const std::string id{};
        const std::string field{};

        explicit GetSupplierData(std::string id, std::string field) : id{std::move(id)}, field{std::move(field)} {
        };
    };

    // -----------------------------------------------------------------------------------------------------------------

    // ? Freight Costs
    // -----------------------------------------------------------------------------------------------------------------
    struct GetAllFreightCosts {
    };

    struct GetFreightCost {
        const std::string order_id{};

        explicit GetFreightCost(std::string order_id) : order_id{std::move(order_id)} {
        };
    };

    struct GetFreightCostData {
        const std::string order_id{};
        const std::string field{};

        explicit GetFreightCostData(std::string order_id, std::string field) : order_id{std::move(order_id)},
                                                                               field{std::move(field)} {
        };
    };

    // -----------------------------------------------------------------------------------------------------------------

    // ? Online Users
    // -----------------------------------------------------------------------------------------------------------------
    struct GetAllOnlineUsers {
    };

    struct GetOnlineUser {
        const std::string session_id{};

        explicit GetOnlineUser(std::string session_id) : session_id{std::move(session_id)} {
        };
    };

    struct GetOnlineUsersByRole {
        const std::string role{};

        explicit GetOnlineUsersByRole(std::string role) : role{std::move(role)} {
        };
    };

    struct GetOnlineUserData {
        const std::string session_id{};
        const std::string field{};

        explicit GetOnlineUserData(std::string session_id, std::string field) : session_id{std::move(session_id)},
            field{std::move(field)} {
        };
    };

    // -----------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------

public:
    // RAII
    QueryProcessor() = default;

    ~QueryProcessor() = default;

    // TODO: There has to be a better way to do this
    using Query = std::variant<GetAllUsers, GetUser, GetUsersByRole, GetUserData, GetAllTrucks, GetTruck,
        GetTrucksBySize,
        GetTrucksByModel, GetTruckData, GetWarehouse, GetWarehouseData, GetOrder, GetOrderData,
        GetOrdersByFinalDestination,
        GetOrdersByReceiver, GetOrdersBySender, GetProduct, GetProductData, GetAllSuppliers, GetSupplier,
        GetSuppliersByLocation,
        GetSupplierData, GetAllFreightCosts, GetFreightCost, GetFreightCostData, GetAllOnlineUsers, GetOnlineUser,
        GetOnlineUsersByRole, GetOnlineUserData>;

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

    // ? Warehouse queries
    /**
     * @brief A query for getting a specific warehouse by id
     */
    static auto getWarehouse(const std::string &id) -> GetWarehouse { return GetWarehouse(id); };

    /**
     * @brief A query for fetching a field of some warehouse by their id
     */
    static auto getWarehouseData(const std::string &id, const std::string &field) -> GetWarehouseData {
        return GetWarehouseData(id, field);
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

    // ? Supplier queries
    /**
     * @brief A query for getting all suppliers
     */
    static auto getAllSuppliers() -> GetAllSuppliers { return GetAllSuppliers{}; }

    /**
     * @brief A query for getting a specific supplier by id
     */
    static auto getSupplier(const std::string &id) -> GetSupplier { return GetSupplier(id); };

    /**
     * @brief A query for getting suppliers by their location
     */
    static auto getSuppliersByLocation(const std::string &location) -> GetSuppliersByLocation {
        return GetSuppliersByLocation(location);
    };

    /**
     * @brief A query for fetching a field of some supplier by their id
     */
    static auto getSupplierData(const std::string &id, const std::string &field) -> GetSupplierData {
        return GetSupplierData(id, field);
    };

    // ? Freight Cost queries
    /**
     * @brief A query for getting all freight costs
     */
    static auto getAllFreightCosts() -> GetAllFreightCosts { return GetAllFreightCosts{}; }

    /**
     * @brief A query for getting a specific freight cost by order_id
     */
    static auto getFreightCost(const std::string &order_id) -> GetFreightCost { return GetFreightCost(order_id); };

    /**
     * @brief A query for fetching a field of some freight cost by their order_id
     */
    static auto getFreightCostData(const std::string &order_id, const std::string &field) -> GetFreightCostData {
        return GetFreightCostData(order_id, field);
    };

    // ? Online User queries
    /**
     * @brief A query for getting all online users
     */
    static auto getAllOnlineUsers() -> GetAllOnlineUsers { return GetAllOnlineUsers{}; }

    /**
     * @brief A query for getting a specific online user by session_id
     */
    static auto getOnlineUser(const std::string &session_id) -> GetOnlineUser { return GetOnlineUser(session_id); };

    /**
     * @brief A query for getting online users by their role
     */
    static auto getOnlineUsersByRole(const std::string &role) -> GetOnlineUsersByRole {
        return GetOnlineUsersByRole(role);
    };

    /**
     * @brief A query for fetching a field of some online user by their session_id
     */
    static auto getOnlineUserData(const std::string &session_id, const std::string &field) -> GetOnlineUserData {
        return GetOnlineUserData(session_id, field);
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

    /**
     * @brief Executes a given query
     */
    static auto executeQuery(const Query &query,
                             std::function<void(const drogon::HttpResponsePtr &)> &&callback) -> void;
};


#endif //SIMPLELOGISTICSSYSTEM_QUERY_PROCESSOR_H
