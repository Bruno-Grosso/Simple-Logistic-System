-- Get all trucks
SELECT * FROM trucks;

-- Get truck by ID
SELECT * FROM trucks WHERE id = $1;

-- Get trucks by model ID
SELECT * FROM trucks WHERE model_id = $1;
