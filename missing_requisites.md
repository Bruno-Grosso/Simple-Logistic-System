# List of missing things to do
- [x] Parking on warehouses: warehouses have a certain amount of trucks they
can fit, it should be checked when the route for the order is created / changed.
The information should be displayed in the warehouses.
- [x] Gas prices and delivery cost. The distance is calculated in the database,
each warehouse should have an average gas price, and each driver a wage. The
delivery cost should be calculated considering the wage of the worker and the
average gas price in the warehouses they will go though.
- [ ] Order ETA. Considering a minimum (smallest reasonalbe speed) and a maximum
speed the truck can go at + stop time (a driver can drive a max of 8 hours a day
), calculate the ETA and display in the order.
- [ ] Reports. Include the dilivery cost in the report.
- [ ] General improvements. Recheck especially the reports page, provide more
information and graphs.
- [ ] More tests. Full user simulation in cypress, more tests in the back end.
- [ ] Documentation. Create a docs directory with full documentation on how the
project works (user interaction flow, back end structure, docker structure, 
database UML and docs, etc.)

