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
