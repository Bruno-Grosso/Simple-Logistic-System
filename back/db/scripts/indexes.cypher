CREATE INDEX FOR (o:Order) ON (o.status);
CREATE INDEX FOR (t:Truck) ON (t.is_delivering);
CREATE INDEX FOR (t:Truck) ON (t.is_valid);
CREATE INDEX FOR (o:Order) ON (o.supplier_delivered);
