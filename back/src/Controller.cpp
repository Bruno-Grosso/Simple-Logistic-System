//
// Created by be on 3/25/26.
//

#include <drogon/drogon.h>

#include "Controller.h"
#include "App.h"

using namespace drogon;

auto Controller::init() -> void {
    // ? GET routes
    // * -----------------------------------------------------------------------------------------------------------------
    // ? Users
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler(
        "/clients", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
            QueryProcessor::executeQuery(QueryProcessor::getAllUsers(), std::move(callback));
        }, {Get});

    app().registerHandler("/clients/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::getUser(id), std::move(callback));
                          }, {Get});

    app().registerHandler("/clients/role/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &role) {
                              QueryProcessor::executeQuery(QueryProcessor::getUsersByRole(role), std::move(callback));
                          }, {Get});

    app().registerHandler("/clients/{1}/field/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id, const std::string &field) {
                              QueryProcessor::executeQuery(QueryProcessor::getUserData(id, field), std::move(callback));
                          }, {Get});

    app().registerHandler("/clients/count/role",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countUsersByRole(), std::move(callback));
                          }, {Get});

    app().registerHandler("/clients",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createUser((*json)["id"].asString(), (*json)["name"].asString(),
                                                             (*json)["password"].asString(),
                                                             (*json)["address"].asString(), (*json)["role"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/clients/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteUser(id), std::move(callback));
                          }, {Delete});

    app().registerHandler("/clients/{1}/password",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateUserPassword(id, (*json)["password"].asString()),
                                  std::move(callback));
                          }, {Put});

    app().registerHandler("/clients/{1}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateUsersData(id, (*json)["name"].asString(),
                                                                  (*json)["address"].asString(),
                                                                  (*json)["role"].asString()),
                                  std::move(callback));
                          }, {Put});

    // -----------------------------------------------------------------------------------------------------------------

    // ? Trucks
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler(
        "/trucks", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
            QueryProcessor::executeQuery(QueryProcessor::getAllTrucks(), std::move(callback));
        }, {Get});

    app().registerHandler("/trucks/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::getTruck(id), std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/model/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &model) {
                              QueryProcessor::executeQuery(QueryProcessor::getTrucksByModel(model),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/size/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &size) {
                              QueryProcessor::executeQuery(QueryProcessor::getTrucksBySize(size), std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/{1}/field/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id, const std::string &field) {
                              QueryProcessor::executeQuery(QueryProcessor::getTruckData(id, field),
                                                           std::move(callback));
                          }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Warehouses
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/warehouses/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::getWarehouse(id), std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/{1}/field/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id, const std::string &field) {
                              QueryProcessor::executeQuery(QueryProcessor::getWarehouseData(id, field),
                                                           std::move(callback));
                          }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Orders
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/orders/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrder(id), std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/field/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id, const std::string &field) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrderData(id, field),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/destination/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &destination) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrdersByFinalDestination(destination),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/receiver/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &receiver_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrdersByReceiver(receiver_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/sender/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &sender_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrdersBySender(sender_id),
                                                           std::move(callback));
                          }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Products
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/products/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::getProduct(id), std::move(callback));
                          }, {Get});

    app().registerHandler("/products/{1}/field/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id, const std::string &field) {
                              QueryProcessor::executeQuery(QueryProcessor::getProductData(id, field),
                                                           std::move(callback));
                          }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Suppliers
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/suppliers",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllSuppliers(), std::move(callback));
                          }, {Get});

    app().registerHandler("/suppliers/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::getSupplier(id), std::move(callback));
                          }, {Get});

    app().registerHandler("/suppliers/location/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &location) {
                              QueryProcessor::executeQuery(QueryProcessor::getSuppliersByLocation(location),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/suppliers/{1}/field/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id, const std::string &field) {
                              QueryProcessor::executeQuery(QueryProcessor::getSupplierData(id, field),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/suppliers/count/location",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countSuppliersByLocation(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/suppliers",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createSupplier((*json)["id"].asString(), (*json)["name"].asString(),
                                                                 (*json)["location"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/suppliers/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteSupplier(id), std::move(callback));
                          }, {Delete});

    app().registerHandler("/suppliers/{1}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateSupplier(id, (*json)["name"].asString(),
                                                                 (*json)["location"].asString()),
                                  std::move(callback));
                          }, {Put});

    // -----------------------------------------------------------------------------------------------------------------

    // ? Freight Costs
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/freight_costs",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllFreightCosts(), std::move(callback));
                          }, {Get});

    app().registerHandler("/freight_costs/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getFreightCost(order_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/freight_costs/{1}/field/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id, const std::string &field) {
                              QueryProcessor::executeQuery(QueryProcessor::getFreightCostData(order_id, field),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/freight_costs/count",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countFreightCosts(), std::move(callback));
                          }, {Get});

    app().registerHandler("/freight_costs",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createFreightCost(
                                      (*json)["order_id"].asString(), (*json)["fuel_cost"].asString(),
                                      (*json)["labor_cost"].asString(), (*json)["maintenance_cost"].asString(),
                                      (*json)["total_cost"].asString(), (*json)["calculated_at"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/freight_costs/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteFreightCost(order_id),
                                                           std::move(callback));
                          }, {Delete});

    app().registerHandler("/freight_costs/{1}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateFreightCost(
                                      order_id, (*json)["fuel_cost"].asString(), (*json)["labor_cost"].asString(),
                                      (*json)["maintenance_cost"].asString(), (*json)["total_cost"].asString(),
                                      (*json)["calculated_at"].asString()),
                                  std::move(callback));
                          }, {Put});

    // -----------------------------------------------------------------------------------------------------------------

    // ? Online Users
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/online_users",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllOnlineUsers(), std::move(callback));
                          }, {Get});

    app().registerHandler("/online_users/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &session_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOnlineUser(session_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/online_users/role/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &role) {
                              QueryProcessor::executeQuery(QueryProcessor::getOnlineUsersByRole(role),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/online_users/{1}/field/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &session_id, const std::string &field) {
                              QueryProcessor::executeQuery(QueryProcessor::getOnlineUserData(session_id, field),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/online_users/count/role",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countOnlineUsersByRole(),
                                                           std::move(callback));
                          }, {Get});

    // -----------------------------------------------------------------------------------------------------------------

    // ? Orders Items
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/orders/items/count/order",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countOrderItemsByOrder(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/items/count/product",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countOrderItemsByProduct(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/items",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createOrderItem(order_id, (*json)["product_id"].asString(),
                                                                  (*json)["quantity"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/orders/{1}/items/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id, const std::string &product_id) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteOrderItem(order_id, product_id),
                                                           std::move(callback));
                          }, {Delete});

    app().registerHandler("/orders/items",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllOrderItems(), std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/items",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrderItemsByOrder(order_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/products/{1}/orders",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &product_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrderItemsByProduct(product_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/items/{2}/quantity",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id, const std::string &product_id) {
                              QueryProcessor::executeQuery(
                                  QueryProcessor::getOrderProductQuantity(order_id, product_id),
                                  std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/items/{2}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id, const std::string &product_id) {
                              auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateOrderItemQuantity(order_id, product_id,
                                                                          (*json)["quantity"].asString()),
                                  std::move(callback));
                          }, {Put});

    // -----------------------------------------------------------------------------------------------------------------

    // ? Supplies Routes
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/supplies_routes/count/order",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countSuppliesRouteByOrder(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/supplies_routes/count/supplier",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countSuppliesRouteBySupplier(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/supplies_routes",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createSuppliesRoute(
                                      (*json)["order_id"].asString(), (*json)["supplier_id"].asString(),
                                      (*json)["truck_id"].asString(), (*json)["estimated_departure"].asString(),
                                      (*json)["estimated_arrival"].asString(), (*json)["actual_arrival"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/supplies_routes/order/{1}/supplier/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id, const std::string &supplier_id) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteSuppliesRoute(order_id, supplier_id),
                                                           std::move(callback));
                          }, {Delete});

    app().registerHandler("/supplies_routes",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllSuppliesRoute(), std::move(callback));
                          }, {Get});

    app().registerHandler("/supplies_routes/order/{1}/supplier/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id, const std::string &supplier_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getSuppliesRoute(order_id, supplier_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/supplies_routes",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getSuppliesRouteByOrder(order_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/suppliers/{1}/supplies_routes",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &supplier_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getSuppliesRouteBySupplier(supplier_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/supplies_routes/order/{1}/supplier/{2}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id, const std::string &supplier_id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateSuppliesRoute(
                                      order_id, supplier_id, (*json)["truck_id"].asString(),
                                      (*json)["estimated_departure"].asString(),
                                      (*json)["estimated_arrival"].asString(),
                                      (*json)["actual_arrival"].asString()),
                                  std::move(callback));
                          }, {Put});

    // -----------------------------------------------------------------------------------------------------------------

    // ? Truck Cargo
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/truck_cargo/count/product",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countTruckCargoByProduct(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/truck_cargo/count/truck",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countTruckCargoByTruck(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/truck_cargo",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createTruckCargo((*json)["truck_id"].asString(),
                                                                   (*json)["product_id"].asString(),
                                                                   (*json)["quantity"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/truck_cargo/truck/{1}/product/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &truck_id, const std::string &product_id) {
                              QueryProcessor::executeQuery(
                                  QueryProcessor::deleteTruckCargoProduct(truck_id, product_id),
                                  std::move(callback));
                          }, {Delete});

    app().registerHandler("/truck_cargo",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllTrucksCargo(), std::move(callback));
                          }, {Get});

    app().registerHandler("/truck_cargo/truck/{1}/product/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &truck_id, const std::string &product_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getTruckCargo(truck_id, product_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/products/{1}/truck_cargo",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &product_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getTruckCargoByProduct(product_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/{1}/cargo",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &truck_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getTruckCargoByTruck(truck_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/truck_cargo/truck/{1}/product/{2}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &truck_id, const std::string &product_id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateTruckCargoQuantity(truck_id, product_id,
                                                                           (*json)["quantity"].asString()),
                                  std::move(callback));
                          }, {Put});

    // -----------------------------------------------------------------------------------------------------------------

    // ? Warehouses Stocks
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/stocks/count/product",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countStockByProduct(), std::move(callback));
                          }, {Get});

    app().registerHandler("/stocks/count/warehouse",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::countStockByWarehouse(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/stocks",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createWarehouseStock((*json)["warehouse_id"].asString(),
                                                                       (*json)["product_id"].asString(),
                                                                       (*json)["quantity"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/stocks/warehouse/{1}/product/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id, const std::string &product_id) {
                              QueryProcessor::executeQuery(
                                  QueryProcessor::deleteWarehouseStock(warehouse_id, product_id),
                                  std::move(callback));
                          }, {Delete});

    app().registerHandler("/stocks",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllWarehouseStock(), std::move(callback));
                          }, {Get});

    app().registerHandler("/products/{1}/stocks",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &product_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getStockByProduct(product_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/{1}/stocks",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getStockByWarehouse(warehouse_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/stocks/warehouse/{1}/product/{2}/quantity",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id, const std::string &product_id) {
                              QueryProcessor::executeQuery(
                                  QueryProcessor::getWarehouseProductQuantity(warehouse_id, product_id),
                                  std::move(callback));
                          }, {Get});

    app().registerHandler("/stocks/warehouse/{1}/product/{2}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id, const std::string &product_id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateWarehouseStockQuantity(warehouse_id, product_id,
                                                                               (*json)["quantity"].asString()),
                                  std::move(callback));
                          }, {Put});

    // -----------------------------------------------------------------------------------------------------------------
    // * ---------------------------------------------------------------------------------------------------------------
}

auto Controller::run() -> void {
    app().addListener("0.0.0.0", 8848).run();
}
