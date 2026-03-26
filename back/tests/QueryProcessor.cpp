//
// Created by be on 3/20/26.
//

#include <gtest/gtest.h>
#include <fstream>
#include <sstream>
#include <sqlite3.h>
#include <json/json.h>

#include "../src/QueryProcessor.h"
#include "../src/App.h"

struct QueryProcessorTest : ::testing::Test {
    QueryProcessor qp;
};

// * Query Building Tests
// ---------------------------------------------------------------------------------------------------------------------
// ? User query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, AllUsers) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllUsers()),
              "SELECT id, name, address, role FROM users ORDER BY name ASC;\n");
}

TEST_F(QueryProcessorTest, SingleUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUser("Some ID")),
              "SELECT id, name, address, role FROM users WHERE id = 'Some ID';\n");
}

TEST_F(QueryProcessorTest, UsersByRole) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUsersByRole("admin")), "SELECT * FROM users WHERE role = 'admin';");
}

TEST_F(QueryProcessorTest, DataFromAUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUserData("Some ID", "password")),
              "SELECT password FROM users WHERE id = 'Some ID';");
}

TEST_F(QueryProcessorTest, CountUsersByRole) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countUsersByRole()),
              "SELECT role, COUNT(*) AS total FROM users GROUP BY role;\n");
}

TEST_F(QueryProcessorTest, CreateUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::createUser("U1", "Name", "Pass", "Addr", "Role")),
              "INSERT INTO users (id, name, password, address, role) VALUES ('U1', 'Name', 'Pass', 'Addr', 'Role');\n");
}

TEST_F(QueryProcessorTest, DeleteUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::deleteUser("U1")), "DELETE FROM users WHERE id = 'U1';\n");
}

TEST_F(QueryProcessorTest, UpdateUserPassword) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::updateUserPassword("U1", "NewPass")),
              "UPDATE users SET password = 'NewPass' WHERE id = 'U1';\n");
}

TEST_F(QueryProcessorTest, UpdateUsersData) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::updateUsersData("U1", "NewName", "NewAddr", "NewRole")),
              "UPDATE users SET name = 'NewName', address = 'NewAddr', role = 'NewRole' WHERE id = 'U1';\n");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Truck query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, AllTrucks) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllTrucks()), "SELECT * FROM trucks;");
}

TEST_F(QueryProcessorTest, SingleTruck) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruck("Some ID")), "SELECT * FROM trucks WHERE id = 'Some ID';");
}

TEST_F(QueryProcessorTest, TrucksBySize) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTrucksBySize("L")), "SELECT * FROM trucks WHERE size = 'L';");
}

TEST_F(QueryProcessorTest, TrucksByModel) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTrucksByModel("m1")), "SELECT * FROM trucks WHERE model = 'm1';");
}

TEST_F(QueryProcessorTest, DataFromATruck) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruckData("ID", "volume_max")),
              "SELECT volume_max FROM trucks WHERE id = 'ID';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Warehouse query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, SingleWarehouse) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getWarehouse("Some ID")), "SELECT * FROM warehouses WHERE id = 'Some ID';");
}

TEST_F(QueryProcessorTest, DataFromAWarehouse) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getWarehouseData("ID", "name")),
              "SELECT name FROM warehouses WHERE id = 'ID';");
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
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrdersByReceiver("R1")),
              "SELECT * FROM orders WHERE final_destination = 'R1';");
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
    EXPECT_EQ(qp.getQuery(QueryProcessor::getProductData("ID", "price")),
              "SELECT price FROM products WHERE id = 'ID';");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Supplier query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, AllSuppliers) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllSuppliers()),
              "SELECT id, name, location FROM suppliers ORDER BY name ASC;\n");
}

TEST_F(QueryProcessorTest, SingleSupplier) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getSupplier("S1")),
              "SELECT id, name, location FROM suppliers WHERE id = 'S1';\n");
}

TEST_F(QueryProcessorTest, SuppliersByLocation) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getSuppliersByLocation("Porto")),
              "SELECT id, name, location FROM suppliers WHERE location = 'Porto' ORDER BY name ASC;\n");
}

TEST_F(QueryProcessorTest, DataFromASupplier) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getSupplierData("S1", "name")),
              "SELECT name FROM suppliers WHERE id = 'S1';");
}

TEST_F(QueryProcessorTest, CountSuppliersByLocation) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countSuppliersByLocation()),
              "SELECT location, COUNT(*) AS total_suppliers FROM suppliers GROUP BY location;\n");
}

TEST_F(QueryProcessorTest, CreateSupplier) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::createSupplier("S1", "Name", "Loc")),
              "INSERT INTO suppliers (id, name, location) VALUES ('S1', 'Name', 'Loc');\n");
}

TEST_F(QueryProcessorTest, DeleteSupplier) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::deleteSupplier("S1")), "DELETE FROM suppliers WHERE id = 'S1';\n");
}

