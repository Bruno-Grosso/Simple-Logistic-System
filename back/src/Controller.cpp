//
// Created by be on 3/25/26.
//

#include <drogon/drogon.h>

#include "App.h"
#include "auth/AuthHandlers.h"
#include "Controller.h"

using namespace drogon;

auto Controller::init() -> void {
    // ? GET routes
    // * -----------------------------------------------------------------------------------------------------------------
    // ? Users
    // -----------------------------------------------------------------------------------------------------------------

    app().registerHandler("/login", &AuthHandlers::login, {Post});
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

    app().registerHandler("/clients", &AuthHandlers::registerUser, {Post});

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

    app().registerHandler("/trucks/warehouse/current/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getTrucksAtWarehouse(warehouse_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/warehouse/destination/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getTrucksByDestination(warehouse_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/warehouse/origin/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getTrucksByOrigin(warehouse_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/status/delivering",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getCurrentlyDeliveringTrucks(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/status/idle",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getNotCurrentlyDeliveringTrucks(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/status/valid",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getValidTrucks(), std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/status/invalid",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getInvalidTrucks(), std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/status/refrigerated",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getRefrigeratedTrucks(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/status/not_refrigerated",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getNotRefrigeratedTrucks(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/status/refrigerated_delivering",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getRefrigeratedDeliveringTrucks(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/status/refrigerated_idle",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getRefrigeratedNotDeliveringTrucks(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/{1}/cargo_details",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &truck_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getTruckDetailedCargo(truck_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/all/cargo_details",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllTrucksWithCargo(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/product/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &product_id) {
                              QueryProcessor::executeQuery(QueryProcessor::findTruckByProduct(product_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/search/volume/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &volume) {
                              QueryProcessor::executeQuery(QueryProcessor::findTruckByVolumeCapacity(volume),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/search/weight/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &weight) {
                              QueryProcessor::executeQuery(QueryProcessor::findTruckByWeightCapacity(weight),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/search/refrigerated/volume/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &volume) {
                              QueryProcessor::executeQuery(QueryProcessor::findRefrigeratedTruckByVolumeCapacity(volume),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks/search/refrigerated/weight/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &weight) {
                              QueryProcessor::executeQuery(QueryProcessor::findRefrigeratedTruckByWeightCapacity(weight),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/trucks",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createTruck(
                                      (*json)["id"].asString(), (*json)["model"].asString(),
                                      (*json)["speed"].asString(), (*json)["is_valid"].asString(),
                                      (*json)["is_delivering"].asString(), (*json)["size"].asString(),
                                      (*json)["volume_current"].asString(), (*json)["volume_max"].asString(),
                                      (*json)["weight_current"].asString(), (*json)["weight_max"].asString(),
                                      (*json)["has_refrigeration"].asString(),
                                      (*json)["current_warehouse_id"].asString(),
                                      (*json)["origin_warehouse_id"].asString(),
                                      (*json)["destination_warehouse_id"].asString(),
                                      (*json)["estimated_time"].asString(), (*json)["fuel_capacity"].asString(),
                                      (*json)["fuel_current"].asString(), (*json)["fuel_consumption"].asString(),
                                      (*json)["truck_maintenance"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/trucks/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteTruck(id), std::move(callback));
                          }, {Delete});

    app().registerHandler("/trucks/{1}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateTruck(
                                      id, (*json)["model"].asString(), (*json)["speed"].asString(),
                                      (*json)["is_valid"].asString(), (*json)["is_delivering"].asString(),
                                      (*json)["size"].asString(), (*json)["volume_current"].asString(),
                                      (*json)["volume_max"].asString(), (*json)["weight_current"].asString(),
                                      (*json)["weight_max"].asString(), (*json)["has_refrigeration"].asString(),
                                      (*json)["current_warehouse_id"].asString(),
                                      (*json)["origin_warehouse_id"].asString(),
                                      (*json)["destination_warehouse_id"].asString(),
                                      (*json)["estimated_time"].asString(), (*json)["fuel_capacity"].asString(),
                                      (*json)["fuel_current"].asString(), (*json)["fuel_consumption"].asString(),
                                      (*json)["truck_maintenance"].asString()),
                                  std::move(callback));
                          }, {Put});
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

    app().registerHandler("/warehouses",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllWarehouses(), std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/{1}/products",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getWarehouseProducts(warehouse_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/{1}/total_items",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getWarehouseTotalItems(warehouse_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/status/available_capacity",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getWarehouseAvailableCapacity(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/status/free_volume_sorted",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getWarehousesSortedByFreeVolume(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/status/most_loaded",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getMostLoadedWarehouses(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/status/refrigerated",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getRefrigeratedWarehouses(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/reports/used_volume",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::calculateWarehouseUsedVolume(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/product/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &product_id) {
                              QueryProcessor::executeQuery(QueryProcessor::findWarehouseByProduct(product_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/search/required_volume/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &volume) {
                              QueryProcessor::executeQuery(QueryProcessor::findWarehouseByRequiredVolume(volume),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/search/cold_storage",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::findColdStorageWarehouse(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/search/cold_with_capacity/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &volume) {
                              QueryProcessor::executeQuery(QueryProcessor::findColdWarehouseWithCapacity(volume),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/search/empty",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::findEmptyWarehouses(), std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/reports/expiring_products",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::findExpiringProductsInWarehouses(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses/reports/fragile_products",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::findFragileProductsInWarehouses(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/warehouses",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createWarehouse(
                                      (*json)["id"].asString(), (*json)["location"].asString(),
                                      (*json)["size"].asString(), (*json)["volume_current"].asString(),
                                      (*json)["volume_max"].asString(), (*json)["has_refrigeration"].asString(),
                                      (*json)["fuel_price"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/warehouses/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteWarehouse(id), std::move(callback));
                          }, {Delete});

    app().registerHandler("/warehouses/{1}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateWarehouse(
                                      id, (*json)["location"].asString(), (*json)["size"].asString(),
                                      (*json)["volume_current"].asString(), (*json)["volume_max"].asString(),
                                      (*json)["has_refrigeration"].asString(), (*json)["fuel_price"].asString()),
                                  std::move(callback));
                          }, {Put});
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

    app().registerHandler("/orders",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllOrders(), std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/status/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &status) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrdersByStatus(status),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/status/cancelled",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getCancelledOrders(), std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/status/delivered",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getDeliveredOrders(), std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/status/pending",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getPendingOrders(), std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/status/shipped",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getShippedOrders(), std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/status/supplier_delivered",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getSupplierDeliveredOrders(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/supplier/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &supplier_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getSupplierOrders(supplier_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/freight_cost",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrderFreightCost(order_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/items",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrderItems(order_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/route",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrderRoute(order_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/routes/truck/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &truck_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrderRoutesByTruck(truck_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/routes/warehouse/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrderRoutesByWarehouse(warehouse_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/supplier_route",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrderSupplierRoute(order_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/product/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &product_id) {
                              QueryProcessor::executeQuery(QueryProcessor::findOrderByProduct(product_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/all/freight_costs",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllOrdersFreightCosts(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/all/items",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllOrdersItems(), std::move(callback));
                          }, {Get});

    app().registerHandler("/orders",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createOrder(
                                      (*json)["id"].asString(), (*json)["client_id"].asString(),
                                      (*json)["final_destination"].asString(), (*json)["time_limit"].asString(),
                                      (*json)["price"].asString(), (*json)["status"].asString(),
                                      (*json)["supplier_id"].asString(), (*json)["supplier_delivery"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/orders/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteOrder(id), std::move(callback));
                          }, {Delete});

    app().registerHandler("/orders/{1}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateOrder(
                                      id, (*json)["client_id"].asString(), (*json)["final_destination"].asString(),
                                      (*json)["time_limit"].asString(), (*json)["price"].asString(),
                                      (*json)["status"].asString(), (*json)["supplier_id"].asString(),
                                      (*json)["supplier_delivery"].asString()),
                                  std::move(callback));
                          }, {Put});
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

    app().registerHandler("/products",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllProducts(), std::move(callback));
                          }, {Get});

    app().registerHandler("/products/id/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::getProductById(id), std::move(callback));
                          }, {Get});

    app().registerHandler("/products/name/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &name) {
                              QueryProcessor::executeQuery(QueryProcessor::getProductByName(name), std::move(callback));
                          }, {Get});

    app().registerHandler("/products/status/cold",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getColdProducts(), std::move(callback));
                          }, {Get});

    app().registerHandler("/products/status/expirable",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getExpirableProducts(), std::move(callback));
                          }, {Get});

    app().registerHandler("/products/status/fragile",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getFragileProducts(), std::move(callback));
                          }, {Get});

    app().registerHandler("/products/{1}/orders_items",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &product_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getProductOrders(product_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/products/{1}/warehouses_stock",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &product_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getProductStockInWarehouses(product_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/products/search/price",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto &min_price = req->getParameter("min");
                              const auto &max_price = req->getParameter("max");
                              QueryProcessor::executeQuery(QueryProcessor::findProductByPriceRange(min_price, max_price),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/products/search/volume/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &volume) {
                              QueryProcessor::executeQuery(QueryProcessor::findProductByVolume(volume),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/products/search/weight/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &weight) {
                              QueryProcessor::executeQuery(QueryProcessor::findProductByWeight(weight),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/products/all/orders_items",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllProductsOrders(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/products/all/warehouses_stock",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllProductsStock(), std::move(callback));
                          }, {Get});

    app().registerHandler("/products",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createProduct(
                                      (*json)["id"].asString(), (*json)["name"].asString(),
                                      (*json)["price"].asString(), (*json)["is_cold"].asString(),
                                      (*json)["is_fragile"].asString(), (*json)["expire_date"].asString(),
                                      (*json)["size"].asString(), (*json)["volume"].asString(),
                                      (*json)["weight"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/products/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteProduct(id), std::move(callback));
                          }, {Delete});

    app().registerHandler("/products/{1}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateProduct(
                                      id, (*json)["name"].asString(), (*json)["price"].asString(),
                                      (*json)["is_cold"].asString(), (*json)["is_fragile"].asString(),
                                      (*json)["expire_date"].asString(), (*json)["size"].asString(),
                                      (*json)["volume"].asString(), (*json)["weight"].asString()),
                                  std::move(callback));
                          }, {Put});
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

    app().registerHandler("/online_users",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createOnlineUser((*json)["session_id"].asString(),
                                                                   (*json)["user_id"].asString(),
                                                                   (*json)["login_time"].asString(),
                                                                   (*json)["last_activity"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/online_users/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &session_id) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteOnlineUser(session_id),
                                                           std::move(callback));
                          }, {Delete});

    app().registerHandler("/online_users/{1}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &session_id) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateOnlineUser(session_id, (*json)["last_activity"].asString()),
                                  std::move(callback));
                          }, {Put});

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

    // ? Orders Route
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/orders/routes",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getAllOrdersRoute(), std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/routes/arrived",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getArrivedOrdersRoute(), std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/routes/pending",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
                              QueryProcessor::executeQuery(QueryProcessor::getPendingArrivalOrdersRoute(),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/routes/destination/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &destination_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrdersRouteByDestination(destination_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/routes",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrdersRouteByOrder(order_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/{1}/routes/step/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id, const std::string &step) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrdersRouteByStep(order_id, step),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/routes/truck/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &truck_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrdersRouteByTruck(truck_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/routes/warehouse/{1}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &warehouse_id) {
                              QueryProcessor::executeQuery(QueryProcessor::getOrdersRouteByWarehouse(warehouse_id),
                                                           std::move(callback));
                          }, {Get});

    app().registerHandler("/orders/routes",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::createOrderRoute(
                                      (*json)["order_id"].asString(), (*json)["step"].asString(),
                                      (*json)["warehouse_id"].asString(), (*json)["truck_id"].asString(),
                                      (*json)["destination_warehouse_id"].asString(),
                                      (*json)["estimated_time"].asString(), (*json)["arrived_at"].asString()),
                                  std::move(callback));
                          }, {Post});

    app().registerHandler("/orders/{1}/routes/step/{2}",
                          [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id, const std::string &step) {
                              QueryProcessor::executeQuery(QueryProcessor::deleteOrderRoute(order_id, step),
                                                           std::move(callback));
                          }, {Delete});

    app().registerHandler("/orders/{1}/routes/step/{2}",
                          [=](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback,
                              const std::string &order_id, const std::string &step) {
                              const auto json = req->getJsonObject();
                              QueryProcessor::executeQuery(
                                  QueryProcessor::updateOrderRoute(
                                      order_id, step, (*json)["warehouse_id"].asString(),
                                      (*json)["truck_id"].asString(), (*json)["destination_warehouse_id"].asString(),
                                      (*json)["estimated_time"].asString(), (*json)["arrived_at"].asString()),
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
