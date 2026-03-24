//
// Created by be on 3/20/26.
//

#include <gtest/gtest.h>
#include <print>

#include "../src/QueryProcessor.h"

struct QueryProcessorTest : ::testing::Test {
    QueryProcessorTest()  = default;

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
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUserData("Some ID", "password")), "SELECT password FROM users WHERE id = 'Some ID';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUserData("Some ID", "role")), "SELECT role FROM users WHERE id = 'Some ID';");
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
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruckData("ID", "volume_max")), "SELECT volume_max FROM truck WHERE id = 'ID';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruckData("Some ID", "is_valid")), "SELECT is_valid FROM truck WHERE id = 'Some ID';");
}
// ---------------------------------------------------------------------------------------------------------------------