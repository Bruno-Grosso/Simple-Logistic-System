//
// Created by be on 3/20/26.
//

#include <gtest/gtest.h>
#include <print>

#include "../src/QueryProcessor.h"

struct QueryProcessorTest : public ::testing::Test {
    QueryProcessorTest()  = default;

    QueryProcessor qp;
};

TEST_F(QueryProcessorTest, AllUsers) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllUsers()), "SELECT * FROM users;");
}

TEST_F(QueryProcessorTest, SingleUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUser("Some ID")), "SELECT * FROM users WHERE id = 'Some ID';");
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUser("other")), "SELECT * FROM users WHERE id = 'other';");
}