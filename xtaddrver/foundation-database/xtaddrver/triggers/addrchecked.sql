CREATE OR REPLACE FUNCTION xtaddrver._addrcheckedBeforeUpsertTrigger()
  RETURNS TRIGGER AS
$$
-- Copyright (c) 1999-2019 by OpenMFG LLC, d/b/a xTuple.
-- See www.xtuple.com/CPAL for the full text of the software license.
BEGIN
  NEW.addrchecked_username := getEffectiveXtUser();
  IF TG_OP = 'INSERT' THEN
    NEW.addrchecked_created := CURRENT_TIMESTAMP;
  ELSE
    NEW.addrchecked_created := OLD.created;
  END IF;
  NEW.addrchecked_lastupdated := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS addrCheckedBeforeUpsertTrigger ON xtaddrver.addrchecked;
CREATE TRIGGER addrCheckedBeforeUpsertTrigger BEFORE INSERT OR DELETE
  ON xtaddrver.addrchecked
  FOR EACH ROW EXECUTE PROCEDURE _addrCheckedBeforeUpsertTrigger();

