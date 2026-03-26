SELECT * FROM warehouses WHERE has_refrigeration = 1 AND (volume_max - volume_current) >= ?;
