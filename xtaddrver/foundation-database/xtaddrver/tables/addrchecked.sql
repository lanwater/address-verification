SELECT xt.create_table('addrchecked', 'xtaddrver');

ALTER TABLE xtaddrver.addrchecked DISABLE TRIGGER ALL;

SELECT
  xt.add_column('addrchecked', 'addrchecked_id',          'SERIAL',  'NOT NULL', 'xtaddrver'),
  xt.add_column('addrchecked', 'addrchecked_addr_id',     'INTEGER', 'NOT NULL', 'xtaddrver'),
  xt.add_column('addrchecked', 'addrchecked_hash',        'BYTEA',   'NOT NULL', 'xtaddrver'),
  xt.add_column('addrchecked', 'addrchecked_service',     'TEXT',    'NOT NULL', 'xtaddrver'),
  xt.add_column('addrchecked', 'addrchecked_username',    'TEXT',    'NOT NULL', 'xtaddrver'),
  xt.add_column('addrchecked', 'addrchecked_created',     'TIMESTAMP WITH TIME ZONE', 'NOT NULL', 'xtaddrver'),
  xt.add_column('addrchecked', 'addrchecked_lastupdated', 'TIMESTAMP WITH TIME ZONE', 'NOT NULL', 'xtaddrver');

ALTER TABLE xtaddrver.addrchecked ENABLE TRIGGER ALL;

SELECT
  xt.add_constraint('addrchecked', 'addrchecked_pkey', 'PRIMARY KEY (addrchecked_id)', 'xtaddrver'),
  xt.add_constraint('addrchecked', 'addrchecked_addrchecked_addr_id_fkey',
                    'FOREIGN KEY (addrchecked_addr_id) REFERENCES addr(addr_id) ON DELETE CASCADE',
                    'xtaddrver');

COMMENT ON TABLE xtaddrver.addrchecked IS 'Remember when an address was last checked with a validation service.';
COMMENT ON COLUMN xtaddrver.addrchecked.addrchecked_addr_id IS 'Internal ID of the public.addr record that was checked.';
COMMENT ON COLUMN xtaddrver.addrchecked.addrchecked_hash    IS 'Cryptographic hash of the public.addr record that was checked.';
COMMENT ON COLUMN xtaddrver.addrchecked.addrchecked_service IS 'Internal name of the address validation service used to check this addr.';