TEST_F(QueryProcessorTest, UpdateSupplier) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::updateSupplier("S1", "NewName", "NewLoc")),
              "UPDATE suppliers SET name = 'NewName', location = 'NewLoc' WHERE id = 'S1';\n");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Freight Cost query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, AllFreightCosts) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllFreightCosts()),
              "SELECT order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at FROM freight_cost ORDER BY order_id ASC;\n");
}

TEST_F(QueryProcessorTest, SingleFreightCost) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getFreightCost("O1")),
              "SELECT order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at FROM freight_cost WHERE order_id = 'O1';\n");
}

TEST_F(QueryProcessorTest, DataFromAFreightCost) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getFreightCostData("O1", "total_cost")),
              "SELECT total_cost FROM freight_cost WHERE order_id = 'O1';");
}

TEST_F(QueryProcessorTest, CountFreightCosts) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countFreightCosts()),
              "SELECT COUNT(*) AS total_freight_costs FROM freight_cost;\n");
}

TEST_F(QueryProcessorTest, CreateFreightCost) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::createFreightCost("O1", "10", "20", "30", "60", "2026-03-26")),
              "INSERT INTO freight_cost (order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at) VALUES ('O1', 10, 20, 30, 60, '2026-03-26');\n");
}

TEST_F(QueryProcessorTest, DeleteFreightCost) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::deleteFreightCost("O1")), "DELETE FROM freight_cost WHERE order_id = 'O1';\n");
}

TEST_F(QueryProcessorTest, UpdateFreightCost) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::updateFreightCost("O1", "11", "21", "31", "63", "2026-03-27")),
              "UPDATE freight_cost SET fuel_cost = 11, labor_cost = 21, maintenance_cost = 31, total_cost = 63, calculated_at = '2026-03-27' WHERE order_id = 'O1';\n");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Online User query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, AllOnlineUsers) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllOnlineUsers()),
              "SELECT users.id, users.name, users.role, users.address FROM users JOIN online_users ON users.id = online_users.user_id ORDER BY users.name ASC;\n");
}

TEST_F(QueryProcessorTest, SingleOnlineUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOnlineUser("SID1")),
              "SELECT users.id, users.name, users.role, users.address FROM users JOIN online_users ON users.id = online_users.user_id WHERE online_users.session_id = 'SID1';\n");
}

TEST_F(QueryProcessorTest, OnlineUsersByRole) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOnlineUsersByRole("admin")),
              "SELECT users.id, users.name, users.role, users.address FROM users JOIN online_users ON users.id = online_users.user_id WHERE users.role = 'admin' ORDER BY users.name ASC;\n");
}

TEST_F(QueryProcessorTest, DataFromAnOnlineUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOnlineUserData("SID1", "login_time")),
              "SELECT login_time FROM online_users WHERE session_id = 'SID1';");
}

TEST_F(QueryProcessorTest, CountOnlineUsersByRole) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countOnlineUsersByRole()),
              "SELECT users.role, COUNT(*) AS total_users FROM users JOIN online_users ON users.id = online_users.user_id GROUP BY users.role;\n");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Orders Items query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, CountOrderItemsByOrder) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countOrderItemsByOrder()),
              "SELECT order_id, COUNT(product_id) AS total_products, SUM(quantity) AS total_quantity FROM orders_items GROUP BY order_id;\n");
}

TEST_F(QueryProcessorTest, CountOrderItemsByProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countOrderItemsByProduct()),
              "SELECT product_id, COUNT(order_id) AS total_orders, SUM(quantity) AS total_quantity FROM orders_items GROUP BY product_id;\n");
}

TEST_F(QueryProcessorTest, CreateOrderItem) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::createOrderItem("O1", "P1", "5")),
              "INSERT INTO orders_items (order_id, product_id, quantity) VALUES ('O1', 'P1', 5);\n");
}

TEST_F(QueryProcessorTest, DeleteOrderItem) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::deleteOrderItem("O1", "P1")),
              "DELETE FROM orders_items WHERE order_id = 'O1' AND product_id = 'P1';\n");
}

TEST_F(QueryProcessorTest, AllOrderItems) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllOrderItems()),
              "SELECT order_id, product_id, quantity FROM orders_items ORDER BY order_id, product_id ASC;\n");
}

TEST_F(QueryProcessorTest, OrderItemsByOrder) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrderItemsByOrder("O1")),
              "SELECT order_id, product_id, quantity FROM orders_items WHERE order_id = 'O1' ORDER BY product_id ASC;\n");
}

TEST_F(QueryProcessorTest, OrderItemsByProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrderItemsByProduct("P1")),
              "SELECT order_id, product_id, quantity FROM orders_items WHERE product_id = 'P1' ORDER BY order_id ASC;\n");
}

TEST_F(QueryProcessorTest, OrderProductQuantity) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOrderProductQuantity("O1", "P1")),
              "SELECT order_id, product_id, quantity FROM orders_items WHERE order_id = 'O1' AND product_id = 'P1';\n");
}

TEST_F(QueryProcessorTest, UpdateOrderItemQuantity) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::updateOrderItemQuantity("O1", "P1", "10")),
              "UPDATE orders_items SET quantity = 10 WHERE order_id = 'O1' AND product_id = 'P1';\n");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Supplies Routes query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, CountSuppliesRouteByOrder) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countSuppliesRouteByOrder()),
              "SELECT order_id, COUNT(supplier_id) AS total_suppliers FROM supplies_route GROUP BY order_id;\n");
}

