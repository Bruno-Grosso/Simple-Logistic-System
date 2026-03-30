//
// Created by be on 3/22/26.
//

#ifndef SIMPLELOGISTICSSYSTEM_QUERY_PROCESSOR_H
#define SIMPLELOGISTICSSYSTEM_QUERY_PROCESSOR_H

#include <functional>
#include <optional>
#include <string>
#include <string_view>
#include <utility>
#include <variant>
#include <drogon/HttpResponse.h>
#include <json/json.h>


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
        const std::string id, name, email, password, address, role;

        explicit CreateUser(std::string id, std::string name, std::string email, std::string password,
                            std::string address, std::string role)
            : id{std::move(id)}, name{std::move(name)}, email{std::move(email)}, password{std::move(password)},
              address{std::move(address)}, role{std::move(role)} {
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

    /** Login: fetch id, name, password, role (internal — do not expose via public REST). */
    struct GetUserForAuth {
        const std::string email{};

        explicit GetUserForAuth(std::string email) : email{std::move(email)} {
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

    struct CreateTruck {
        const std::string id, model, speed, is_valid, is_delivering, size, volume_current, volume_max, weight_current,
            weight_max, has_refrigeration, current_warehouse_id, origin_warehouse_id, destination_warehouse_id,
            estimated_time, fuel_capacity, fuel_current, fuel_consumption, truck_maintenance;

        explicit CreateTruck(std::string id, std::string model, std::string speed, std::string is_valid,
                             std::string is_delivering, std::string size, std::string volume_current,
                             std::string volume_max, std::string weight_current, std::string weight_max,
                             std::string has_refrigeration, std::string current_warehouse_id,
                             std::string origin_warehouse_id, std::string destination_warehouse_id,
                             std::string estimated_time, std::string fuel_capacity, std::string fuel_current,
                             std::string fuel_consumption, std::string truck_maintenance)
            : id{std::move(id)}, model{std::move(model)}, speed{std::move(speed)}, is_valid{std::move(is_valid)},
              is_delivering{std::move(is_delivering)}, size{std::move(size)},
              volume_current{std::move(volume_current)}, volume_max{std::move(volume_max)},
              weight_current{std::move(weight_current)}, weight_max{std::move(weight_max)},
              has_refrigeration{std::move(has_refrigeration)}, current_warehouse_id{std::move(current_warehouse_id)},
              origin_warehouse_id{std::move(origin_warehouse_id)},
              destination_warehouse_id{std::move(destination_warehouse_id)}, estimated_time{std::move(estimated_time)},
              fuel_capacity{std::move(fuel_capacity)}, fuel_current{std::move(fuel_current)},
              fuel_consumption{std::move(fuel_consumption)}, truck_maintenance{std::move(truck_maintenance)} {
        };
    };

    struct DeleteTruck {
        const std::string id;

        explicit DeleteTruck(std::string id) : id{std::move(id)} {
        };
    };

    struct UpdateTruck {
        const std::string id, model, speed, is_valid, is_delivering, size, volume_current, volume_max, weight_current,
            weight_max, has_refrigeration, current_warehouse_id, origin_warehouse_id, destination_warehouse_id,
            estimated_time, fuel_capacity, fuel_current, fuel_consumption, truck_maintenance;

        explicit UpdateTruck(std::string id, std::string model, std::string speed, std::string is_valid,
                             std::string is_delivering, std::string size, std::string volume_current,
                             std::string volume_max, std::string weight_current, std::string weight_max,
                             std::string has_refrigeration, std::string current_warehouse_id,
                             std::string origin_warehouse_id, std::string destination_warehouse_id,
                             std::string estimated_time, std::string fuel_capacity, std::string fuel_current,
                             std::string fuel_consumption, std::string truck_maintenance)
            : id{std::move(id)}, model{std::move(model)}, speed{std::move(speed)}, is_valid{std::move(is_valid)},
              is_delivering{std::move(is_delivering)}, size{std::move(size)},
              volume_current{std::move(volume_current)}, volume_max{std::move(volume_max)},
              weight_current{std::move(weight_current)}, weight_max{std::move(weight_max)},
              has_refrigeration{std::move(has_refrigeration)}, current_warehouse_id{std::move(current_warehouse_id)},
              origin_warehouse_id{std::move(origin_warehouse_id)},
              destination_warehouse_id{std::move(destination_warehouse_id)}, estimated_time{std::move(estimated_time)},
              fuel_capacity{std::move(fuel_capacity)}, fuel_current{std::move(fuel_current)},
              fuel_consumption{std::move(fuel_consumption)}, truck_maintenance{std::move(truck_maintenance)} {
        };
    };

    struct GetTrucksAtWarehouse {
        const std::string warehouse_id;

        explicit GetTrucksAtWarehouse(std::string warehouse_id) : warehouse_id{std::move(warehouse_id)} {
        };
    };

    struct GetTrucksByDestination {
        const std::string warehouse_id;

        explicit GetTrucksByDestination(std::string warehouse_id) : warehouse_id{std::move(warehouse_id)} {
        };
    };

    struct GetTrucksByOrigin {
        const std::string warehouse_id;

        explicit GetTrucksByOrigin(std::string warehouse_id) : warehouse_id{std::move(warehouse_id)} {
        };
    };

    struct GetCurrentlyDeliveringTrucks {
    };

    struct GetNotCurrentlyDeliveringTrucks {
    };

    struct GetValidTrucks {
    };

    struct GetInvalidTrucks {
    };

    struct GetRefrigeratedTrucks {
    };

    struct GetNotRefrigeratedTrucks {
    };

    struct GetRefrigeratedDeliveringTrucks {
    };

    struct GetRefrigeratedNotDeliveringTrucks {
    };

    struct GetTruckDetailedCargo {
        const std::string truck_id;

        explicit GetTruckDetailedCargo(std::string truck_id) : truck_id{std::move(truck_id)} {
        };
    };

    struct GetAllTrucksWithCargo {
    };

    struct FindTruckByProduct {
        const std::string product_id;

        explicit FindTruckByProduct(std::string product_id) : product_id{std::move(product_id)} {
        };
    };

    struct FindTruckByVolumeCapacity {
        const std::string volume;

        explicit FindTruckByVolumeCapacity(std::string volume) : volume{std::move(volume)} {
        };
    };

    struct FindTruckByWeightCapacity {
        const std::string weight;

        explicit FindTruckByWeightCapacity(std::string weight) : weight{std::move(weight)} {
        };
    };

    struct FindRefrigeratedTruckByVolumeCapacity {
        const std::string volume;

        explicit FindRefrigeratedTruckByVolumeCapacity(std::string volume) : volume{std::move(volume)} {
        };
    };

    struct FindRefrigeratedTruckByWeightCapacity {
        const std::string weight;

        explicit FindRefrigeratedTruckByWeightCapacity(std::string weight) : weight{std::move(weight)} {
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

    struct CreateWarehouse {
        const std::string id, location, size, volume_current, volume_max, has_refrigeration, fuel_price;

        explicit CreateWarehouse(std::string id, std::string location, std::string size, std::string volume_current,
                                 std::string volume_max, std::string has_refrigeration, std::string fuel_price)
            : id{std::move(id)}, location{std::move(location)}, size{std::move(size)},
              volume_current{std::move(volume_current)}, volume_max{std::move(volume_max)},
              has_refrigeration{std::move(has_refrigeration)}, fuel_price{std::move(fuel_price)} {
        };
    };

    struct DeleteWarehouse {
        const std::string id;

        explicit DeleteWarehouse(std::string id) : id{std::move(id)} {
        };
    };

    struct UpdateWarehouse {
        const std::string id, location, size, volume_current, volume_max, has_refrigeration, fuel_price;

        explicit UpdateWarehouse(std::string id, std::string location, std::string size, std::string volume_current,
                                 std::string volume_max, std::string has_refrigeration, std::string fuel_price)
            : id{std::move(id)}, location{std::move(location)}, size{std::move(size)},
              volume_current{std::move(volume_current)}, volume_max{std::move(volume_max)},
              has_refrigeration{std::move(has_refrigeration)}, fuel_price{std::move(fuel_price)} {
        };
    };

    struct GetAllWarehouses {
    };

    struct GetWarehouseProducts {
        const std::string warehouse_id;

        explicit GetWarehouseProducts(std::string warehouse_id) : warehouse_id{std::move(warehouse_id)} {
        };
    };

    struct GetWarehouseTotalItems {
        const std::string warehouse_id;

        explicit GetWarehouseTotalItems(std::string warehouse_id) : warehouse_id{std::move(warehouse_id)} {
        };
    };

    struct GetWarehouseAvailableCapacity {
    };

    struct GetWarehousesSortedByFreeVolume {
    };

    struct GetMostLoadedWarehouses {
    };

    struct GetRefrigeratedWarehouses {
    };

    struct CalculateWarehouseUsedVolume {
    };

    struct FindWarehouseByProduct {
        const std::string product_id;

        explicit FindWarehouseByProduct(std::string product_id) : product_id{std::move(product_id)} {
        };
    };

    struct FindWarehouseByRequiredVolume {
        const std::string volume;

        explicit FindWarehouseByRequiredVolume(std::string volume) : volume{std::move(volume)} {
        };
    };

    struct FindColdStorageWarehouse {
    };

    struct FindColdWarehouseWithCapacity {
        const std::string volume;

        explicit FindColdWarehouseWithCapacity(std::string volume) : volume{std::move(volume)} {
        };
    };

    struct FindEmptyWarehouses {
    };

    struct FindExpiringProductsInWarehouses {
    };

    struct FindFragileProductsInWarehouses {
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

    struct CreateOrder {
        const std::string id, client_id, final_destination, time_limit, price, status, supplier_id, supplier_delivery;

        explicit CreateOrder(std::string id, std::string client_id, std::string final_destination,
                             std::string time_limit, std::string price, std::string status, std::string supplier_id,
                             std::string supplier_delivery)
            : id{std::move(id)}, client_id{std::move(client_id)}, final_destination{std::move(final_destination)},
              time_limit{std::move(time_limit)}, price{std::move(price)}, status{std::move(status)},
              supplier_id{std::move(supplier_id)}, supplier_delivery{std::move(supplier_delivery)} {
        };
    };

    struct DeleteOrder {
        const std::string id;

        explicit DeleteOrder(std::string id) : id{std::move(id)} {
        };
    };

    struct UpdateOrder {
        const std::string id, client_id, final_destination, time_limit, price, status, supplier_id, supplier_delivery;

        explicit UpdateOrder(std::string id, std::string client_id, std::string final_destination,
                             std::string time_limit, std::string price, std::string status, std::string supplier_id,
                             std::string supplier_delivery)
            : id{std::move(id)}, client_id{std::move(client_id)}, final_destination{std::move(final_destination)},
              time_limit{std::move(time_limit)}, price{std::move(price)}, status{std::move(status)},
              supplier_id{std::move(supplier_id)}, supplier_delivery{std::move(supplier_delivery)} {
        };
    };

    struct GetAllOrders {
    };

    struct GetOrdersByStatus {
        const std::string status;

        explicit GetOrdersByStatus(std::string status) : status{std::move(status)} {
        };
    };

    struct GetCancelledOrders {
    };

    struct GetDeliveredOrders {
    };

    struct GetPendingOrders {
    };

    struct GetShippedOrders {
    };

    struct GetSupplierDeliveredOrders {
    };

    struct GetSupplierOrders {
        const std::string supplier_id;

        explicit GetSupplierOrders(std::string supplier_id) : supplier_id{std::move(supplier_id)} {
        };
    };

    struct GetOrderFreightCost {
        const std::string order_id;

        explicit GetOrderFreightCost(std::string order_id) : order_id{std::move(order_id)} {
        };
    };

    struct GetOrderItems {
        const std::string order_id;

        explicit GetOrderItems(std::string order_id) : order_id{std::move(order_id)} {
        };
    };

    struct GetOrderRoute {
        const std::string order_id;

        explicit GetOrderRoute(std::string order_id) : order_id{std::move(order_id)} {
        };
    };

    struct GetOrderRoutesByTruck {
        const std::string truck_id;

        explicit GetOrderRoutesByTruck(std::string truck_id) : truck_id{std::move(truck_id)} {
        };
    };

    struct GetOrderRoutesByWarehouse {
        const std::string warehouse_id;

        explicit GetOrderRoutesByWarehouse(std::string warehouse_id) : warehouse_id{std::move(warehouse_id)} {
        };
    };

    struct GetOrderSupplierRoute {
        const std::string order_id;

        explicit GetOrderSupplierRoute(std::string order_id) : order_id{std::move(order_id)} {
        };
    };

    struct FindOrderByProduct {
        const std::string product_id;

        explicit FindOrderByProduct(std::string product_id) : product_id{std::move(product_id)} {
        };
    };

    struct GetAllOrdersFreightCosts {
    };

    struct GetAllOrdersItems {
    };

    // -----------------------------------------------------------------------------------------------------------------

    // ? Orders Route
    // -----------------------------------------------------------------------------------------------------------------
    struct CreateOrderRoute {
        const std::string order_id, step, warehouse_id, truck_id, destination_warehouse_id, estimated_time, arrived_at;

        explicit CreateOrderRoute(std::string order_id, std::string step, std::string warehouse_id,
                                  std::string truck_id, std::string destination_warehouse_id,
                                  std::string estimated_time, std::string arrived_at)
            : order_id{std::move(order_id)}, step{std::move(step)}, warehouse_id{std::move(warehouse_id)},
              truck_id{std::move(truck_id)}, destination_warehouse_id{std::move(destination_warehouse_id)},
              estimated_time{std::move(estimated_time)}, arrived_at{std::move(arrived_at)} {
        };
    };

    struct DeleteOrderRoute {
        const std::string order_id, step;

        explicit DeleteOrderRoute(std::string order_id, std::string step)
            : order_id{std::move(order_id)}, step{std::move(step)} {
        };
    };

    struct GetAllOrdersRoute {
    };

    struct GetArrivedOrdersRoute {
    };

    struct GetPendingArrivalOrdersRoute {
    };

    struct GetOrdersRouteByDestination {
        const std::string destination_warehouse_id;

        explicit GetOrdersRouteByDestination(std::string destination_warehouse_id) : destination_warehouse_id{
            std::move(destination_warehouse_id)
        } {
        };
    };

    struct GetOrdersRouteByOrder {
        const std::string order_id;

        explicit GetOrdersRouteByOrder(std::string order_id) : order_id{std::move(order_id)} {
        };
    };

    struct GetOrdersRouteByStep {
        const std::string order_id, step;

        explicit GetOrdersRouteByStep(std::string order_id, std::string step)
            : order_id{std::move(order_id)}, step{std::move(step)} {
        };
    };

    struct GetOrdersRouteByTruck {
        const std::string truck_id;

        explicit GetOrdersRouteByTruck(std::string truck_id) : truck_id{std::move(truck_id)} {
        };
    };

    struct GetOrdersRouteByWarehouse {
        const std::string warehouse_id;

        explicit GetOrdersRouteByWarehouse(std::string warehouse_id) : warehouse_id{std::move(warehouse_id)} {
        };
    };

    struct UpdateOrderRoute {
        const std::string order_id, step, warehouse_id, truck_id, destination_warehouse_id, estimated_time, arrived_at;

        explicit UpdateOrderRoute(std::string order_id, std::string step, std::string warehouse_id,
                                  std::string truck_id, std::string destination_warehouse_id,
                                  std::string estimated_time, std::string arrived_at)
            : order_id{std::move(order_id)}, step{std::move(step)}, warehouse_id{std::move(warehouse_id)},
              truck_id{std::move(truck_id)}, destination_warehouse_id{std::move(destination_warehouse_id)},
              estimated_time{std::move(estimated_time)}, arrived_at{std::move(arrived_at)} {
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

    struct CreateProduct {
        const std::string id, name, price, is_cold, is_fragile, expire_date, size, volume, weight;

        explicit CreateProduct(std::string id, std::string name, std::string price, std::string is_cold,
                               std::string is_fragile, std::string expire_date, std::string size, std::string volume,
                               std::string weight)
            : id{std::move(id)}, name{std::move(name)}, price{std::move(price)}, is_cold{std::move(is_cold)},
              is_fragile{std::move(is_fragile)}, expire_date{std::move(expire_date)}, size{std::move(size)},
              volume{std::move(volume)}, weight{std::move(weight)} {
        };
    };

    struct DeleteProduct {
        const std::string id;

        explicit DeleteProduct(std::string id) : id{std::move(id)} {
        };
    };

    struct UpdateProduct {
        const std::string id, name, price, is_cold, is_fragile, expire_date, size, volume, weight;

        explicit UpdateProduct(std::string id, std::string name, std::string price, std::string is_cold,
                               std::string is_fragile, std::string expire_date, std::string size, std::string volume,
                               std::string weight)
            : id{std::move(id)}, name{std::move(name)}, price{std::move(price)}, is_cold{std::move(is_cold)},
              is_fragile{std::move(is_fragile)}, expire_date{std::move(expire_date)}, size{std::move(size)},
              volume{std::move(volume)}, weight{std::move(weight)} {
        };
    };

    struct GetAllProducts {
    };

    struct GetProductById {
        const std::string id;

        explicit GetProductById(std::string id) : id{std::move(id)} {
        };
    };

    struct GetProductByName {
        const std::string name;

        explicit GetProductByName(std::string name) : name{std::move(name)} {
        };
    };

    struct GetColdProducts {
    };

    struct GetExpirableProducts {
    };

    struct GetFragileProducts {
    };

    struct GetProductOrders {
        const std::string product_id;

        explicit GetProductOrders(std::string product_id) : product_id{std::move(product_id)} {
        };
    };

    struct GetProductStockInWarehouses {
        const std::string product_id;

        explicit GetProductStockInWarehouses(std::string product_id) : product_id{std::move(product_id)} {
        };
    };

    struct FindProductByPriceRange {
        const std::string min_price, max_price;

        explicit FindProductByPriceRange(std::string min_price, std::string max_price)
            : min_price{std::move(min_price)}, max_price{std::move(max_price)} {
        };
    };

    struct FindProductByVolume {
        const std::string volume;

        explicit FindProductByVolume(std::string volume) : volume{std::move(volume)} {
        };
    };

    struct FindProductByWeight {
        const std::string weight;

        explicit FindProductByWeight(std::string weight) : weight{std::move(weight)} {
        };
    };

    struct GetAllProductsOrders {
    };

    struct GetAllProductsStock {
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

    struct CreateOnlineUser {
        const std::string session_id, user_id, login_time, last_activity;

        explicit CreateOnlineUser(std::string session_id, std::string user_id, std::string login_time,
                                   std::string last_activity)
            : session_id{std::move(session_id)}, user_id{std::move(user_id)}, login_time{std::move(login_time)},
              last_activity{std::move(last_activity)} {
        };
    };

    struct DeleteOnlineUser {
        const std::string session_id;

        explicit DeleteOnlineUser(std::string session_id) : session_id{std::move(session_id)} {
        };
    };

    struct UpdateOnlineUser {
        const std::string session_id, last_activity;

        explicit UpdateOnlineUser(std::string session_id, std::string last_activity)
            : session_id{std::move(session_id)}, last_activity{std::move(last_activity)} {
        };
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

    using Query = std::variant<
        // Users
        GetAllUsers, GetUser, GetUsersByRole, GetUserData, CountUsersByRole, CreateUser, DeleteUser, UpdateUserPassword, UpdateUsersData, GetUserForAuth,
        // Trucks
        GetAllTrucks, GetTruck, GetTrucksBySize, GetTrucksByModel, GetTruckData, CreateTruck, DeleteTruck, UpdateTruck,
        GetTrucksAtWarehouse, GetTrucksByDestination, GetTrucksByOrigin, GetCurrentlyDeliveringTrucks,
        GetNotCurrentlyDeliveringTrucks, GetValidTrucks, GetInvalidTrucks, GetRefrigeratedTrucks,
        GetNotRefrigeratedTrucks, GetRefrigeratedDeliveringTrucks, GetRefrigeratedNotDeliveringTrucks,
        GetTruckDetailedCargo, GetAllTrucksWithCargo, FindTruckByProduct, FindTruckByVolumeCapacity,
        FindTruckByWeightCapacity, FindRefrigeratedTruckByVolumeCapacity, FindRefrigeratedTruckByWeightCapacity,
        // Warehouses
        GetWarehouse, GetWarehouseData, CreateWarehouse, DeleteWarehouse, UpdateWarehouse, GetAllWarehouses,
        GetWarehouseProducts, GetWarehouseTotalItems, GetWarehouseAvailableCapacity,
        GetWarehousesSortedByFreeVolume, GetMostLoadedWarehouses, GetRefrigeratedWarehouses,
        CalculateWarehouseUsedVolume, FindWarehouseByProduct, FindWarehouseByRequiredVolume,
        FindColdStorageWarehouse, FindColdWarehouseWithCapacity, FindEmptyWarehouses,
        FindExpiringProductsInWarehouses, FindFragileProductsInWarehouses,
        // Orders
        GetOrder, GetOrderData, GetOrdersByFinalDestination, GetOrdersByReceiver, GetOrdersBySender,
        CreateOrder, DeleteOrder, UpdateOrder, GetAllOrders, GetOrdersByStatus, GetCancelledOrders,
        GetDeliveredOrders, GetPendingOrders, GetShippedOrders, GetSupplierDeliveredOrders, GetSupplierOrders,
        GetOrderFreightCost, GetOrderItems, GetOrderRoute, GetOrderRoutesByTruck, GetOrderRoutesByWarehouse,
        GetOrderSupplierRoute, FindOrderByProduct, GetAllOrdersFreightCosts, GetAllOrdersItems,
        // Products
        GetProduct, GetProductData, CreateProduct, DeleteProduct, UpdateProduct, GetAllProducts,
        GetProductById, GetProductByName, GetColdProducts, GetExpirableProducts, GetFragileProducts,
        GetProductOrders, GetProductStockInWarehouses, FindProductByPriceRange, FindProductByVolume,
        FindProductByWeight, GetAllProductsOrders, GetAllProductsStock,
        // Suppliers
        GetAllSuppliers, GetSupplier, GetSuppliersByLocation, GetSupplierData, CountSuppliersByLocation,
        CreateSupplier, DeleteSupplier, UpdateSupplier,
        // Freight Costs
        GetAllFreightCosts, GetFreightCost, GetFreightCostData, CountFreightCosts, CreateFreightCost,
        DeleteFreightCost, UpdateFreightCost,
        // Online Users
        GetAllOnlineUsers, GetOnlineUser, GetOnlineUsersByRole, GetOnlineUserData, CountOnlineUsersByRole,
        CreateOnlineUser, DeleteOnlineUser, UpdateOnlineUser,
        // Orders Items
        CountOrderItemsByOrder, CountOrderItemsByProduct, CreateOrderItem, DeleteOrderItem, GetAllOrderItems,
        GetOrderItemsByOrder, GetOrderItemsByProduct, GetOrderProductQuantity, UpdateOrderItemQuantity,
        // Supplies Routes
        CountSuppliesRouteByOrder, CountSuppliesRouteBySupplier, CreateSuppliesRoute, DeleteSuppliesRoute,
        GetAllSuppliesRoute, GetSuppliesRoute, GetSuppliesRouteByOrder, GetSuppliesRouteBySupplier,
        UpdateSuppliesRoute,
        // Orders Route
        CreateOrderRoute, DeleteOrderRoute, GetAllOrdersRoute, GetArrivedOrdersRoute,
        GetPendingArrivalOrdersRoute, GetOrdersRouteByDestination, GetOrdersRouteByOrder,
        GetOrdersRouteByStep, GetOrdersRouteByTruck, GetOrdersRouteByWarehouse, UpdateOrderRoute,
        // Truck Cargo
        CountTruckCargoByProduct, CountTruckCargoByTruck, CreateTruckCargo, DeleteTruckCargoProduct,
        GetAllTrucksCargo, GetTruckCargo, GetTruckCargoByProduct, GetTruckCargoByTruck,
        UpdateTruckCargoQuantity,
        // Warehouses Stocks
        CountStockByProduct, CountStockByWarehouse, CreateWarehouseStock, DeleteWarehouseStock,
        GetAllWarehouseStock, GetStockByProduct, GetStockByWarehouse,
        // Warehouse Stock (misc)
        GetWarehouseProductQuantity, UpdateWarehouseStockQuantity
    >;

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

    static auto createUser(const std::string &id, const std::string &name, const std::string &email,
                           const std::string &password, const std::string &address, const std::string &role)
        -> CreateUser {
        return CreateUser(id, name, email, password, address, role);
    };

    static auto deleteUser(const std::string &id) -> DeleteUser { return DeleteUser(id); };

    static auto updateUserPassword(const std::string &id, const std::string &password) -> UpdateUserPassword {
        return UpdateUserPassword(id, password);
    };

    static auto updateUsersData(const std::string &id, const std::string &name, const std::string &address,
                                const std::string &role) -> UpdateUsersData {
        return UpdateUsersData(id, name, address, role);
    };

    static auto getUserForAuth(const std::string &email) -> GetUserForAuth { return GetUserForAuth(email); }

    /** First matching user row for login, or empty if none. */
    static auto fetchUserForAuth(const std::string &email) -> std::optional<Json::Value>;

    /** Run INSERT/UPDATE/DELETE (no row callback). */
    static auto runSqlNoResult(const std::string &sql) -> bool;

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

    static auto createTruck(const std::string &id, const std::string &model, const std::string &speed,
                            const std::string &is_valid, const std::string &is_delivering, const std::string &size,
                            const std::string &volume_current, const std::string &volume_max,
                            const std::string &weight_current, const std::string &weight_max,
                            const std::string &has_refrigeration, const std::string &current_warehouse_id,
                            const std::string &origin_warehouse_id, const std::string &destination_warehouse_id,
                            const std::string &estimated_time, const std::string &fuel_capacity,
                            const std::string &fuel_current, const std::string &fuel_consumption,
                            const std::string &truck_maintenance) -> CreateTruck {
        return CreateTruck(id, model, speed, is_valid, is_delivering, size, volume_current, volume_max, weight_current,
                           weight_max, has_refrigeration, current_warehouse_id, origin_warehouse_id,
                           destination_warehouse_id, estimated_time, fuel_capacity, fuel_current, fuel_consumption,
                           truck_maintenance);
    };

    static auto deleteTruck(const std::string &id) -> DeleteTruck {
        return DeleteTruck(id);
    };

    static auto updateTruck(const std::string &id, const std::string &model, const std::string &speed,
                            const std::string &is_valid, const std::string &is_delivering, const std::string &size,
                            const std::string &volume_current, const std::string &volume_max,
                            const std::string &weight_current, const std::string &weight_max,
                            const std::string &has_refrigeration, const std::string &current_warehouse_id,
                            const std::string &origin_warehouse_id, const std::string &destination_warehouse_id,
                            const std::string &estimated_time, const std::string &fuel_capacity,
                            const std::string &fuel_current, const std::string &fuel_consumption,
                            const std::string &truck_maintenance) -> UpdateTruck {
        return UpdateTruck(id, model, speed, is_valid, is_delivering, size, volume_current, volume_max, weight_current,
                           weight_max, has_refrigeration, current_warehouse_id, origin_warehouse_id,
                           destination_warehouse_id, estimated_time, fuel_capacity, fuel_current, fuel_consumption,
                           truck_maintenance);
    };

    static auto getTrucksAtWarehouse(const std::string &warehouse_id) -> GetTrucksAtWarehouse {
        return GetTrucksAtWarehouse(warehouse_id);
    };

    static auto getTrucksByDestination(const std::string &warehouse_id) -> GetTrucksByDestination {
        return GetTrucksByDestination(warehouse_id);
    };

    static auto getTrucksByOrigin(const std::string &warehouse_id) -> GetTrucksByOrigin {
        return GetTrucksByOrigin(warehouse_id);
    };

    static auto getCurrentlyDeliveringTrucks() -> GetCurrentlyDeliveringTrucks {
        return GetCurrentlyDeliveringTrucks{};
    };

    static auto getNotCurrentlyDeliveringTrucks() -> GetNotCurrentlyDeliveringTrucks {
        return GetNotCurrentlyDeliveringTrucks{};
    };

    static auto getValidTrucks() -> GetValidTrucks {
        return GetValidTrucks{};
    };

    static auto getInvalidTrucks() -> GetInvalidTrucks {
        return GetInvalidTrucks{};
    };

    static auto getRefrigeratedTrucks() -> GetRefrigeratedTrucks {
        return GetRefrigeratedTrucks{};
    };

    static auto getNotRefrigeratedTrucks() -> GetNotRefrigeratedTrucks {
        return GetNotRefrigeratedTrucks{};
    };

    static auto getRefrigeratedDeliveringTrucks() -> GetRefrigeratedDeliveringTrucks {
        return GetRefrigeratedDeliveringTrucks{};
    };

    static auto getRefrigeratedNotDeliveringTrucks() -> GetRefrigeratedNotDeliveringTrucks {
        return GetRefrigeratedNotDeliveringTrucks{};
    };

    static auto getTruckDetailedCargo(const std::string &truck_id) -> GetTruckDetailedCargo {
        return GetTruckDetailedCargo(truck_id);
    };

    static auto getAllTrucksWithCargo() -> GetAllTrucksWithCargo {
        return GetAllTrucksWithCargo{};
    };

    static auto findTruckByProduct(const std::string &product_id) -> FindTruckByProduct {
        return FindTruckByProduct(product_id);
    };

    static auto findTruckByVolumeCapacity(const std::string &volume) -> FindTruckByVolumeCapacity {
        return FindTruckByVolumeCapacity(volume);
    };

    static auto findTruckByWeightCapacity(const std::string &weight) -> FindTruckByWeightCapacity {
        return FindTruckByWeightCapacity(weight);
    };

    static auto findRefrigeratedTruckByVolumeCapacity(const std::string &volume) -> FindRefrigeratedTruckByVolumeCapacity {
        return FindRefrigeratedTruckByVolumeCapacity(volume);
    };

    static auto findRefrigeratedTruckByWeightCapacity(const std::string &weight) -> FindRefrigeratedTruckByWeightCapacity {
        return FindRefrigeratedTruckByWeightCapacity(weight);
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

    static auto createWarehouse(const std::string &id, const std::string &location, const std::string &size,
                                 const std::string &volume_current, const std::string &volume_max,
                                 const std::string &has_refrigeration, const std::string &fuel_price)
        -> CreateWarehouse {
        return CreateWarehouse(id, location, size, volume_current, volume_max, has_refrigeration, fuel_price);
    };

    static auto deleteWarehouse(const std::string &id) -> DeleteWarehouse {
        return DeleteWarehouse(id);
    };

    static auto updateWarehouse(const std::string &id, const std::string &location, const std::string &size,
                                 const std::string &volume_current, const std::string &volume_max,
                                 const std::string &has_refrigeration, const std::string &fuel_price)
        -> UpdateWarehouse {
        return UpdateWarehouse(id, location, size, volume_current, volume_max, has_refrigeration, fuel_price);
    };

    static auto getAllWarehouses() -> GetAllWarehouses {
        return GetAllWarehouses{};
    };

    static auto getWarehouseProducts(const std::string &warehouse_id) -> GetWarehouseProducts {
        return GetWarehouseProducts(warehouse_id);
    };

    static auto getWarehouseTotalItems(const std::string &warehouse_id) -> GetWarehouseTotalItems {
        return GetWarehouseTotalItems(warehouse_id);
    };

    static auto getWarehouseAvailableCapacity() -> GetWarehouseAvailableCapacity {
        return GetWarehouseAvailableCapacity{};
    };

    static auto getWarehousesSortedByFreeVolume() -> GetWarehousesSortedByFreeVolume {
        return GetWarehousesSortedByFreeVolume{};
    };

    static auto getMostLoadedWarehouses() -> GetMostLoadedWarehouses {
        return GetMostLoadedWarehouses{};
    };

    static auto getRefrigeratedWarehouses() -> GetRefrigeratedWarehouses {
        return GetRefrigeratedWarehouses{};
    };

    static auto calculateWarehouseUsedVolume() -> CalculateWarehouseUsedVolume {
        return CalculateWarehouseUsedVolume{};
    };

    static auto findWarehouseByProduct(const std::string &product_id) -> FindWarehouseByProduct {
        return FindWarehouseByProduct(product_id);
    };

    static auto findWarehouseByRequiredVolume(const std::string &volume) -> FindWarehouseByRequiredVolume {
        return FindWarehouseByRequiredVolume(volume);
    };

    static auto findColdStorageWarehouse() -> FindColdStorageWarehouse {
        return FindColdStorageWarehouse{};
    };

    static auto findColdWarehouseWithCapacity(const std::string &volume) -> FindColdWarehouseWithCapacity {
        return FindColdWarehouseWithCapacity(volume);
    };

    static auto findEmptyWarehouses() -> FindEmptyWarehouses {
        return FindEmptyWarehouses{};
    };

    static auto findExpiringProductsInWarehouses() -> FindExpiringProductsInWarehouses {
        return FindExpiringProductsInWarehouses{};
    };

    static auto findFragileProductsInWarehouses() -> FindFragileProductsInWarehouses {
        return FindFragileProductsInWarehouses{};
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

    static auto createOrder(const std::string &id, const std::string &client_id, const std::string &final_destination,
                            const std::string &time_limit, const std::string &price, const std::string &status,
                            const std::string &supplier_id, const std::string &supplier_delivery) -> CreateOrder {
        return CreateOrder(id, client_id, final_destination, time_limit, price, status, supplier_id, supplier_delivery);
    };

    static auto deleteOrder(const std::string &id) -> DeleteOrder {
        return DeleteOrder(id);
    };

    static auto updateOrder(const std::string &id, const std::string &client_id, const std::string &final_destination,
                            const std::string &time_limit, const std::string &price, const std::string &status,
                            const std::string &supplier_id, const std::string &supplier_delivery) -> UpdateOrder {
        return UpdateOrder(id, client_id, final_destination, time_limit, price, status, supplier_id, supplier_delivery);
    };

    static auto getAllOrders() -> GetAllOrders {
        return GetAllOrders{};
    };

    static auto getOrdersByStatus(const std::string &status) -> GetOrdersByStatus {
        return GetOrdersByStatus(status);
    };

    static auto getCancelledOrders() -> GetCancelledOrders {
        return GetCancelledOrders{};
    };

    static auto getDeliveredOrders() -> GetDeliveredOrders {
        return GetDeliveredOrders{};
    };

    static auto getPendingOrders() -> GetPendingOrders {
        return GetPendingOrders{};
    };

    static auto getShippedOrders() -> GetShippedOrders {
        return GetShippedOrders{};
    };

    static auto getSupplierDeliveredOrders() -> GetSupplierDeliveredOrders {
        return GetSupplierDeliveredOrders{};
    };

    static auto getSupplierOrders(const std::string &supplier_id) -> GetSupplierOrders {
        return GetSupplierOrders(supplier_id);
    };

    static auto getOrderFreightCost(const std::string &order_id) -> GetOrderFreightCost {
        return GetOrderFreightCost(order_id);
    };

    static auto getOrderItems(const std::string &order_id) -> GetOrderItems {
        return GetOrderItems(order_id);
    };

    static auto getOrderRoute(const std::string &order_id) -> GetOrderRoute {
        return GetOrderRoute(order_id);
    };

    static auto getOrderRoutesByTruck(const std::string &truck_id) -> GetOrderRoutesByTruck {
        return GetOrderRoutesByTruck(truck_id);
    };

    static auto getOrderRoutesByWarehouse(const std::string &warehouse_id) -> GetOrderRoutesByWarehouse {
        return GetOrderRoutesByWarehouse(warehouse_id);
    };

    static auto getOrderSupplierRoute(const std::string &order_id) -> GetOrderSupplierRoute {
        return GetOrderSupplierRoute(order_id);
    };

    static auto findOrderByProduct(const std::string &product_id) -> FindOrderByProduct {
        return FindOrderByProduct(product_id);
    };

    static auto getAllOrdersFreightCosts() -> GetAllOrdersFreightCosts {
        return GetAllOrdersFreightCosts{};
    };

    static auto getAllOrdersItems() -> GetAllOrdersItems {
        return GetAllOrdersItems{};
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

    static auto createProduct(const std::string &id, const std::string &name, const std::string &price,
                               const std::string &is_cold, const std::string &is_fragile,
                               const std::string &expire_date, const std::string &size, const std::string &volume,
                               const std::string &weight) -> CreateProduct {
        return CreateProduct(id, name, price, is_cold, is_fragile, expire_date, size, volume, weight);
    };

    static auto deleteProduct(const std::string &id) -> DeleteProduct {
        return DeleteProduct(id);
    };

    static auto updateProduct(const std::string &id, const std::string &name, const std::string &price,
                               const std::string &is_cold, const std::string &is_fragile,
                               const std::string &expire_date, const std::string &size, const std::string &volume,
                               const std::string &weight) -> UpdateProduct {
        return UpdateProduct(id, name, price, is_cold, is_fragile, expire_date, size, volume, weight);
    };

    static auto getAllProducts() -> GetAllProducts {
        return GetAllProducts{};
    };

    static auto getProductById(const std::string &id) -> GetProductById {
        return GetProductById(id);
    };

    static auto getProductByName(const std::string &name) -> GetProductByName {
        return GetProductByName(name);
    };

    static auto getColdProducts() -> GetColdProducts {
        return GetColdProducts{};
    };

    static auto getExpirableProducts() -> GetExpirableProducts {
        return GetExpirableProducts{};
    };

    static auto getFragileProducts() -> GetFragileProducts {
        return GetFragileProducts{};
    };

    static auto getProductOrders(const std::string &product_id) -> GetProductOrders {
        return GetProductOrders(product_id);
    };

    static auto getProductStockInWarehouses(const std::string &product_id) -> GetProductStockInWarehouses {
        return GetProductStockInWarehouses(product_id);
    };

    static auto findProductByPriceRange(const std::string &min_price, const std::string &max_price)
        -> FindProductByPriceRange {
        return FindProductByPriceRange(min_price, max_price);
    };

    static auto findProductByVolume(const std::string &volume) -> FindProductByVolume {
        return FindProductByVolume(volume);
    };

    static auto findProductByWeight(const std::string &weight) -> FindProductByWeight {
        return FindProductByWeight(weight);
    };

    static auto getAllProductsOrders() -> GetAllProductsOrders {
        return GetAllProductsOrders{};
    };

    static auto getAllProductsStock() -> GetAllProductsStock {
        return GetAllProductsStock{};
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

    static auto createOnlineUser(const std::string &session_id, const std::string &user_id,
                                 const std::string &login_time, const std::string &last_activity) -> CreateOnlineUser {
        return CreateOnlineUser(session_id, user_id, login_time, last_activity);
    };

    static auto deleteOnlineUser(const std::string &session_id) -> DeleteOnlineUser {
        return DeleteOnlineUser(session_id);
    };

    static auto updateOnlineUser(const std::string &session_id, const std::string &last_activity) -> UpdateOnlineUser {
        return UpdateOnlineUser(session_id, last_activity);
    };

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

    static auto deleteSuppliesRoute(const std::string &order_id,
                                    const std::string &supplier_id) -> DeleteSuppliesRoute {
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

    // ? Orders Route queries
    static auto createOrderRoute(const std::string &order_id, const std::string &step, const std::string &warehouse_id,
                                 const std::string &truck_id, const std::string &destination_warehouse_id,
                                 const std::string &estimated_time, const std::string &arrived_at) -> CreateOrderRoute {
        return CreateOrderRoute(order_id, step, warehouse_id, truck_id, destination_warehouse_id, estimated_time,
                                arrived_at);
    };

    static auto deleteOrderRoute(const std::string &order_id, const std::string &step) -> DeleteOrderRoute {
        return DeleteOrderRoute(order_id, step);
    };

    static auto getAllOrdersRoute() -> GetAllOrdersRoute {
        return GetAllOrdersRoute{};
    };

    static auto getArrivedOrdersRoute() -> GetArrivedOrdersRoute {
        return GetArrivedOrdersRoute{};
    };

    static auto getPendingArrivalOrdersRoute() -> GetPendingArrivalOrdersRoute {
        return GetPendingArrivalOrdersRoute{};
    };

    static auto getOrdersRouteByDestination(const std::string &destination_warehouse_id) -> GetOrdersRouteByDestination {
        return GetOrdersRouteByDestination(destination_warehouse_id);
    };

    static auto getOrdersRouteByOrder(const std::string &order_id) -> GetOrdersRouteByOrder {
        return GetOrdersRouteByOrder(order_id);
    };

    static auto getOrdersRouteByStep(const std::string &order_id, const std::string &step) -> GetOrdersRouteByStep {
        return GetOrdersRouteByStep(order_id, step);
    };

    static auto getOrdersRouteByTruck(const std::string &truck_id) -> GetOrdersRouteByTruck {
        return GetOrdersRouteByTruck(truck_id);
    };

    static auto getOrdersRouteByWarehouse(const std::string &warehouse_id) -> GetOrdersRouteByWarehouse {
        return GetOrdersRouteByWarehouse(warehouse_id);
    };

    static auto updateOrderRoute(const std::string &order_id, const std::string &step, const std::string &warehouse_id,
                                 const std::string &truck_id, const std::string &destination_warehouse_id,
                                 const std::string &estimated_time, const std::string &arrived_at) -> UpdateOrderRoute {
        return UpdateOrderRoute(order_id, step, warehouse_id, truck_id, destination_warehouse_id, estimated_time,
                                arrived_at);
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
