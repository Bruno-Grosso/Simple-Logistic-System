//
// Created by be on 3/22/26.
//

#include "QueryProcessor.h"

#include <fstream>
#include <sstream>
#include <stdexcept>

#include "App.h"

auto QueryProcessor::read_query(std::string_view path) -> std::string {
    std::ifstream file(path.data());

    if (!file.is_open()) {
        // The path may be different depending on the compilation type
        file = std::ifstream("../" + std::string(path.data()));
        if (!file.is_open()) {
            throw std::runtime_error("Failed to open query file: " + std::string(path));
        }
    }


    std::stringstream buffer;
    buffer << file.rdbuf();

    return buffer.str();
}

auto QueryProcessor::getQuery(const Query &query) -> std::string {
    return std::visit([this]<typename T0>(const T0 &q) -> std::string {
        using T = std::decay_t<T0>;

            // Yes this is massive, but what can you do when you have a massive database?
            // TODO: reevaluate design pattern here
            // ? User
            // -------------------------------------------------------------------------------------------------------------
            if constexpr (std::is_same_v<T, GetAllUsers>) {
                return read_query(base_location + "/users/get_all_users.sql");
            } else if constexpr (std::is_same_v<T, GetUser>) {
                std::string base_query = read_query(base_location + "/users/get_user.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetUsersByRole>) {
                std::string base_query = read_query(base_location + "/users/get_users_by_role.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.role + "'");
            } else if constexpr (std::is_same_v<T, GetUserData>) {
                std::string base_query = read_query(base_location + "/users/get_user_data.sql");
                base_query.replace(base_query.find('?'), 1, q.field);

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, CountUsersByRole>) {
                return read_query(base_location + "/users/count_users_by_role.sql");
            } else if constexpr (std::is_same_v<T, CreateUser>) {
                std::string base_query = read_query(base_location + "/users/create_user.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.name + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.password + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.address + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.role + "'");
            } else if constexpr (std::is_same_v<T, DeleteUser>) {
                std::string base_query = read_query(base_location + "/users/delete_user.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, UpdateUserPassword>) {
                std::string base_query = read_query(base_location + "/users/update_user_password.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.password + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, UpdateUsersData>) {
                std::string base_query = read_query(base_location + "/users/update_users_data.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.name + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.address + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.role + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Trucks
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, GetAllTrucks>) {
                return read_query(base_location + "/trucks/get_all_trucks.sql");
            } else if constexpr (std::is_same_v<T, GetTruck>) {
                std::string base_query = read_query(base_location + "/trucks/get_truck.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetTrucksBySize>) {
                std::string base_query = read_query(base_location + "/trucks/get_trucks_by_size.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.size + "'");
            } else if constexpr (std::is_same_v<T, GetTrucksByModel>) {
                std::string base_query = read_query(base_location + "/trucks/get_trucks_by_model.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.model + "'");
            } else if constexpr (std::is_same_v<T, GetTruckData>) {
                std::string base_query = read_query(base_location + "/trucks/get_truck_data.sql");
                base_query.replace(base_query.find('?'), 1, q.field);

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, CreateTruck>) {
                std::string base_query = read_query(base_location + "/trucks/truck_create.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.model + "'");
                base_query.replace(base_query.find('?'), 1, q.speed);
                base_query.replace(base_query.find('?'), 1, q.is_valid);
                base_query.replace(base_query.find('?'), 1, q.is_delivering);
                base_query.replace(base_query.find('?'), 1, "'" + q.size + "'");
                base_query.replace(base_query.find('?'), 1, q.volume_current);
                base_query.replace(base_query.find('?'), 1, q.volume_max);
                base_query.replace(base_query.find('?'), 1, q.weight_current);
                base_query.replace(base_query.find('?'), 1, q.weight_max);
                base_query.replace(base_query.find('?'), 1, q.has_refrigeration);
                base_query.replace(base_query.find('?'), 1, "'" + q.current_warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.origin_warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.destination_warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.estimated_time + "'");
                base_query.replace(base_query.find('?'), 1, q.fuel_capacity);
                base_query.replace(base_query.find('?'), 1, q.fuel_current);
                base_query.replace(base_query.find('?'), 1, q.fuel_consumption);
                return base_query.replace(base_query.find('?'), 1, q.truck_maintenance);
            } else if constexpr (std::is_same_v<T, DeleteTruck>) {
                std::string base_query = read_query(base_location + "/trucks/truck_delete.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, UpdateTruck>) {
                std::string base_query = read_query(base_location + "/trucks/truck_update.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.model + "'");
                base_query.replace(base_query.find('?'), 1, q.speed);
                base_query.replace(base_query.find('?'), 1, q.is_valid);
                base_query.replace(base_query.find('?'), 1, q.is_delivering);
                base_query.replace(base_query.find('?'), 1, "'" + q.size + "'");
                base_query.replace(base_query.find('?'), 1, q.volume_current);
                base_query.replace(base_query.find('?'), 1, q.volume_max);
                base_query.replace(base_query.find('?'), 1, q.weight_current);
                base_query.replace(base_query.find('?'), 1, q.weight_max);
                base_query.replace(base_query.find('?'), 1, q.has_refrigeration);
                base_query.replace(base_query.find('?'), 1, "'" + q.current_warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.origin_warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.destination_warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.estimated_time + "'");
                base_query.replace(base_query.find('?'), 1, q.fuel_capacity);
                base_query.replace(base_query.find('?'), 1, q.fuel_current);
                base_query.replace(base_query.find('?'), 1, q.fuel_consumption);
                base_query.replace(base_query.find('?'), 1, q.truck_maintenance);
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetTrucksAtWarehouse>) {
                std::string base_query = read_query(base_location + "/trucks/truck_get_at_warehouse.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
            } else if constexpr (std::is_same_v<T, GetTrucksByDestination>) {
                std::string base_query = read_query(base_location + "/trucks/truck_get_destination.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
            } else if constexpr (std::is_same_v<T, GetTrucksByOrigin>) {
                std::string base_query = read_query(base_location + "/trucks/truck_get_origin.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
            } else if constexpr (std::is_same_v<T, GetCurrentlyDeliveringTrucks>) {
                return read_query(base_location + "/trucks/truck_get_currently_delivering.sql");
            } else if constexpr (std::is_same_v<T, GetNotCurrentlyDeliveringTrucks>) {
                return read_query(base_location + "/trucks/truck_get_not_currently_delivering.sql");
            } else if constexpr (std::is_same_v<T, GetValidTrucks>) {
                return read_query(base_location + "/trucks/truck_get_valid_trucks.sql");
            } else if constexpr (std::is_same_v<T, GetInvalidTrucks>) {
                return read_query(base_location + "/trucks/truck_get_no_valid_trucks.sql");
            } else if constexpr (std::is_same_v<T, GetRefrigeratedTrucks>) {
                return read_query(base_location + "/trucks/truck_get_refrigerated.sql");
            } else if constexpr (std::is_same_v<T, GetNotRefrigeratedTrucks>) {
                return read_query(base_location + "/trucks/truck_get_not_refrigerated.sql");
            } else if constexpr (std::is_same_v<T, GetRefrigeratedDeliveringTrucks>) {
                return read_query(base_location + "/trucks/truck_get_refrigerated_delivering.sql");
            } else if constexpr (std::is_same_v<T, GetRefrigeratedNotDeliveringTrucks>) {
                return read_query(base_location + "/trucks/truck_get_refrigerated_not_deliveiring.sql");
            } else if constexpr (std::is_same_v<T, GetTruckDetailedCargo>) {
                std::string base_query = read_query(base_location + "/trucks/truck_get_cargo.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
            } else if constexpr (std::is_same_v<T, GetAllTrucksWithCargo>) {
                return read_query(base_location + "/trucks/truck_get_all_cargo.sql");
            } else if constexpr (std::is_same_v<T, FindTruckByProduct>) {
                std::string base_query = read_query(base_location + "/trucks/truck_find_by_product.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, FindTruckByVolumeCapacity>) {
                std::string base_query = read_query(base_location + "/trucks/truck_find_by_volume_capacity.sql");
                return base_query.replace(base_query.find('?'), 1, q.volume);
            } else if constexpr (std::is_same_v<T, FindTruckByWeightCapacity>) {
                std::string base_query = read_query(base_location + "/trucks/truck_find_by_weight_capacity.sql");
                return base_query.replace(base_query.find('?'), 1, q.weight);
            } else if constexpr (std::is_same_v<T, FindRefrigeratedTruckByVolumeCapacity>) {
                std::string base_query = read_query(base_location + "/trucks/truck_find_refrigerated_by_volume_capacity.sql");
                return base_query.replace(base_query.find('?'), 1, q.volume);
            } else if constexpr (std::is_same_v<T, FindRefrigeratedTruckByWeightCapacity>) {
                std::string base_query = read_query(base_location + "/trucks/truck_find_refrigerated_by_weight_capacity.sql");
                return base_query.replace(base_query.find('?'), 1, q.weight);
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Warehouse
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, GetWarehouse>) {
                std::string base_query = read_query(base_location + "/warehouses/get_warehouse.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetWarehouseData>) {
                std::string base_query = read_query(base_location + "/warehouses/get_warehouse_data.sql");
                base_query.replace(base_query.find('?'), 1, q.field);

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, CreateWarehouse>) {
                std::string base_query = read_query(base_location + "/warehouses/warehouse_create.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.location + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.size + "'");
                base_query.replace(base_query.find('?'), 1, q.volume_current);
                base_query.replace(base_query.find('?'), 1, q.volume_max);
                base_query.replace(base_query.find('?'), 1, q.has_refrigeration);
                return base_query.replace(base_query.find('?'), 1, q.fuel_price);
            } else if constexpr (std::is_same_v<T, DeleteWarehouse>) {
                std::string base_query = read_query(base_location + "/warehouses/warehouse_delete.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, UpdateWarehouse>) {
                std::string base_query = read_query(base_location + "/warehouses/warehouse_update.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.location + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.size + "'");
                base_query.replace(base_query.find('?'), 1, q.volume_current);
                base_query.replace(base_query.find('?'), 1, q.volume_max);
                base_query.replace(base_query.find('?'), 1, q.has_refrigeration);
                base_query.replace(base_query.find('?'), 1, q.fuel_price);
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetAllWarehouses>) {
                return read_query(base_location + "/warehouses/warehouse_get_all.sql");
            } else if constexpr (std::is_same_v<T, GetWarehouseProducts>) {
                std::string base_query = read_query(base_location + "/warehouses/warehouse_get_products.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
            } else if constexpr (std::is_same_v<T, GetWarehouseTotalItems>) {
                return read_query(base_location + "/warehouses/warehouse_get_total_items.sql");
            } else if constexpr (std::is_same_v<T, GetWarehouseAvailableCapacity>) {
                return read_query(base_location + "/warehouses/warehouse_get_available_capacity.sql");
            } else if constexpr (std::is_same_v<T, GetWarehousesSortedByFreeVolume>) {
                return read_query(base_location + "/warehouses/warehouse_get_sorted_by_free_volume.sql");
            } else if constexpr (std::is_same_v<T, GetMostLoadedWarehouses>) {
                return read_query(base_location + "/warehouses/warehouse_get_most_loaded.sql");
            } else if constexpr (std::is_same_v<T, GetRefrigeratedWarehouses>) {
                return read_query(base_location + "/warehouses/warehouse_get_refrigerated.sql");
            } else if constexpr (std::is_same_v<T, CalculateWarehouseUsedVolume>) {
                return read_query(base_location + "/warehouses/warehouse_calculate_used_volume.sql");
            } else if constexpr (std::is_same_v<T, FindWarehouseByProduct>) {
                std::string base_query = read_query(base_location + "/warehouses/warehouse_find_by_product.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, FindWarehouseByRequiredVolume>) {
                std::string base_query = read_query(base_location + "/warehouses/warehouse_find_by_required_volume.sql");
                return base_query.replace(base_query.find('?'), 1, q.volume);
            } else if constexpr (std::is_same_v<T, FindColdStorageWarehouse>) {
                return read_query(base_location + "/warehouses/warehouse_find_cold_storage.sql");
            } else if constexpr (std::is_same_v<T, FindColdWarehouseWithCapacity>) {
                std::string base_query = read_query(base_location + "/warehouses/warehouse_find_cold_with_capacity.sql");
                return base_query.replace(base_query.find('?'), 1, q.volume);
            } else if constexpr (std::is_same_v<T, FindEmptyWarehouses>) {
                return read_query(base_location + "/warehouses/warehouse_find_empty.sql");
            } else if constexpr (std::is_same_v<T, FindExpiringProductsInWarehouses>) {
                return read_query(base_location + "/warehouses/warehouse_find_expiring_products.sql");
            } else if constexpr (std::is_same_v<T, FindFragileProductsInWarehouses>) {
                return read_query(base_location + "/warehouses/warehouse_find_fragile_products.sql");
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Order
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, GetOrder>) {
                std::string base_query = read_query(base_location + "/orders/get_order.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetOrderData>) {
                std::string base_query = read_query(base_location + "/orders/get_order_data.sql");
                base_query.replace(base_query.find('?'), 1, q.field);

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetOrdersByFinalDestination>) {
                std::string base_query = read_query(base_location + "/orders/get_orders_by_final_destination.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.final_destination + "'");
            } else if constexpr (std::is_same_v<T, GetOrdersByReceiver>) {
                std::string base_query = read_query(base_location + "/orders/get_orders_by_receiver.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.receiver_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrdersBySender>) {
                std::string base_query = read_query(base_location + "/orders/get_orders_by_sender.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.sender_id + "'");
            } else if constexpr (std::is_same_v<T, CreateOrder>) {
                std::string base_query = read_query(base_location + "/orders/order_create.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.client_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.final_destination + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.time_limit + "'");
                base_query.replace(base_query.find('?'), 1, q.price);
                base_query.replace(base_query.find('?'), 1, "'" + q.status + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.supplier_id + "'");
                return base_query.replace(base_query.find('?'), 1, q.supplier_delivery);
            } else if constexpr (std::is_same_v<T, DeleteOrder>) {
                std::string base_query = read_query(base_location + "/orders/order_delete.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, UpdateOrder>) {
                std::string base_query = read_query(base_location + "/orders/order_update.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.client_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.final_destination + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.time_limit + "'");
                base_query.replace(base_query.find('?'), 1, q.price);
                base_query.replace(base_query.find('?'), 1, "'" + q.status + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.supplier_id + "'");
                base_query.replace(base_query.find('?'), 1, q.supplier_delivery);
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetAllOrders>) {
                return read_query(base_location + "/orders/order_get_all.sql");
            } else if constexpr (std::is_same_v<T, GetOrdersByStatus>) {
                std::string base_query = read_query(base_location + "/orders/rder_get_by_status.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.status + "'");
            } else if constexpr (std::is_same_v<T, GetCancelledOrders>) {
                return read_query(base_location + "/orders/order_get_cancelled.sql");
            } else if constexpr (std::is_same_v<T, GetDeliveredOrders>) {
                return read_query(base_location + "/orders/order_get_delivered.sql");
            } else if constexpr (std::is_same_v<T, GetPendingOrders>) {
                return read_query(base_location + "/orders/order_get_pending.sql");
            } else if constexpr (std::is_same_v<T, GetShippedOrders>) {
                return read_query(base_location + "/orders/order_get_shipped.sql");
            } else if constexpr (std::is_same_v<T, GetSupplierDeliveredOrders>) {
                return read_query(base_location + "/orders/order_get_supplier_delivered.sql");
            } else if constexpr (std::is_same_v<T, GetSupplierOrders>) {
                std::string base_query = read_query(base_location + "/orders/order_get_supplier_orders.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.supplier_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrderFreightCost>) {
                std::string base_query = read_query(base_location + "/orders/order_get_freight_cost.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrderItems>) {
                std::string base_query = read_query(base_location + "/orders/order_get_items.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrderRoute>) {
                std::string base_query = read_query(base_location + "/orders/order_get_route.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrderRoutesByTruck>) {
                std::string base_query = read_query(base_location + "/orders/order_get_routes_by_truck.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrderRoutesByWarehouse>) {
                std::string base_query = read_query(base_location + "/orders/order_get_routes_by_warehouse.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrderSupplierRoute>) {
                std::string base_query = read_query(base_location + "/orders/order_get_supplier_route.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            } else if constexpr (std::is_same_v<T, FindOrderByProduct>) {
                std::string base_query = read_query(base_location + "/orders/order_find_by_product.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, GetAllOrdersFreightCosts>) {
                return read_query(base_location + "/orders/order_get_all_freight_costs.sql");
            } else if constexpr (std::is_same_v<T, GetAllOrdersItems>) {
                return read_query(base_location + "/orders/order_get_all_items.sql");
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Product
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, GetProduct>) {
                std::string base_query = read_query(base_location + "/products/get_product.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetProductData>) {
                std::string base_query = read_query(base_location + "/products/get_product_data.sql");
                base_query.replace(base_query.find('?'), 1, q.field);

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, CreateProduct>) {
                std::string base_query = read_query(base_location + "/products/product_create.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.name + "'");
                base_query.replace(base_query.find('?'), 1, q.price);
                base_query.replace(base_query.find('?'), 1, q.is_cold);
                base_query.replace(base_query.find('?'), 1, q.is_fragile);
                base_query.replace(base_query.find('?'), 1, "'" + q.expire_date + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.size + "'");
                base_query.replace(base_query.find('?'), 1, q.volume);
                return base_query.replace(base_query.find('?'), 1, q.weight);
            } else if constexpr (std::is_same_v<T, DeleteProduct>) {
                std::string base_query = read_query(base_location + "/products/product_delete.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, UpdateProduct>) {
                std::string base_query = read_query(base_location + "/products/product_update.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.name + "'");
                base_query.replace(base_query.find('?'), 1, q.price);
                base_query.replace(base_query.find('?'), 1, q.is_cold);
                base_query.replace(base_query.find('?'), 1, q.is_fragile);
                base_query.replace(base_query.find('?'), 1, "'" + q.expire_date + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.size + "'");
                base_query.replace(base_query.find('?'), 1, q.volume);
                base_query.replace(base_query.find('?'), 1, q.weight);
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetAllProducts>) {
                return read_query(base_location + "/products/product_get_all.sql");
            } else if constexpr (std::is_same_v<T, GetProductById>) {
                std::string base_query = read_query(base_location + "/products/product_get_by_id.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetProductByName>) {
                std::string base_query = read_query(base_location + "/products/product_get_by_name.sql");
                return base_query.replace(base_query.find('?'), 1, "'%" + q.name + "%'");
            } else if constexpr (std::is_same_v<T, GetColdProducts>) {
                return read_query(base_location + "/products/product_get_cold_items.sql");
            } else if constexpr (std::is_same_v<T, GetExpirableProducts>) {
                return read_query(base_location + "/products/product_get_expirable_items.sql");
            } else if constexpr (std::is_same_v<T, GetFragileProducts>) {
                return read_query(base_location + "/products/product_get_fragile_items.sql");
            } else if constexpr (std::is_same_v<T, GetProductOrders>) {
                std::string base_query = read_query(base_location + "/products/product_get_orders.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, GetProductStockInWarehouses>) {
                std::string base_query = read_query(base_location + "/products/product_get_stock_in_warehouses.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, FindProductByPriceRange>) {
                std::string base_query = read_query(base_location + "/products/product_find_by_price_range.sql");
                base_query.replace(base_query.find('?'), 1, q.min_price);
                return base_query.replace(base_query.find('?'), 1, q.max_price);
            } else if constexpr (std::is_same_v<T, FindProductByVolume>) {
                std::string base_query = read_query(base_location + "/products/product_find_by_volume.sql");
                return base_query.replace(base_query.find('?'), 1, q.volume);
            } else if constexpr (std::is_same_v<T, FindProductByWeight>) {
                std::string base_query = read_query(base_location + "/products/product_find_by_weight.sql");
                return base_query.replace(base_query.find('?'), 1, q.weight);
            } else if constexpr (std::is_same_v<T, GetAllProductsOrders>) {
                return read_query(base_location + "/products/product_get_all_orders.sql");
            } else if constexpr (std::is_same_v<T, GetAllProductsStock>) {
                return read_query(base_location + "/products/product_get_all_stock.sql");
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Supplier
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, GetAllSuppliers>) {
                return read_query(base_location + "/suppliers/get_all_suppliers.sql");
            } else if constexpr (std::is_same_v<T, GetSupplier>) {
                std::string base_query = read_query(base_location + "/suppliers/get_supplier.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, GetSuppliersByLocation>) {
                std::string base_query = read_query(base_location + "/suppliers/get_suppliers_by_location.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.location + "'");
            } else if constexpr (std::is_same_v<T, GetSupplierData>) {
                std::string base_query = read_query(base_location + "/suppliers/get_supplier_data.sql");
                base_query.replace(base_query.find('?'), 1, q.field);

                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, CountSuppliersByLocation>) {
                return read_query(base_location + "/suppliers/count_suppliers_by_location.sql");
            } else if constexpr (std::is_same_v<T, CreateSupplier>) {
                std::string base_query = read_query(base_location + "/suppliers/create_supplier.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.name + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.location + "'");
            } else if constexpr (std::is_same_v<T, DeleteSupplier>) {
                std::string base_query = read_query(base_location + "/suppliers/delete_supplier.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            } else if constexpr (std::is_same_v<T, UpdateSupplier>) {
                std::string base_query = read_query(base_location + "/suppliers/update_supplier.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.name + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.location + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.id + "'");
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Freight Cost
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, GetAllFreightCosts>) {
                return read_query(base_location + "/freight_cost/get_all_freight_costs.sql");
            } else if constexpr (std::is_same_v<T, GetFreightCost>) {
                std::string base_query = read_query(base_location + "/freight_cost/get_freight_cost.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            } else if constexpr (std::is_same_v<T, GetFreightCostData>) {
                std::string base_query = read_query(base_location + "/freight_cost/get_freight_cost_data.sql");
                base_query.replace(base_query.find('?'), 1, q.field);

                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            } else if constexpr (std::is_same_v<T, CountFreightCosts>) {
                return read_query(base_location + "/freight_cost/count_freight_costs.sql");
            } else if constexpr (std::is_same_v<T, CreateFreightCost>) {
                std::string base_query = read_query(base_location + "/freight_cost/create_freight_cost.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                base_query.replace(base_query.find('?'), 1, q.fuel_cost);
                base_query.replace(base_query.find('?'), 1, q.labor_cost);
                base_query.replace(base_query.find('?'), 1, q.maintenance_cost);
                base_query.replace(base_query.find('?'), 1, q.total_cost);
                return base_query.replace(base_query.find('?'), 1, "'" + q.calculated_at + "'");
            } else if constexpr (std::is_same_v<T, DeleteFreightCost>) {
                std::string base_query = read_query(base_location + "/freight_cost/delete_freight_cost.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            } else if constexpr (std::is_same_v<T, UpdateFreightCost>) {
                std::string base_query = read_query(base_location + "/freight_cost/update_freight_cost.sql");
                base_query.replace(base_query.find('?'), 1, q.fuel_cost);
                base_query.replace(base_query.find('?'), 1, q.labor_cost);
                base_query.replace(base_query.find('?'), 1, q.maintenance_cost);
                base_query.replace(base_query.find('?'), 1, q.total_cost);
                base_query.replace(base_query.find('?'), 1, "'" + q.calculated_at + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Online User
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, GetAllOnlineUsers>) {
                return read_query(base_location + "/online_users/get_all_online_users.sql");
            } else if constexpr (std::is_same_v<T, GetOnlineUser>) {
                std::string base_query = read_query(base_location + "/online_users/get_online_user.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.session_id + "'");
            } else if constexpr (std::is_same_v<T, GetOnlineUsersByRole>) {
                std::string base_query = read_query(base_location + "/online_users/get_online_users_by_role.sql");

                return base_query.replace(base_query.find('?'), 1, "'" + q.role + "'");
            } else if constexpr (std::is_same_v<T, GetOnlineUserData>) {
                std::string base_query = read_query(base_location + "/online_users/get_online_user_data.sql");
                base_query.replace(base_query.find('?'), 1, q.field);

                return base_query.replace(base_query.find('?'), 1, "'" + q.session_id + "'");
            } else if constexpr (std::is_same_v<T, CountOnlineUsersByRole>) {
                return read_query(base_location + "/online_users/count_online_users_by_role.sql");
            } else if constexpr (std::is_same_v<T, CreateOnlineUser>) {
                std::string base_query = read_query(base_location + "/online_users/online_user_create.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.session_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.user_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.login_time + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.last_activity + "'");
            } else if constexpr (std::is_same_v<T, DeleteOnlineUser>) {
                std::string base_query = read_query(base_location + "/online_users/online_user_delete.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.session_id + "'");
            } else if constexpr (std::is_same_v<T, UpdateOnlineUser>) {
                std::string base_query = read_query(base_location + "/online_users/online_user_update.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.last_activity + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.session_id + "'");
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Orders Items
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, CountOrderItemsByOrder>) {
                return read_query(base_location + "/orders_items/count_order_items_by_order.sql");
            } else if constexpr (std::is_same_v<T, CountOrderItemsByProduct>) {
                return read_query(base_location + "/orders_items/count_order_items_by_product.sql");
            } else if constexpr (std::is_same_v<T, CreateOrderItem>) {
                std::string base_query = read_query(base_location + "/orders_items/create_order_item.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
                return base_query.replace(base_query.find('?'), 1, q.quantity);
            } else if constexpr (std::is_same_v<T, DeleteOrderItem>) {
                std::string base_query = read_query(base_location + "/orders_items/delete_order_item.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, GetAllOrderItems>) {
                return read_query(base_location + "/orders_items/get_all_order_items.sql");
            } else if constexpr (std::is_same_v<T, GetOrderItemsByOrder>) {
                std::string base_query = read_query(base_location + "/orders_items/get_order_items_by_order.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrderItemsByProduct>) {
                std::string base_query = read_query(base_location + "/orders_items/get_order_items_by_product.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrderProductQuantity>) {
                std::string base_query = read_query(base_location + "/orders_items/get_order_product_quantity.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, UpdateOrderItemQuantity>) {
                std::string base_query = read_query(base_location + "/orders_items/update_order_item_quantity.sql");
                base_query.replace(base_query.find('?'), 1, q.quantity);
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Supplies Routes
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, CountSuppliesRouteByOrder>) {
                return read_query(base_location + "/supplies_routes/count_supplies_route_by_order.sql");
            } else if constexpr (std::is_same_v<T, CountSuppliesRouteBySupplier>) {
                return read_query(base_location + "/supplies_routes/count_supplies_route_by_supplier.sql");
            } else if constexpr (std::is_same_v<T, CreateSuppliesRoute>) {
                std::string base_query = read_query(base_location + "/supplies_routes/create_supplies_route.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.supplier_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.estimated_departure + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.estimated_arrival + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.actual_arrival + "'");
            } else if constexpr (std::is_same_v<T, DeleteSuppliesRoute>) {
                std::string base_query = read_query(base_location + "/supplies_routes/delete_supplies_route.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.supplier_id + "'");
            } else if constexpr (std::is_same_v<T, GetAllSuppliesRoute>) {
                return read_query(base_location + "/supplies_routes/get_all_supplies_route.sql");
            } else if constexpr (std::is_same_v<T, GetSuppliesRoute>) {
                std::string base_query = read_query(base_location + "/supplies_routes/get_supplies_route.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.supplier_id + "'");
            } else if constexpr (std::is_same_v<T, GetSuppliesRouteByOrder>) {
                std::string base_query = read_query(base_location + "/supplies_routes/get_supplies_route_by_order.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            } else if constexpr (std::is_same_v<T, GetSuppliesRouteBySupplier>) {
                std::string base_query = read_query(
                    base_location + "/supplies_routes/get_supplies_route_by_supplier.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.supplier_id + "'");
            } else if constexpr (std::is_same_v<T, UpdateSuppliesRoute>) {
                std::string base_query = read_query(base_location + "/supplies_routes/update_supplies_route.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.estimated_departure + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.estimated_arrival + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.actual_arrival + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.supplier_id + "'");
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Orders Route
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, CreateOrderRoute>) {
                std::string base_query = read_query(base_location + "/orders_route/orders_route_create.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                base_query.replace(base_query.find('?'), 1, q.step);
                base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.destination_warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.estimated_time + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.arrived_at + "'");
            } else if constexpr (std::is_same_v<T, DeleteOrderRoute>) {
                std::string base_query = read_query(base_location + "/orders_route/orders_route_delete.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                return base_query.replace(base_query.find('?'), 1, q.step);
            } else if constexpr (std::is_same_v<T, GetAllOrdersRoute>) {
                return read_query(base_location + "/orders_route/orders_route_get_all.sql");
            } else if constexpr (std::is_same_v<T, GetArrivedOrdersRoute>) {
                return read_query(base_location + "/orders_route/orders_route_get_arrived.sql");
            } else if constexpr (std::is_same_v<T, GetPendingArrivalOrdersRoute>) {
                return read_query(base_location + "/orders_route/rders_route_get_pending_arrival.sql");
            } else if constexpr (std::is_same_v<T, GetOrdersRouteByDestination>) {
                std::string base_query = read_query(base_location + "/orders_route/orders_route_get_by_destination.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.destination_warehouse_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrdersRouteByOrder>) {
                std::string base_query = read_query(base_location + "/orders_route/orders_route_get_by_order.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrdersRouteByStep>) {
                std::string base_query = read_query(base_location + "/orders_route/orders_route_get_by_step.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                return base_query.replace(base_query.find('?'), 1, q.step);
            } else if constexpr (std::is_same_v<T, GetOrdersRouteByTruck>) {
                std::string base_query = read_query(base_location + "/orders_route/orders_route_get_by_truck.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
            } else if constexpr (std::is_same_v<T, GetOrdersRouteByWarehouse>) {
                std::string base_query = read_query(base_location + "/orders_route/orders_route_get_by_warehouse.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
            } else if constexpr (std::is_same_v<T, UpdateOrderRoute>) {
                std::string base_query = read_query(base_location + "/orders_route/orders_route_update.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.destination_warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.estimated_time + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.arrived_at + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.order_id + "'");
                return base_query.replace(base_query.find('?'), 1, q.step);
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Truck Cargo
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, CountTruckCargoByProduct>) {
                return read_query(base_location + "/truck_cargo/count_truck_cargo_by_product.sql");
            } else if constexpr (std::is_same_v<T, CountTruckCargoByTruck>) {
                return read_query(base_location + "/truck_cargo/count_truck_cargo_by_truck.sql");
            } else if constexpr (std::is_same_v<T, CreateTruckCargo>) {
                std::string base_query = read_query(base_location + "/truck_cargo/create_truck_cargo.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
                return base_query.replace(base_query.find('?'), 1, q.quantity);
            } else if constexpr (std::is_same_v<T, DeleteTruckCargoProduct>) {
                std::string base_query = read_query(base_location + "/truck_cargo/delete_truck_cargo_product.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, GetAllTrucksCargo>) {
                return read_query(base_location + "/truck_cargo/get_all_trucks_cargo.sql");
            } else if constexpr (std::is_same_v<T, GetTruckCargo>) {
                std::string base_query = read_query(base_location + "/truck_cargo/get_truck_cargo.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, GetTruckCargoByProduct>) {
                std::string base_query = read_query(base_location + "/truck_cargo/get_truck_cargo_by_product.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, GetTruckCargoByTruck>) {
                std::string base_query = read_query(base_location + "/truck_cargo/get_truck_cargo_by_truck.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
            } else if constexpr (std::is_same_v<T, UpdateTruckCargoQuantity>) {
                std::string base_query = read_query(base_location + "/truck_cargo/update_truck_cargo_quantity.sql");
                base_query.replace(base_query.find('?'), 1, q.quantity);
                base_query.replace(base_query.find('?'), 1, "'" + q.truck_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            }
            // -------------------------------------------------------------------------------------------------------------
            // ? Warehouses Stocks
            // -------------------------------------------------------------------------------------------------------------
            else if constexpr (std::is_same_v<T, CountStockByProduct>) {
                return read_query(base_location + "/warehouses_stocks/count_stock_by_product.sql");
            } else if constexpr (std::is_same_v<T, CountStockByWarehouse>) {
                return read_query(base_location + "/warehouses_stocks/count_stock_by_warehouse.sql");
            } else if constexpr (std::is_same_v<T, CreateWarehouseStock>) {
                std::string base_query = read_query(base_location + "/warehouses_stocks/create_warehouse_stock.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
                base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
                return base_query.replace(base_query.find('?'), 1, q.quantity);
            } else if constexpr (std::is_same_v<T, DeleteWarehouseStock>) {
                std::string base_query = read_query(base_location + "/warehouses_stocks/delete_warehouse_stock.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, GetAllWarehouseStock>) {
                return read_query(base_location + "/warehouses_stocks/get_all_warehouse_stock.sql");
            } else if constexpr (std::is_same_v<T, GetStockByProduct>) {
                std::string base_query = read_query(base_location + "/warehouses_stocks/get_stock_by_product.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, GetStockByWarehouse>) {
                std::string base_query = read_query(base_location + "/warehouses_stocks/get_stock_by_warehouse.sql");
                return base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
            } else if constexpr (std::is_same_v<T, GetWarehouseProductQuantity>) {
                std::string base_query =
                        read_query(base_location + "/warehouses_stocks/get_warehouse_product_quantity.sql");
                base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            } else if constexpr (std::is_same_v<T, UpdateWarehouseStockQuantity>) {
                std::string base_query = read_query(
                    base_location + "/warehouses_stocks/update_warehouse_stock_quantity.sql");
                base_query.replace(base_query.find('?'), 1, q.quantity);
                base_query.replace(base_query.find('?'), 1, "'" + q.warehouse_id + "'");
                return base_query.replace(base_query.find('?'), 1, "'" + q.product_id + "'");
            }
            // -------------------------------------------------------------------------------------------------------------
            else throw std::runtime_error("Invalid Query type");
    }, query);
}

auto QueryProcessor::executeQuery(const QueryProcessor::Query &query,
                                  std::function<void(const drogon::HttpResponsePtr &)> &&callback) -> void {
    const auto query_str = App::qp.getQuery(query);
    Json::Value arr(Json::arrayValue);

    App::rc = sqlite3_exec(App::db, query_str.c_str(),
                           [](void *data, const int argc, char **argv, char **colName) -> int {
                               auto *l_arr = static_cast<Json::Value *>(data);
                               Json::Value obj;

                               const auto columns = std::span(colName, argc);

                               for (const auto values = std::span(argv, argc); auto [val, col]: std::views::zip(
                                        values, columns))
                                   obj[col] = val ? val : "";

                               l_arr->append(obj);
                               return 0;
                           }, &arr, nullptr);

    const auto resp = drogon::HttpResponse::newHttpJsonResponse(arr);
    callback(resp);
}
