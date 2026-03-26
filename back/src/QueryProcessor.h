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

    struct CountUsersByRole {
    };

    struct CreateUser {
        const std::string id, name, password, address, role;

        explicit CreateUser(std::string id, std::string name, std::string password, std::string address,
                            std::string role)
            : id{std::move(id)}, name{std::move(name)}, password{std::move(password)}, address{std::move(address)},
              role{std::move(role)} {
        };
    };

    struct DeleteUser {
        const std::string id;

        explicit DeleteUser(std::string id) : id{std::move(id)} {
        };
    };

    struct UpdateUserPassword {
        const std::string id, password;

        explicit UpdateUserPassword(std::string id, std::string password) : id{std::move(id)},
                                                                            password{std::move(password)} {
        };
    };

    struct UpdateUsersData {
        const std::string id, name, address, role;

        explicit UpdateUsersData(std::string id, std::string name, std::string address, std::string role)
            : id{std::move(id)}, name{std::move(name)}, address{std::move(address)}, role{std::move(role)} {
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

    struct CountSuppliersByLocation {
    };

    struct CreateSupplier {
        const std::string id, name, location;

        explicit CreateSupplier(std::string id, std::string name, std::string location)
            : id{std::move(id)}, name{std::move(name)}, location{std::move(location)} {
        };
    };

    struct DeleteSupplier {
        const std::string id;

        explicit DeleteSupplier(std::string id) : id{std::move(id)} {
        };
    };

    struct UpdateSupplier {
        const std::string id, name, location;

        explicit UpdateSupplier(std::string id, std::string name, std::string location)
            : id{std::move(id)}, name{std::move(name)}, location{std::move(location)} {
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

    struct CountFreightCosts {
    };

    struct CreateFreightCost {
        const std::string order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at;

        explicit CreateFreightCost(std::string order_id, std::string fuel_cost, std::string labor_cost,
                                   std::string maintenance_cost, std::string total_cost, std::string calculated_at)
            : order_id{std::move(order_id)}, fuel_cost{std::move(fuel_cost)}, labor_cost{std::move(labor_cost)},
              maintenance_cost{std::move(maintenance_cost)}, total_cost{std::move(total_cost)},
              calculated_at{std::move(calculated_at)} {
        };
    };

    struct DeleteFreightCost {
        const std::string order_id;

        explicit DeleteFreightCost(std::string order_id) : order_id{std::move(order_id)} {
        };
    };

    struct UpdateFreightCost {
        const std::string order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at;

        explicit UpdateFreightCost(std::string order_id, std::string fuel_cost, std::string labor_cost,
                                   std::string maintenance_cost, std::string total_cost, std::string calculated_at)
            : order_id{std::move(order_id)}, fuel_cost{std::move(fuel_cost)}, labor_cost{std::move(labor_cost)},
              maintenance_cost{std::move(maintenance_cost)}, total_cost{std::move(total_cost)},
              calculated_at{std::move(calculated_at)} {
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

    struct CountOnlineUsersByRole {
    };

    // -----------------------------------------------------------------------------------------------------------------

    // ? Orders Items
    // -----------------------------------------------------------------------------------------------------------------
    struct CountOrderItemsByOrder {
    };

    struct CountOrderItemsByProduct {
    };

    struct CreateOrderItem {
        const std::string order_id, product_id, quantity;

        explicit CreateOrderItem(std::string order_id, std::string product_id, std::string quantity)
            : order_id{std::move(order_id)}, product_id{std::move(product_id)}, quantity{std::move(quantity)} {
        };
    };

    struct DeleteOrderItem {
        const std::string order_id, product_id;

        explicit DeleteOrderItem(std::string order_id, std::string product_id)
            : order_id{std::move(order_id)}, product_id{std::move(product_id)} {
        };
    };

    struct GetAllOrderItems {
    };

    struct GetOrderItemsByOrder {
        const std::string order_id;

        explicit GetOrderItemsByOrder(std::string order_id) : order_id{std::move(order_id)} {
        };
    };

    struct GetOrderItemsByProduct {
        const std::string product_id;

        explicit GetOrderItemsByProduct(std::string product_id) : product_id{std::move(product_id)} {
        };
    };

    struct GetOrderProductQuantity {
        const std::string order_id, product_id;

        explicit GetOrderProductQuantity(std::string order_id, std::string product_id)
            : order_id{std::move(order_id)}, product_id{std::move(product_id)} {
        };
    };

    struct UpdateOrderItemQuantity {
        const std::string order_id, product_id, quantity;

        explicit UpdateOrderItemQuantity(std::string order_id, std::string product_id, std::string quantity)
            : order_id{std::move(order_id)}, product_id{std::move(product_id)}, quantity{std::move(quantity)} {
        };
    };

    // -----------------------------------------------------------------------------------------------------------------

    // ? Supplies Routes
    // -----------------------------------------------------------------------------------------------------------------
    struct CountSuppliesRouteByOrder {
    };

    struct CountSuppliesRouteBySupplier {
    };

    struct CreateSuppliesRoute {
        const std::string order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival;

        explicit CreateSuppliesRoute(std::string order_id, std::string supplier_id, std::string truck_id,
                                     std::string estimated_departure, std::string estimated_arrival,
                                     std::string actual_arrival)
            : order_id{std::move(order_id)}, supplier_id{std::move(supplier_id)}, truck_id{std::move(truck_id)},
              estimated_departure{std::move(estimated_departure)}, estimated_arrival{std::move(estimated_arrival)},
              actual_arrival{std::move(actual_arrival)} {
        };
    };

    struct DeleteSuppliesRoute {
        const std::string order_id, supplier_id;

        explicit DeleteSuppliesRoute(std::string order_id, std::string supplier_id)
            : order_id{std::move(order_id)}, supplier_id{std::move(supplier_id)} {
        };
    };

    struct GetAllSuppliesRoute {
    };

    struct GetSuppliesRoute {
        const std::string order_id, supplier_id;

        explicit GetSuppliesRoute(std::string order_id, std::string supplier_id)
            : order_id{std::move(order_id)}, supplier_id{std::move(supplier_id)} {
        };
    };

    struct GetSuppliesRouteByOrder {
        const std::string order_id;

        explicit GetSuppliesRouteByOrder(std::string order_id) : order_id{std::move(order_id)} {
        };
    };

    struct GetSuppliesRouteBySupplier {
        const std::string supplier_id;

        explicit GetSuppliesRouteBySupplier(std::string supplier_id) : supplier_id{std::move(supplier_id)} {
        };
    };

    struct UpdateSuppliesRoute {
        const std::string order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival;

        explicit UpdateSuppliesRoute(std::string order_id, std::string supplier_id, std::string truck_id,
                                     std::string estimated_departure, std::string estimated_arrival,
                                     std::string actual_arrival)
            : order_id{std::move(order_id)}, supplier_id{std::move(supplier_id)}, truck_id{std::move(truck_id)},
              estimated_departure{std::move(estimated_departure)}, estimated_arrival{std::move(estimated_arrival)},
              actual_arrival{std::move(actual_arrival)} {
        };
    };

    // -----------------------------------------------------------------------------------------------------------------

    // ? Truck Cargo
    // -----------------------------------------------------------------------------------------------------------------
    struct CountTruckCargoByProduct {
    };

    struct CountTruckCargoByTruck {
    };

    struct CreateTruckCargo {
        const std::string truck_id, product_id, quantity;

        explicit CreateTruckCargo(std::string truck_id, std::string product_id, std::string quantity)
            : truck_id{std::move(truck_id)}, product_id{std::move(product_id)}, quantity{std::move(quantity)} {
        };
    };

    struct DeleteTruckCargoProduct {
        const std::string truck_id, product_id;

        explicit DeleteTruckCargoProduct(std::string truck_id, std::string product_id)
            : truck_id{std::move(truck_id)}, product_id{std::move(product_id)} {
        };
    };

    struct GetAllTrucksCargo {
    };

    struct GetTruckCargo {
        const std::string truck_id, product_id;

        explicit GetTruckCargo(std::string truck_id, std::string product_id)
            : truck_id{std::move(truck_id)}, product_id{std::move(product_id)} {
        };
    };

    struct GetTruckCargoByProduct {
        const std::string product_id;

        explicit GetTruckCargoByProduct(std::string product_id) : product_id{std::move(product_id)} {
        };
    };

    struct GetTruckCargoByTruck {
        const std::string truck_id;

        explicit GetTruckCargoByTruck(std::string truck_id) : truck_id{std::move(truck_id)} {
        };
    };

    struct UpdateTruckCargoQuantity {
        const std::string truck_id, product_id, quantity;

        explicit UpdateTruckCargoQuantity(std::string truck_id, std::string product_id, std::string quantity)
            : truck_id{std::move(truck_id)}, product_id{std::move(product_id)}, quantity{std::move(quantity)} {
        };
    };

    // -----------------------------------------------------------------------------------------------------------------

    // ? Warehouses Stocks
    // -----------------------------------------------------------------------------------------------------------------
    struct CountStockByProduct {
    };

    struct CountStockByWarehouse {
    };

    struct CreateWarehouseStock {
        const std::string warehouse_id, product_id, quantity;

        explicit CreateWarehouseStock(std::string warehouse_id, std::string product_id, std::string quantity)
            : warehouse_id{std::move(warehouse_id)}, product_id{std::move(product_id)}, quantity{std::move(quantity)} {
        };
    };

    struct DeleteWarehouseStock {
        const std::string warehouse_id, product_id;

        explicit DeleteWarehouseStock(std::string warehouse_id, std::string product_id)
            : warehouse_id{std::move(warehouse_id)}, product_id{std::move(product_id)} {
        };
    };

    struct GetAllWarehouseStock {
    };

    struct GetStockByProduct {
        const std::string product_id;

        explicit GetStockByProduct(std::string product_id) : product_id{std::move(product_id)} {
        };
    };

    struct GetStockByWarehouse {
        const std::string warehouse_id;

        explicit GetStockByWarehouse(std::string warehouse_id) : warehouse_id{std::move(warehouse_id)} {
        };
    };

    struct GetWarehouseProductQuantity {
        const std::string warehouse_id, product_id;

        explicit GetWarehouseProductQuantity(std::string warehouse_id, std::string product_id)
            : warehouse_id{std::move(warehouse_id)}, product_id{std::move(product_id)} {
        };
    };

    struct UpdateWarehouseStockQuantity {
        const std::string warehouse_id, product_id, quantity;

        explicit UpdateWarehouseStockQuantity(std::string warehouse_id, std::string product_id, std::string quantity)
            : warehouse_id{std::move(warehouse_id)}, product_id{std::move(product_id)}, quantity{std::move(quantity)} {
        };
    };

    // -----------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------

public:
    // RAII
    QueryProcessor() = default;

    ~QueryProcessor() = default;

    // TODO: There has to be a better way to do this
    using Query = std::variant<GetAllUsers, GetUser, GetUsersByRole, GetUserData,
        CountUsersByRole, CreateUser, DeleteUser, UpdateUserPassword, UpdateUsersData,
        GetAllTrucks, GetTruck, GetTrucksBySize, GetTrucksByModel, GetTruckData,
        GetWarehouse, GetWarehouseData,
        GetOrder, GetOrderData, GetOrdersByFinalDestination, GetOrdersByReceiver, GetOrdersBySender,
        GetProduct, GetProductData,
        GetAllSuppliers, GetSupplier, GetSuppliersByLocation, GetSupplierData,
        CountSuppliersByLocation, CreateSupplier, DeleteSupplier, UpdateSupplier,
        GetAllFreightCosts, GetFreightCost, GetFreightCostData,
        CountFreightCosts, CreateFreightCost, DeleteFreightCost, UpdateFreightCost,
        GetAllOnlineUsers, GetOnlineUser, GetOnlineUsersByRole, GetOnlineUserData,
        CountOnlineUsersByRole,
        CountOrderItemsByOrder, CountOrderItemsByProduct, CreateOrderItem, DeleteOrderItem, GetAllOrderItems,
        GetOrderItemsByOrder, GetOrderItemsByProduct, GetOrderProductQuantity, UpdateOrderItemQuantity,
        CountSuppliesRouteByOrder, CountSuppliesRouteBySupplier, CreateSuppliesRoute, DeleteSuppliesRoute,
        GetAllSuppliesRoute, GetSuppliesRoute, GetSuppliesRouteByOrder, GetSuppliesRouteBySupplier, UpdateSuppliesRoute,
        CountTruckCargoByProduct, CountTruckCargoByTruck, CreateTruckCargo, DeleteTruckCargoProduct, GetAllTrucksCargo,
        GetTruckCargo, GetTruckCargoByProduct, GetTruckCargoByTruck, UpdateTruckCargoQuantity,
        CountStockByProduct, CountStockByWarehouse, CreateWarehouseStock, DeleteWarehouseStock, GetAllWarehouseStock,
        GetStockByProduct, GetStockByWarehouse, GetWarehouseProductQuantity, UpdateWarehouseStockQuantity>;

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

    static auto countUsersByRole() -> CountUsersByRole { return CountUsersByRole{}; };

    static auto createUser(const std::string &id, const std::string &name, const std::string &password,
                            const std::string &address, const std::string &role) -> CreateUser {
        return CreateUser(id, name, password, address, role);
    };

    static auto deleteUser(const std::string &id) -> DeleteUser { return DeleteUser(id); };

    static auto updateUserPassword(const std::string &id, const std::string &password) -> UpdateUserPassword {
        return UpdateUserPassword(id, password);
    };

    static auto updateUsersData(const std::string &id, const std::string &name, const std::string &address,
                                 const std::string &role) -> UpdateUsersData {
        return UpdateUsersData(id, name, address, role);
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

    static auto countSuppliersByLocation() -> CountSuppliersByLocation { return CountSuppliersByLocation{}; };

    static auto createSupplier(const std::string &id, const std::string &name, const std::string &location)
        -> CreateSupplier {
        return CreateSupplier(id, name, location);
    };

    static auto deleteSupplier(const std::string &id) -> DeleteSupplier { return DeleteSupplier(id); };

    static auto updateSupplier(const std::string &id, const std::string &name, const std::string &location)
        -> UpdateSupplier {
        return UpdateSupplier(id, name, location);
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

    static auto countFreightCosts() -> CountFreightCosts { return CountFreightCosts{}; };

    static auto createFreightCost(const std::string &order_id, const std::string &fuel_cost,
                                   const std::string &labor_cost, const std::string &maintenance_cost,
                                   const std::string &total_cost, const std::string &calculated_at)
        -> CreateFreightCost {
        return CreateFreightCost(order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at);
    };

    static auto deleteFreightCost(const std::string &order_id) -> DeleteFreightCost {
        return DeleteFreightCost(order_id);
    };

    static auto updateFreightCost(const std::string &order_id, const std::string &fuel_cost,
                                   const std::string &labor_cost, const std::string &maintenance_cost,
                                   const std::string &total_cost, const std::string &calculated_at)
        -> UpdateFreightCost {
        return UpdateFreightCost(order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at);
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

    static auto countOnlineUsersByRole() -> CountOnlineUsersByRole { return CountOnlineUsersByRole{}; };

    // ? Orders Items queries
    static auto countOrderItemsByOrder() -> CountOrderItemsByOrder { return CountOrderItemsByOrder{}; };

    static auto countOrderItemsByProduct() -> CountOrderItemsByProduct { return CountOrderItemsByProduct{}; };

    static auto createOrderItem(const std::string &order_id, const std::string &product_id,
                                 const std::string &quantity) -> CreateOrderItem {
        return CreateOrderItem(order_id, product_id, quantity);
    };

    static auto deleteOrderItem(const std::string &order_id, const std::string &product_id) -> DeleteOrderItem {
        return DeleteOrderItem(order_id, product_id);
    };

    static auto getAllOrderItems() -> GetAllOrderItems { return GetAllOrderItems{}; };

    static auto getOrderItemsByOrder(const std::string &order_id) -> GetOrderItemsByOrder {
        return GetOrderItemsByOrder(order_id);
    };

    static auto getOrderItemsByProduct(const std::string &product_id) -> GetOrderItemsByProduct {
        return GetOrderItemsByProduct(product_id);
    };

    static auto getOrderProductQuantity(const std::string &order_id, const std::string &product_id)
        -> GetOrderProductQuantity {
        return GetOrderProductQuantity(order_id, product_id);
    };

    static auto updateOrderItemQuantity(const std::string &order_id, const std::string &product_id,
                                         const std::string &quantity) -> UpdateOrderItemQuantity {
        return UpdateOrderItemQuantity(order_id, product_id, quantity);
    };

    // ? Supplies Routes queries
    static auto countSuppliesRouteByOrder() -> CountSuppliesRouteByOrder { return CountSuppliesRouteByOrder{}; };

    static auto countSuppliesRouteBySupplier() -> CountSuppliesRouteBySupplier {
        return CountSuppliesRouteBySupplier{};
    };

    static auto createSuppliesRoute(const std::string &order_id, const std::string &supplier_id,
                                     const std::string &truck_id, const std::string &estimated_departure,
                                     const std::string &estimated_arrival, const std::string &actual_arrival)
        -> CreateSuppliesRoute {
        return CreateSuppliesRoute(order_id, supplier_id, truck_id, estimated_departure, estimated_arrival,
                                   actual_arrival);
    };

    static auto deleteSuppliesRoute(const std::string &order_id, const std::string &supplier_id) -> DeleteSuppliesRoute {
        return DeleteSuppliesRoute(order_id, supplier_id);
    };

    static auto getAllSuppliesRoute() -> GetAllSuppliesRoute { return GetAllSuppliesRoute{}; };

    static auto getSuppliesRoute(const std::string &order_id, const std::string &supplier_id) -> GetSuppliesRoute {
        return GetSuppliesRoute(order_id, supplier_id);
    };

    static auto getSuppliesRouteByOrder(const std::string &order_id) -> GetSuppliesRouteByOrder {
        return GetSuppliesRouteByOrder(order_id);
    };

    static auto getSuppliesRouteBySupplier(const std::string &supplier_id) -> GetSuppliesRouteBySupplier {
        return GetSuppliesRouteBySupplier(supplier_id);
    };

    static auto updateSuppliesRoute(const std::string &order_id, const std::string &supplier_id,
                                     const std::string &truck_id, const std::string &estimated_departure,
                                     const std::string &estimated_arrival, const std::string &actual_arrival)
        -> UpdateSuppliesRoute {
        return UpdateSuppliesRoute(order_id, supplier_id, truck_id, estimated_departure, estimated_arrival,
                                   actual_arrival);
    };

    // ? Truck Cargo queries
    static auto countTruckCargoByProduct() -> CountTruckCargoByProduct { return CountTruckCargoByProduct{}; };

    static auto countTruckCargoByTruck() -> CountTruckCargoByTruck { return CountTruckCargoByTruck{}; };

    static auto createTruckCargo(const std::string &truck_id, const std::string &product_id,
                                  const std::string &quantity) -> CreateTruckCargo {
        return CreateTruckCargo(truck_id, product_id, quantity);
    };

    static auto deleteTruckCargoProduct(const std::string &truck_id, const std::string &product_id)
        -> DeleteTruckCargoProduct {
        return DeleteTruckCargoProduct(truck_id, product_id);
    };

    static auto getAllTrucksCargo() -> GetAllTrucksCargo { return GetAllTrucksCargo{}; };

    static auto getTruckCargo(const std::string &truck_id, const std::string &product_id) -> GetTruckCargo {
        return GetTruckCargo(truck_id, product_id);
    };

    static auto getTruckCargoByProduct(const std::string &product_id) -> GetTruckCargoByProduct {
        return GetTruckCargoByProduct(product_id);
    };

    static auto getTruckCargoByTruck(const std::string &truck_id) -> GetTruckCargoByTruck {
        return GetTruckCargoByTruck(truck_id);
    };

    static auto updateTruckCargoQuantity(const std::string &truck_id, const std::string &product_id,
                                          const std::string &quantity) -> UpdateTruckCargoQuantity {
        return UpdateTruckCargoQuantity(truck_id, product_id, quantity);
    };

    // ? Warehouses Stocks queries
    static auto countStockByProduct() -> CountStockByProduct { return CountStockByProduct{}; };

    static auto countStockByWarehouse() -> CountStockByWarehouse { return CountStockByWarehouse{}; };

    static auto createWarehouseStock(const std::string &warehouse_id, const std::string &product_id,
                                      const std::string &quantity) -> CreateWarehouseStock {
        return CreateWarehouseStock(warehouse_id, product_id, quantity);
    };

    static auto deleteWarehouseStock(const std::string &warehouse_id, const std::string &product_id)
        -> DeleteWarehouseStock {
        return DeleteWarehouseStock(warehouse_id, product_id);
    };

    static auto getAllWarehouseStock() -> GetAllWarehouseStock { return GetAllWarehouseStock{}; };

    static auto getStockByProduct(const std::string &product_id) -> GetStockByProduct {
        return GetStockByProduct(product_id);
    };

    static auto getStockByWarehouse(const std::string &warehouse_id) -> GetStockByWarehouse {
        return GetStockByWarehouse(warehouse_id);
    };

    static auto getWarehouseProductQuantity(const std::string &warehouse_id, const std::string &product_id)
        -> GetWarehouseProductQuantity {
        return GetWarehouseProductQuantity(warehouse_id, product_id);
    };

    static auto updateWarehouseStockQuantity(const std::string &warehouse_id, const std::string &product_id,
                                              const std::string &quantity) -> UpdateWarehouseStockQuantity {
        return UpdateWarehouseStockQuantity(warehouse_id, product_id, quantity);
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
