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
    EXPECT_EQ(qp.getQuery(QueryProcessor::getUser("other")),
              "SELECT id, name, address, role FROM users WHERE id = 'other';\n");
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
              "SELECT id, name, role, address FROM users ORDER BY name ASC;\n");
}

TEST_F(QueryProcessorTest, SingleOnlineUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOnlineUser("SID1")),
              "SELECT id, name, role, address FROM users WHERE id = 'SID1';\n");
}

TEST_F(QueryProcessorTest, OnlineUsersByRole) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOnlineUsersByRole("admin")),
              "SELECT id, name, role, address FROM users WHERE role = 'admin' ORDER BY name ASC;\n");
}

TEST_F(QueryProcessorTest, DataFromAnOnlineUser) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::getOnlineUserData("SID1", "login_time")),
              "SELECT login_time FROM online_users WHERE session_id = 'SID1';");
}

TEST_F(QueryProcessorTest, CountOnlineUsersByRole) {
    EXPECT_EQ(qp.getQuery(QueryProcessor::countOnlineUsersByRole()),
              "SELECT role, COUNT(*) AS total_users FROM users GROUP BY role;\n");
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
    EXPECT_EQ(qp.getQuery(QueryProcessor::createSuppliesRoute("O1", "S1", "T1", "D", "A", "Act")),
              "INSERT INTO supplies_route (order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival) VALUES ('O1', 'S1', 'T1', 'D', 'A', 'Act');\n");
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
// * -------------------------------------------------------------------------------------------------------------------

// * Routing Tests on Mock Data
// TODO: this, well, checking JSON could give a little trouble
