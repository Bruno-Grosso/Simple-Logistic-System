//
// Created by be on 3/20/26.
//

#include <gtest/gtest.h>
#include <print>

#include "../src/QueryProcessor.h"

struct QueryProcessorTest : ::testing::Test {
    QueryProcessorTest() = default;

    QueryProcessor qp;
};

// ? User query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, AllUsers) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllUsers()), "SELECT id, name, address, role FROM users ORDER BY name ASC;\n");
}

TEST_F(QueryProcessorTest, SingleUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUser("Some ID")), "SELECT id, name, address, role FROM users WHERE id = 'Some ID';\n");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUser("other")), "SELECT id, name, address, role FROM users WHERE id = 'other';\n");
}

TEST_F(QueryProcessorTest, UsersByRole) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUsersByRole("admin")), "SELECT * FROM users WHERE role = 'admin';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUsersByRole("worker")), "SELECT * FROM users WHERE role = 'worker';");
}

TEST_F(QueryProcessorTest, DataFromAUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUserData("Some ID", "password")),
              "SELECT password FROM users WHERE id = 'Some ID';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUserData("Some ID", "role")),
              "SELECT role FROM users WHERE id = 'Some ID';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Truck query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, AllTrucks) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllTrucks()), "SELECT * FROM trucks;");
}

TEST_F(QueryProcessorTest, SingleTruck) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruck("Some ID")), "SELECT * FROM trucks WHERE id = 'Some ID';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruck("other")), "SELECT * FROM trucks WHERE id = 'other';");
}


TEST_F(QueryProcessorTest, TrucksBySize) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTrucksBySize("L")), "SELECT * FROM trucks WHERE size = 'L';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTrucksBySize("M")), "SELECT * FROM trucks WHERE size = 'M';");
}

TEST_F(QueryProcessorTest, TrucksByModel) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTrucksByModel("m1")), "SELECT * FROM trucks WHERE model = 'm1';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTrucksByModel("m2")), "SELECT * FROM trucks WHERE model = 'm2';");
}

TEST_F(QueryProcessorTest, DataFromATruck) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruckData("ID", "volume_max")),
              "SELECT volume_max FROM trucks WHERE id = 'ID';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruckData("Some ID", "is_valid")),
              "SELECT is_valid FROM trucks WHERE id = 'Some ID';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Warehouse query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, SingleWarehouse) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getWarehouse("Some ID")), "SELECT * FROM warehouses WHERE id = 'Some ID';");
}

TEST_F(QueryProcessorTest, DataFromAWarehouse) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getWarehouseData("ID", "name")), "SELECT name FROM warehouses WHERE id = 'ID';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Order query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, SingleOrder) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrder("Some ID")), "SELECT * FROM orders WHERE id = 'Some ID';");
}

TEST_F(QueryProcessorTest, DataFromAnOrder) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrderData("ID", "status")), "SELECT status FROM orders WHERE id = 'ID';");
}

TEST_F(QueryProcessorTest, OrdersByFinalDestination) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrdersByFinalDestination("NY")),
              "SELECT * FROM orders WHERE final_destination = 'NY';");
}

TEST_F(QueryProcessorTest, OrdersByReceiver) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrdersByReceiver("R1")), "SELECT * FROM orders WHERE final_destination = 'R1';");
}

TEST_F(QueryProcessorTest, OrdersBySender) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrdersBySender("S1")), "SELECT * FROM orders WHERE client_id = 'S1';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Product query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, SingleProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getProduct("Some ID")), "SELECT * FROM products WHERE id = 'Some ID';");
}

TEST_F(QueryProcessorTest, DataFromAProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getProductData("ID", "price")), "SELECT price FROM products WHERE id = 'ID';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Supplier query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, AllSuppliers) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllSuppliers()), "SELECT id, name, location FROM suppliers ORDER BY name ASC;\n");
}

TEST_F(QueryProcessorTest, SingleSupplier) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getSupplier("S1")), "SELECT id, name, location FROM suppliers WHERE id = 'S1';\n");
}

TEST_F(QueryProcessorTest, SuppliersByLocation) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getSuppliersByLocation("Porto")), "SELECT id, name, location FROM suppliers WHERE location = 'Porto' ORDER BY name ASC;\n");
}

TEST_F(QueryProcessorTest, DataFromASupplier) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getSupplierData("S1", "name")), "SELECT name FROM suppliers WHERE id = 'S1';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Freight Cost query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, AllFreightCosts) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllFreightCosts()), "SELECT order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at FROM freight_cost ORDER BY order_id ASC;\n");
}

TEST_F(QueryProcessorTest, SingleFreightCost) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getFreightCost("O1")), "SELECT order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at FROM freight_cost WHERE order_id = 'O1';\n");
}

TEST_F(QueryProcessorTest, DataFromAFreightCost) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getFreightCostData("O1", "total_cost")), "SELECT total_cost FROM freight_cost WHERE order_id = 'O1';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Online User query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, AllOnlineUsers) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllOnlineUsers()), "SELECT id, name, role, address FROM users ORDER BY name ASC;\n");
}

TEST_F(QueryProcessorTest, SingleOnlineUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOnlineUser("SID1")), "SELECT id, name, role, address FROM users WHERE id = 'SID1';\n");
}

TEST_F(QueryProcessorTest, OnlineUsersByRole) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOnlineUsersByRole("admin")), "SELECT id, name, role, address FROM users WHERE role = 'admin' ORDER BY name ASC;\n");
}

TEST_F(QueryProcessorTest, DataFromAnOnlineUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOnlineUserData("SID1", "login_time")), "SELECT login_time FROM online_users WHERE session_id = 'SID1';");
}
// ---------------------------------------------------------------------------------------------------------------------
