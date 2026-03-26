SELECT *, (volume_max - volume_current) AS free_volume FROM warehouses ORDER BY free_volume DESC;
