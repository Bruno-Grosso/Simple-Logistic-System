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
    return std::visit([this](const auto &sub_query_variant) -> std::string {
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
        }, sub_query_variant);
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