TEST_F(QueryProcessorTest, CountSuppliesRouteBySupplier) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countSuppliesRouteBySupplier()),
              "SELECT supplier_id, COUNT(order_id) AS total_orders FROM supplies_route GROUP BY supplier_id;\n");
}

TEST_F(QueryProcessorTest, CreateSuppliesRoute) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::createSuppliesRoute("O1", "S1", "T1", "D1", "A1", "Act1")),
              "INSERT INTO supplies_route (order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival) VALUES ('O1', 'S1', 'T1', 'D1', 'A1', 'Act1');\n");
}

TEST_F(QueryProcessorTest, DeleteSuppliesRoute) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::deleteSuppliesRoute("O1", "S1")),
              "DELETE FROM supplies_route WHERE order_id = 'O1' AND supplier_id = 'S1';\n");
}

TEST_F(QueryProcessorTest, AllSuppliesRoute) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllSuppliesRoute()),
              "SELECT order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival FROM supplies_route ORDER BY order_id, supplier_id ASC;\n");
}

TEST_F(QueryProcessorTest, GetSuppliesRoute) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getSuppliesRoute("O1", "S1")),
              "SELECT order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival FROM supplies_route WHERE order_id = 'O1' AND supplier_id = 'S1';\n");
}

TEST_F(QueryProcessorTest, SuppliesRouteByOrder) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getSuppliesRouteByOrder("O1")),
              "SELECT order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival FROM supplies_route WHERE order_id = 'O1' ORDER BY supplier_id ASC;\n");
}

TEST_F(QueryProcessorTest, SuppliesRouteBySupplier) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getSuppliesRouteBySupplier("S1")),
              "SELECT order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival FROM supplies_route WHERE supplier_id = 'S1' ORDER BY order_id ASC;\n");
}

TEST_F(QueryProcessorTest, UpdateSuppliesRoute) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::updateSuppliesRoute("O1", "S1", "T2", "D2", "A2", "Act2")),
              "UPDATE supplies_route SET truck_id = 'T2', estimated_departure = 'D2', estimated_arrival = 'A2', actual_arrival = 'Act2' WHERE order_id = 'O1' AND supplier_id = 'S1';\n");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Truck Cargo query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, CountTruckCargoByProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countTruckCargoByProduct()),
              "SELECT product_id, COUNT(truck_id) AS total_trucks, SUM(quantity) AS total_quantity FROM trucks_cargo GROUP BY product_id;\n");
}

TEST_F(QueryProcessorTest, CountTruckCargoByTruck) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countTruckCargoByTruck()),
              "SELECT truck_id, COUNT(product_id) AS total_products, SUM(quantity) AS total_quantity FROM trucks_cargo GROUP BY truck_id;\n");
}

TEST_F(QueryProcessorTest, CreateTruckCargo) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::createTruckCargo("T1", "P1", "20")),
              "INSERT INTO trucks_cargo (truck_id, product_id, quantity) VALUES ('T1', 'P1', 20);\n");
}

TEST_F(QueryProcessorTest, DeleteTruckCargoProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::deleteTruckCargoProduct("T1", "P1")),
              "DELETE FROM trucks_cargo WHERE truck_id = 'T1' AND product_id = 'P1';\n");
}

TEST_F(QueryProcessorTest, AllTrucksCargo) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllTrucksCargo()),
              "SELECT truck_id, product_id, quantity FROM trucks_cargo ORDER BY truck_id, product_id ASC;\n");
}

TEST_F(QueryProcessorTest, GetTruckCargo) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruckCargo("T1", "P1")),
              "SELECT truck_id, product_id, quantity FROM trucks_cargo WHERE truck_id = 'T1' AND product_id = 'P1';\n");
}

TEST_F(QueryProcessorTest, TruckCargoByProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruckCargoByProduct("P1")),
              "SELECT truck_id, product_id, quantity FROM trucks_cargo WHERE product_id = 'P1' ORDER BY truck_id ASC;\n");
}

TEST_F(QueryProcessorTest, TruckCargoByTruck) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getTruckCargoByTruck("T1")),
              "SELECT truck_id, product_id, quantity FROM trucks_cargo WHERE truck_id = 'T1' ORDER BY product_id ASC;\n");
}

TEST_F(QueryProcessorTest, UpdateTruckCargoQuantity) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::updateTruckCargoQuantity("T1", "P1", "30")),
              "UPDATE trucks_cargo SET quantity = 30 WHERE truck_id = 'T1' AND product_id = 'P1';\n");
}
// ---------------------------------------------------------------------------------------------------------------------

// ? Warehouses Stocks query tests
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(QueryProcessorTest, CountStockByProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countStockByProduct()),
              "SELECT product_id, COUNT(warehouse_id) AS total_warehouses, SUM(quantity) AS total_quantity FROM warehouses_stock GROUP BY product_id;\n");
}

