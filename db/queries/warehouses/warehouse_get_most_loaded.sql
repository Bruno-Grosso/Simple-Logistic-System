SELECT *, (volume_current * 1.0 / volume_max) AS usage_ratio FROM warehouses ORDER BY usage_ratio DESC;
