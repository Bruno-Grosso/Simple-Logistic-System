//
// Created by be on 3/25/26.
//

#include <drogon/drogon.h>

#include "Controller.h"
#include "App.h"

#include <span>
#include <ranges>

using namespace drogon;

auto Controller::init() -> void {
    // ? GET routes
    // -----------------------------------------------------------------------------------------------------------------
    // ? Users
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/clients", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
        QueryProcessor::executeQuery(QueryProcessor::getAllUsers(), std::move(callback));
    }, {Get});

    app().registerHandler("/clients/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id) {
        QueryProcessor::executeQuery(QueryProcessor::getUser(id), std::move(callback));
    }, {Get});

    app().registerHandler("/clients/role/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &role) {
        QueryProcessor::executeQuery(QueryProcessor::getUsersByRole(role), std::move(callback));
    }, {Get});

    app().registerHandler("/clients/{1}/field/{2}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id, const std::string &field) {
        QueryProcessor::executeQuery(QueryProcessor::getUserData(id, field), std::move(callback));
    }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Trucks
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/trucks", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
        QueryProcessor::executeQuery(QueryProcessor::getAllTrucks(), std::move(callback));
    }, {Get});

    app().registerHandler("/trucks/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id) {
        QueryProcessor::executeQuery(QueryProcessor::getTruck(id), std::move(callback));
    }, {Get});

    app().registerHandler("/trucks/model/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &model) {
        QueryProcessor::executeQuery(QueryProcessor::getTrucksByModel(model), std::move(callback));
    }, {Get});

    app().registerHandler("/trucks/size/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &size) {
        QueryProcessor::executeQuery(QueryProcessor::getTrucksBySize(size), std::move(callback));
    }, {Get});

    app().registerHandler("/trucks/{1}/field/{2}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id, const std::string &field) {
        QueryProcessor::executeQuery(QueryProcessor::getTruckData(id, field), std::move(callback));
    }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Warehouses
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/warehouses/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id) {
        QueryProcessor::executeQuery(QueryProcessor::getWarehouse(id), std::move(callback));
    }, {Get});

    app().registerHandler("/warehouses/{1}/field/{2}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id, const std::string &field) {
        QueryProcessor::executeQuery(QueryProcessor::getWarehouseData(id, field), std::move(callback));
    }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Orders
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/orders/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id) {
        QueryProcessor::executeQuery(QueryProcessor::getOrder(id), std::move(callback));
    }, {Get});

    app().registerHandler("/orders/{1}/field/{2}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id, const std::string &field) {
        QueryProcessor::executeQuery(QueryProcessor::getOrderData(id, field), std::move(callback));
    }, {Get});

    app().registerHandler("/orders/destination/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &destination) {
        QueryProcessor::executeQuery(QueryProcessor::getOrdersByFinalDestination(destination), std::move(callback));
    }, {Get});

    app().registerHandler("/orders/receiver/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &receiver_id) {
        QueryProcessor::executeQuery(QueryProcessor::getOrdersByReceiver(receiver_id), std::move(callback));
    }, {Get});

    app().registerHandler("/orders/sender/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &sender_id) {
        QueryProcessor::executeQuery(QueryProcessor::getOrdersBySender(sender_id), std::move(callback));
    }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Products
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/products/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id) {
        QueryProcessor::executeQuery(QueryProcessor::getProduct(id), std::move(callback));
    }, {Get});

    app().registerHandler("/products/{1}/field/{2}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id, const std::string &field) {
        QueryProcessor::executeQuery(QueryProcessor::getProductData(id, field), std::move(callback));
    }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Suppliers
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/suppliers", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
        QueryProcessor::executeQuery(QueryProcessor::getAllSuppliers(), std::move(callback));
    }, {Get});

    app().registerHandler("/suppliers/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id) {
        QueryProcessor::executeQuery(QueryProcessor::getSupplier(id), std::move(callback));
    }, {Get});

    app().registerHandler("/suppliers/location/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &location) {
        QueryProcessor::executeQuery(QueryProcessor::getSuppliersByLocation(location), std::move(callback));
    }, {Get});

    app().registerHandler("/suppliers/{1}/field/{2}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &id, const std::string &field) {
        QueryProcessor::executeQuery(QueryProcessor::getSupplierData(id, field), std::move(callback));
    }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Freight Costs
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/freight_costs", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
        QueryProcessor::executeQuery(QueryProcessor::getAllFreightCosts(), std::move(callback));
    }, {Get});

    app().registerHandler("/freight_costs/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &order_id) {
        QueryProcessor::executeQuery(QueryProcessor::getFreightCost(order_id), std::move(callback));
    }, {Get});

    app().registerHandler("/freight_costs/{1}/field/{2}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &order_id, const std::string &field) {
        QueryProcessor::executeQuery(QueryProcessor::getFreightCostData(order_id, field), std::move(callback));
    }, {Get});
    // -----------------------------------------------------------------------------------------------------------------

    // ? Online Users
    // -----------------------------------------------------------------------------------------------------------------
    app().registerHandler("/online_users", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback) {
        QueryProcessor::executeQuery(QueryProcessor::getAllOnlineUsers(), std::move(callback));
    }, {Get});

    app().registerHandler("/online_users/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &session_id) {
        QueryProcessor::executeQuery(QueryProcessor::getOnlineUser(session_id), std::move(callback));
    }, {Get});

    app().registerHandler("/online_users/role/{1}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &role) {
        QueryProcessor::executeQuery(QueryProcessor::getOnlineUsersByRole(role), std::move(callback));
    }, {Get});

    app().registerHandler("/online_users/{1}/field/{2}", [=](const HttpRequestPtr &_, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &session_id, const std::string &field) {
        QueryProcessor::executeQuery(QueryProcessor::getOnlineUserData(session_id, field), std::move(callback));
    }, {Get});
    // -----------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------
}

auto Controller::run() -> void {
    app().addListener("0.0.0.0", 8848).run();
}