TEST_F(QueryProcessorTest, CountStockByWarehouse) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countStockByWarehouse()),
              "SELECT warehouse_id, COUNT(product_id) AS total_products, SUM(quantity) AS total_quantity FROM warehouses_stock GROUP BY warehouse_id;\n");
}

TEST_F(QueryProcessorTest, CreateWarehouseStock) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::createWarehouseStock("W1", "P1", "100")),
              "INSERT INTO warehouses_stock (warehouse_id, product_id, quantity) VALUES ('W1', 'P1', 100);\n");
}

TEST_F(QueryProcessorTest, DeleteWarehouseStock) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::deleteWarehouseStock("W1", "P1")),
              "DELETE FROM warehouses_stock WHERE warehouse_id = 'W1' AND product_id = 'P1';\n");
}

TEST_F(QueryProcessorTest, AllWarehouseStock) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getAllWarehouseStock()),
              "SELECT warehouse_id, product_id, quantity FROM warehouses_stock ORDER BY warehouse_id, product_id ASC;\n");
}

TEST_F(QueryProcessorTest, StockByProduct) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getStockByProduct("P1")),
              "SELECT warehouse_id, product_id, quantity FROM warehouses_stock WHERE product_id = 'P1' ORDER BY warehouse_id ASC;\n");
}

TEST_F(QueryProcessorTest, StockByWarehouse) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getStockByWarehouse("W1")),
              "SELECT warehouse_id, product_id, quantity FROM warehouses_stock WHERE warehouse_id = 'W1' ORDER BY product_id ASC;\n");
}

TEST_F(QueryProcessorTest, WarehouseProductQuantity) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getWarehouseProductQuantity("W1", "P1")),
              "SELECT warehouse_id, product_id, quantity FROM warehouses_stock WHERE warehouse_id = 'W1' AND product_id = 'P1';\n");
}

TEST_F(QueryProcessorTest, UpdateWarehouseStockQuantity) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::updateWarehouseStockQuantity("W1", "P1", "150")),
              "UPDATE warehouses_stock SET quantity = 150 WHERE warehouse_id = 'W1' AND product_id = 'P1';\n");
}
// ---------------------------------------------------------------------------------------------------------------------

// * Routing Tests on Mock Data
// ---------------------------------------------------------------------------------------------------------------------
struct ExecuteQueryTest : ::testing::Test {
    ExecuteQueryTest() = default;

    void SetUp() override {
        sqlite3_open(":memory:", &App::db);
        char* errMsg = nullptr;
        std::string schema = read_file_content("db/database.sql");
        if (sqlite3_exec(App::db, schema.c_str(), nullptr, nullptr, &errMsg) != SQLITE_OK) {
            std::cerr << "Schema error: " << errMsg << std::endl;
            sqlite3_free(errMsg);
        }
        std::string mockData = read_file_content("db/fill_mock_data.sql");
        if (sqlite3_exec(App::db, mockData.c_str(), nullptr, nullptr, &errMsg) != SQLITE_OK) {
            std::cerr << "Mock data error: " << errMsg << std::endl;
            sqlite3_free(errMsg);
        }
    }

    void TearDown() override {
        sqlite3_close(App::db);
        App::db = nullptr;
    }

