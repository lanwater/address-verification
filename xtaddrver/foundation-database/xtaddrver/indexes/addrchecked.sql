CREATE UNIQUE INDEX IF NOT EXISTS addrchecked_addrchecked_addr_id_idx ON xtaddrver.addrchecked (addrchecked_addr_id);
-- the addrchecked_hash index cannot be unique because the addr table is not perfectly normalized
CREATE        INDEX IF NOT EXISTS addrchecked_addrchecked_hash_idx ON xtaddrver.addrchecked (addrchecked_hash);
