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
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllUsers()), "SELECT * FROM users;");
}

TEST_F(QueryProcessorTest, SingleUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUser("Some ID")), "SELECT * FROM users WHERE id = 'Some ID';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUser("other")), "SELECT * FROM users WHERE id = 'other';");
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
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllTrucks()), "SELECT * FROM truck;");
}

TEST_F(QueryProcessorTest, SingleTruck) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruck("Some ID")), "SELECT * FROM truck WHERE id = 'Some ID';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruck("other")), "SELECT * FROM truck WHERE id = 'other';");
}


TEST_F(QueryProcessorTest, TrucksBySize) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTrucksBySize("L")), "SELECT * FROM truck WHERE size = 'L';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTrucksBySize("M")), "SELECT * FROM truck WHERE size = 'M';");
}

TEST_F(QueryProcessorTest, TrucksByModel) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTrucksByModel("m1")), "SELECT * FROM truck WHERE model = 'm1';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTrucksByModel("m2")), "SELECT * FROM truck WHERE model = 'm2';");
}

TEST_F(QueryProcessorTest, DataFromATruck) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruckData("ID", "volume_max")),
              "SELECT volume_max FROM truck WHERE id = 'ID';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruckData("Some ID", "is_valid")),
              "SELECT is_valid FROM truck WHERE id = 'Some ID';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Deposit query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, SingleDeposit) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getDeposit("Some ID")), "SELECT * FROM deposit WHERE id = 'Some ID';");
}

TEST_F(QueryProcessorTest, DataFromADeposit) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getDepositData("ID", "name")), "SELECT name FROM deposit WHERE id = 'ID';");
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
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrdersByReceiver("R1")), "SELECT * FROM orders WHERE receiver_id = 'R1';");
}

TEST_F(QueryProcessorTest, OrdersBySender) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrdersBySender("S1")), "SELECT * FROM orders WHERE sender_id = 'S1';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Product query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, SingleProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getProduct("Some ID")), "SELECT * FROM product WHERE id = 'Some ID';");
}

TEST_F(QueryProcessorTest, DataFromAProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getProductData("ID", "price")), "SELECT price FROM product WHERE id = 'ID';");
}
// ---------------------------------------------------------------------------------------------------------------------