    static auto read_file_content(const std::string& path) -> std::string {
        std::ifstream file("../../../" + path);
        std::stringstream buffer;
        buffer << file.rdbuf();
        return buffer.str();
    }
};
// ---------------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------------------------
// ? 1. Users Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, UsersQueries) {
    // GetAllUsers
    QueryProcessor::executeQuery(QueryProcessor::getAllUsers(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 10);
        EXPECT_EQ((*json)[0]["name"].asString(), "Alice Admin");
    });
    // GetUser
    QueryProcessor::executeQuery(QueryProcessor::getUser("USR-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["name"].asString(), "Alice Admin");
    });
    QueryProcessor::executeQuery(QueryProcessor::getUser("NON-EXIST"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 0);
    });
    // GetUsersByRole
    QueryProcessor::executeQuery(QueryProcessor::getUsersByRole("admin"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["id"].asString(), "USR-001");
    });
    QueryProcessor::executeQuery(QueryProcessor::getUsersByRole("client"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 4);
    });
    // GetUserData
    QueryProcessor::executeQuery(QueryProcessor::getUserData("USR-001", "role"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["role"].asString(), "admin");
    });
    QueryProcessor::executeQuery(QueryProcessor::getUserData("USR-002", "name"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["name"].asString(), "Bob Worker");
    });
    // CountUsersByRole
    QueryProcessor::executeQuery(QueryProcessor::countUsersByRole(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
    // CreateUser
    QueryProcessor::executeQuery(QueryProcessor::createUser("USR-NEW", "New User", "pass", "Addr", "client"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getUser("USR-NEW"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 1);
            EXPECT_EQ((*json2)[0]["name"].asString(), "New User");
        });
    });
    // DeleteUser
    QueryProcessor::executeQuery(QueryProcessor::deleteUser("USR-010"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getUser("USR-010"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 0);
        });
    });
    // UpdateUserPassword
    QueryProcessor::executeQuery(QueryProcessor::updateUserPassword("USR-001", "new_admin_pass"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getUserData("USR-001", "password"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            EXPECT_EQ((*json2)[0]["password"].asString(), "new_admin_pass");
        });
    });
    // UpdateUsersData
    QueryProcessor::executeQuery(QueryProcessor::updateUsersData("USR-002", "Bob Updated", "New Addr", "warehouse_worker"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getUser("USR-002"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            EXPECT_EQ((*json2)[0]["name"].asString(), "Bob Updated");
            EXPECT_EQ((*json2)[0]["address"].asString(), "New Addr");
        });
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// ? 2. Trucks Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, TrucksQueries) {
    // GetAllTrucks
    QueryProcessor::executeQuery(QueryProcessor::getAllTrucks(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 4);
    });
    // GetTruck
    QueryProcessor::executeQuery(QueryProcessor::getTruck("TRK-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["model"].asString(), "Volvo FH16");
    });
    QueryProcessor::executeQuery(QueryProcessor::getTruck("NON-EXIST"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 0);
    });
    // GetTrucksBySize
    QueryProcessor::executeQuery(QueryProcessor::getTrucksBySize("13.6x2.5x2.7"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 3);
    });
    QueryProcessor::executeQuery(QueryProcessor::getTrucksBySize("12x2.4x2.5"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    // GetTrucksByModel
    QueryProcessor::executeQuery(QueryProcessor::getTrucksByModel("Scania R500"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    QueryProcessor::executeQuery(QueryProcessor::getTrucksByModel("Volvo FH16"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    // GetTruckData
    QueryProcessor::executeQuery(QueryProcessor::getTruckData("TRK-001", "speed"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["speed"].asString(), "85.0");
    });
    QueryProcessor::executeQuery(QueryProcessor::getTruckData("TRK-002", "is_delivering"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["is_delivering"].asString(), "1");
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// ? 3. Warehouses Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, WarehousesQueries) {
    // GetWarehouse
    QueryProcessor::executeQuery(QueryProcessor::getWarehouse("WH-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["location"].asString(), "New York Central Hub");
    });
    QueryProcessor::executeQuery(QueryProcessor::getWarehouse("WH-999"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 0);
    });
    // GetWarehouseData
    QueryProcessor::executeQuery(QueryProcessor::getWarehouseData("WH-001", "has_refrigeration"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["has_refrigeration"].asString(), "1");
    });
    QueryProcessor::executeQuery(QueryProcessor::getWarehouseData("WH-002", "volume_max"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["volume_max"].asString(), "20000.0");
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// ? 4. Orders Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, OrdersQueries) {
    // GetOrder
    QueryProcessor::executeQuery(QueryProcessor::getOrder("ORD-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["client_id"].asString(), "USR-004");
    });
    QueryProcessor::executeQuery(QueryProcessor::getOrder("ORD-999"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 0);
    });
    // GetOrderData
    QueryProcessor::executeQuery(QueryProcessor::getOrderData("ORD-001", "status"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["status"].asString(), "Pending");
    });
    QueryProcessor::executeQuery(QueryProcessor::getOrderData("ORD-003", "price"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["price"].asString(), "15.0");
    });
    // GetOrdersByFinalDestination
    QueryProcessor::executeQuery(QueryProcessor::getOrdersByFinalDestination("101 Customer Ave, PA"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 2);
    });
    QueryProcessor::executeQuery(QueryProcessor::getOrdersByFinalDestination("202 Buyer Rd, CT"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    // GetOrdersByReceiver
    QueryProcessor::executeQuery(QueryProcessor::getOrdersByReceiver("101 Customer Ave, PA"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 2);
    });
    QueryProcessor::executeQuery(QueryProcessor::getOrdersByReceiver("555 Market St, TX"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    // GetOrdersBySender
    QueryProcessor::executeQuery(QueryProcessor::getOrdersBySender("USR-004"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 2);
    });
    QueryProcessor::executeQuery(QueryProcessor::getOrdersBySender("USR-005"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// ? 5. Products Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, ProductsQueries) {
    // GetProduct
    QueryProcessor::executeQuery(QueryProcessor::getProduct("PROD-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["name"].asString(), "Fresh Milk");
    });
    QueryProcessor::executeQuery(QueryProcessor::getProduct("PROD-002"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["name"].asString(), "Crystal Vase");
    });
    // GetProductData
    QueryProcessor::executeQuery(QueryProcessor::getProductData("PROD-001", "price"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["price"].asString(), "3.5");
    });
    QueryProcessor::executeQuery(QueryProcessor::getProductData("PROD-002", "is_fragile"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["is_fragile"].asString(), "1");
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// ? 6. Suppliers Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, SuppliersQueries) {
    // GetAllSuppliers
    QueryProcessor::executeQuery(QueryProcessor::getAllSuppliers(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 3);
    });
    // GetSupplier
    QueryProcessor::executeQuery(QueryProcessor::getSupplier("SUP-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["name"].asString(), "Global Tech Corp");
    });
    QueryProcessor::executeQuery(QueryProcessor::getSupplier("SUP-002"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["name"].asString(), "Fresh Farms Ltd");
    });
    // GetSuppliersByLocation
    QueryProcessor::executeQuery(QueryProcessor::getSuppliersByLocation("123 Tech Way, San Jose, CA"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    QueryProcessor::executeQuery(QueryProcessor::getSuppliersByLocation("789 Harbor Dr, Miami, FL"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    // GetSupplierData
    QueryProcessor::executeQuery(QueryProcessor::getSupplierData("SUP-001", "location"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["location"].asString(), "123 Tech Way, San Jose, CA");
    });
    QueryProcessor::executeQuery(QueryProcessor::getSupplierData("SUP-002", "name"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["name"].asString(), "Fresh Farms Ltd");
    });
    // CountSuppliersByLocation
    QueryProcessor::executeQuery(QueryProcessor::countSuppliersByLocation(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 3);
    });
    // CreateSupplier
    QueryProcessor::executeQuery(QueryProcessor::createSupplier("SUP-NEW", "New Sup", "Nowhere"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getSupplier("SUP-NEW"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 1);
        });
    });
    // DeleteSupplier
    QueryProcessor::executeQuery(QueryProcessor::deleteSupplier("SUP-003"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getSupplier("SUP-003"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 0);
        });
    });
    // UpdateSupplier
    QueryProcessor::executeQuery(QueryProcessor::updateSupplier("SUP-001", "Tech Updated", "San Jose"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getSupplier("SUP-001"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            EXPECT_EQ((*json2)[0]["name"].asString(), "Tech Updated");
        });
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// ? 7. Freight Costs Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, FreightCostsQueries) {
    // GetAllFreightCosts
    QueryProcessor::executeQuery(QueryProcessor::getAllFreightCosts(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 2);
    });
    // GetFreightCost
    QueryProcessor::executeQuery(QueryProcessor::getFreightCost("ORD-002"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["total_cost"].asString(), "495.0");
    });
    QueryProcessor::executeQuery(QueryProcessor::getFreightCost("ORD-003"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    // GetFreightCostData
    QueryProcessor::executeQuery(QueryProcessor::getFreightCostData("ORD-003", "labor_cost"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["labor_cost"].asString(), "40.0");
    });
    QueryProcessor::executeQuery(QueryProcessor::getFreightCostData("ORD-002", "fuel_cost"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["fuel_cost"].asString(), "150.0");
    });
    // CountFreightCosts
    QueryProcessor::executeQuery(QueryProcessor::countFreightCosts(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["total_freight_costs"].asString(), "2");
    });
    // CreateFreightCost
    QueryProcessor::executeQuery(QueryProcessor::createFreightCost("ORD-001", "10", "20", "5", "35", "2026-03-26"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getFreightCost("ORD-001"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 1);
        });
    });
    // DeleteFreightCost
    QueryProcessor::executeQuery(QueryProcessor::deleteFreightCost("ORD-002"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getFreightCost("ORD-002"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 0);
        });
    });
    // UpdateFreightCost
    QueryProcessor::executeQuery(QueryProcessor::updateFreightCost("ORD-003", "30", "50", "10", "90", "2026-03-27"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getFreightCost("ORD-003"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            EXPECT_EQ((*json2)[0]["total_cost"].asString(), "90.0");
        });
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// ? 8. Online Users Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, OnlineUsersQueries) {
    // GetAllOnlineUsers
    QueryProcessor::executeQuery(QueryProcessor::getAllOnlineUsers(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 3);
    });
    // GetOnlineUser
    QueryProcessor::executeQuery(QueryProcessor::getOnlineUser("SESS-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["name"].asString(), "Alice Admin");
    });
    QueryProcessor::executeQuery(QueryProcessor::getOnlineUser("SESS-002"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["name"].asString(), "Charlie Driver");
    });
    // GetOnlineUsersByRole
    QueryProcessor::executeQuery(QueryProcessor::getOnlineUsersByRole("admin"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    QueryProcessor::executeQuery(QueryProcessor::getOnlineUsersByRole("warehouse_worker"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    // GetOnlineUserData
    QueryProcessor::executeQuery(QueryProcessor::getOnlineUserData("SESS-001", "login_time"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["login_time"].asString(), "2026-03-25 09:00:00");
    });
    QueryProcessor::executeQuery(QueryProcessor::getOnlineUserData("SESS-002", "last_activity"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["last_activity"].asString(), "2026-03-25 11:00:00");
    });
    // CountOnlineUsersByRole
    QueryProcessor::executeQuery(QueryProcessor::countOnlineUsersByRole(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// ? 9. Orders Items Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, OrdersItemsCountByOrder) {
    QueryProcessor::executeQuery(QueryProcessor::countOrderItemsByOrder(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, OrdersItemsCountByProduct) {
    QueryProcessor::executeQuery(QueryProcessor::countOrderItemsByProduct(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, OrdersItemsCreate) {
    QueryProcessor::executeQuery(QueryProcessor::createOrderItem("ORD-003", "PROD-001", "10"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getOrderProductQuantity("ORD-003", "PROD-001"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 1);
            EXPECT_EQ((*json2)[0]["quantity"].asString(), "10");
        });
    });
}

TEST_F(ExecuteQueryTest, OrdersItemsDelete) {
    QueryProcessor::executeQuery(QueryProcessor::deleteOrderItem("ORD-001", "PROD-001"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getOrderProductQuantity("ORD-001", "PROD-001"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 0);
        });
    });
}

TEST_F(ExecuteQueryTest, OrdersItemsGetAll) {
    QueryProcessor::executeQuery(QueryProcessor::getAllOrderItems(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 7);
    });
}

TEST_F(ExecuteQueryTest, OrdersItemsGetByOrder) {
    QueryProcessor::executeQuery(QueryProcessor::getOrderItemsByOrder("ORD-002"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 2);
    });
    QueryProcessor::executeQuery(QueryProcessor::getOrderItemsByOrder("ORD-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 2);
    });
}

TEST_F(ExecuteQueryTest, OrdersItemsGetByProduct) {
    QueryProcessor::executeQuery(QueryProcessor::getOrderItemsByProduct("PROD-004"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 2);
    });
    QueryProcessor::executeQuery(QueryProcessor::getOrderItemsByProduct("PROD-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, OrdersItemsGetQuantity) {
    QueryProcessor::executeQuery(QueryProcessor::getOrderProductQuantity("ORD-002", "PROD-003"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["quantity"].asString(), "1");
    });
    QueryProcessor::executeQuery(QueryProcessor::getOrderProductQuantity("ORD-003", "PROD-004"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["quantity"].asString(), "2");
    });
}

TEST_F(ExecuteQueryTest, OrdersItemsUpdateQuantity) {
    QueryProcessor::executeQuery(QueryProcessor::updateOrderItemQuantity("ORD-002", "PROD-003", "5"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getOrderProductQuantity("ORD-002", "PROD-003"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            EXPECT_EQ((*json2)[0]["quantity"].asString(), "5");
        });
    });
}


// ---------------------------------------------------------------------------------------------------------------------
// ? 10. Supplies Routes Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, SuppliesRoutesCountByOrder) {
    QueryProcessor::executeQuery(QueryProcessor::countSuppliesRouteByOrder(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, SuppliesRoutesCountBySupplier) {
    QueryProcessor::executeQuery(QueryProcessor::countSuppliesRouteBySupplier(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, SuppliesRoutesCreate) {
    QueryProcessor::executeQuery(QueryProcessor::createSuppliesRoute("ORD-002", "SUP-002", "TRK-001", "2026-03-26 08:00:00", "2026-03-26 12:00:00", "2026-03-26 13:00:00"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getSuppliesRoute("ORD-002", "SUP-002"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 1);
        });
    });
}

TEST_F(ExecuteQueryTest, SuppliesRoutesDelete) {
    QueryProcessor::executeQuery(QueryProcessor::deleteSuppliesRoute("ORD-001", "SUP-002"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getSuppliesRoute("ORD-001", "SUP-002"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 0);
        });
    });
}

TEST_F(ExecuteQueryTest, SuppliesRoutesGetAll) {
    QueryProcessor::executeQuery(QueryProcessor::getAllSuppliesRoute(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, SuppliesRoutesGet) {
    QueryProcessor::executeQuery(QueryProcessor::getSuppliesRoute("ORD-004", "SUP-003"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["truck_id"].asString(), "TRK-003");
    });
    QueryProcessor::executeQuery(QueryProcessor::getSuppliesRoute("ORD-001", "SUP-002"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, SuppliesRoutesGetByOrder) {
    QueryProcessor::executeQuery(QueryProcessor::getSuppliesRouteByOrder("ORD-004"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    QueryProcessor::executeQuery(QueryProcessor::getSuppliesRouteByOrder("ORD-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, SuppliesRoutesGetBySupplier) {
    QueryProcessor::executeQuery(QueryProcessor::getSuppliesRouteBySupplier("SUP-003"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    QueryProcessor::executeQuery(QueryProcessor::getSuppliesRouteBySupplier("SUP-002"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, SuppliesRoutesUpdate) {
    QueryProcessor::executeQuery(QueryProcessor::updateSuppliesRoute("ORD-004", "SUP-003", "TRK-001", "2026-03-28", "2026-03-30", "2026-03-31"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getSuppliesRoute("ORD-004", "SUP-003"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            EXPECT_EQ((*json2)[0]["truck_id"].asString(), "TRK-001");
        });
    });
}


// ---------------------------------------------------------------------------------------------------------------------
// ? 11. Truck Cargo Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, TruckCargoCountByProduct) {
    QueryProcessor::executeQuery(QueryProcessor::countTruckCargoByProduct(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, TruckCargoCountByTruck) {
    QueryProcessor::executeQuery(QueryProcessor::countTruckCargoByTruck(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, TruckCargoCreate) {
    QueryProcessor::executeQuery(QueryProcessor::createTruckCargo("TRK-001", "PROD-001", "50"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getTruckCargo("TRK-001", "PROD-001"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 1);
            EXPECT_EQ((*json2)[0]["quantity"].asString(), "50");
        });
    });
}

TEST_F(ExecuteQueryTest, TruckCargoDelete) {
    QueryProcessor::executeQuery(QueryProcessor::deleteTruckCargoProduct("TRK-002", "PROD-002"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getTruckCargo("TRK-002", "PROD-002"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 0);
        });
    });
}

TEST_F(ExecuteQueryTest, TruckCargoGetAll) {
    QueryProcessor::executeQuery(QueryProcessor::getAllTrucksCargo(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, TruckCargoGet) {
    QueryProcessor::executeQuery(QueryProcessor::getTruckCargo("TRK-002", "PROD-003"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
        EXPECT_EQ((*json)[0]["quantity"].asString(), "1");
    });
    QueryProcessor::executeQuery(QueryProcessor::getTruckCargo("TRK-002", "PROD-002"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, TruckCargoGetByProduct) {
    QueryProcessor::executeQuery(QueryProcessor::getTruckCargoByProduct("PROD-003"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    QueryProcessor::executeQuery(QueryProcessor::getTruckCargoByProduct("PROD-002"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, TruckCargoGetByTruck) {
    QueryProcessor::executeQuery(QueryProcessor::getTruckCargoByTruck("TRK-002"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 2);
    });
}

TEST_F(ExecuteQueryTest, TruckCargoGetByTruckEmpty) {
    QueryProcessor::executeQuery(QueryProcessor::getTruckCargoByTruck("TRK-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 0);
    });
}

TEST_F(ExecuteQueryTest, TruckCargoUpdateQuantity) {
    QueryProcessor::executeQuery(QueryProcessor::updateTruckCargoQuantity("TRK-002", "PROD-003", "10"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getTruckCargo("TRK-002", "PROD-003"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            EXPECT_EQ((*json2)[0]["quantity"].asString(), "10");
        });
    });
}


// ---------------------------------------------------------------------------------------------------------------------
// ? 12. Warehouses Stocks Queries
// ---------------------------------------------------------------------------------------------------------------------
TEST_F(ExecuteQueryTest, WarehousesStocksCountByProduct) {
    QueryProcessor::executeQuery(QueryProcessor::countStockByProduct(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, WarehousesStocksCountByWarehouse) {
    QueryProcessor::executeQuery(QueryProcessor::countStockByWarehouse(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, WarehousesStocksCreate) {
    QueryProcessor::executeQuery(QueryProcessor::createWarehouseStock("WH-001", "PROD-002", "15"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getWarehouseProductQuantity("WH-001", "PROD-002"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 1);
            EXPECT_EQ((*json2)[0]["quantity"].asString(), "15");
        });
    });
}

TEST_F(ExecuteQueryTest, WarehousesStocksDelete) {
    QueryProcessor::executeQuery(QueryProcessor::deleteWarehouseStock("WH-001", "PROD-005"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getWarehouseProductQuantity("WH-001", "PROD-005"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            ASSERT_EQ(json2->size(), 0);
        });
    });
}

TEST_F(ExecuteQueryTest, WarehousesStocksGetAll) {
    QueryProcessor::executeQuery(QueryProcessor::getAllWarehouseStock(), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_GE(json->size(), 5);
    });
}

TEST_F(ExecuteQueryTest, WarehousesStocksGetByProduct) {
    QueryProcessor::executeQuery(QueryProcessor::getStockByProduct("PROD-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
    QueryProcessor::executeQuery(QueryProcessor::getStockByProduct("PROD-005"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 1);
    });
}

TEST_F(ExecuteQueryTest, WarehousesStocksGetByWarehouse) {
    QueryProcessor::executeQuery(QueryProcessor::getStockByWarehouse("WH-003"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 2);
    });
    QueryProcessor::executeQuery(QueryProcessor::getStockByWarehouse("WH-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        ASSERT_EQ(json->size(), 2);
    });
}

TEST_F(ExecuteQueryTest, WarehousesStocksGetQuantity) {
    QueryProcessor::executeQuery(QueryProcessor::getWarehouseProductQuantity("WH-001", "PROD-001"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["quantity"].asString(), "100");
    });
    QueryProcessor::executeQuery(QueryProcessor::getWarehouseProductQuantity("WH-003", "PROD-008"), [](const drogon::HttpResponsePtr& resp) {
        auto json = resp->getJsonObject();
        ASSERT_NE(json, nullptr);
        EXPECT_EQ((*json)[0]["quantity"].asString(), "50");
    });
}

TEST_F(ExecuteQueryTest, WarehousesStocksUpdateQuantity) {
    QueryProcessor::executeQuery(QueryProcessor::updateWarehouseStockQuantity("WH-001", "PROD-001", "200"), [](const drogon::HttpResponsePtr& resp) {
        QueryProcessor::executeQuery(QueryProcessor::getWarehouseProductQuantity("WH-001", "PROD-001"), [](const drogon::HttpResponsePtr& resp2) {
            auto json2 = resp2->getJsonObject();
            ASSERT_NE(json2, nullptr);
            EXPECT_EQ((*json2)[0]["quantity"].asString(), "200");
        });
    });
}

