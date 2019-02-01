

--The api role will be the owner of the majority of the functions within the api schema. Each of
--these functions will be executed with "security definer" meaning the functions will run using the
--privileges of the api role.

DROP ROLE IF EXISTS API_ROLE;
DROP ROLE IF EXISTS OWNER_ROLE;
DROP ROLE IF EXISTS ADAPTER_ROLE;
DROP ROLE IF EXISTS TALLY_ROLE;

CREATE ROLE API_ROLE;
CREATE ROLE OWNER_ROLE;
CREATE ROLE ADAPTER_ROLE;
CREATE ROLE TALLY_ROLE;

----------------------------------------------------
-- ADMIN SCHEMA
----------------------------------------------------

-- API
--The api role needs the ability to lookup objects within the admin schema.
GRANT USAGE ON SCHEMA admin TO API_ROLE;

--The api role needs the ability to execute the admin.analyze_db function.
--This will be called in the api.prepare() function.
GRANT EXECUTE ON FUNCTION admin.analyze_db
() to API_ROLE;

--The api role needs the ability to execute the admin.verify_trusted function.
--This will be called before a change is applied within the api.change() function
GRANT EXECUTE ON FUNCTION admin.verify_trusted
(text, text) to API_ROLE;

ALTER TABLE admin.trusted_keys OWNER TO OWNER_ROLE;
ALTER FUNCTION admin.analyze_db() OWNER TO OWNER_ROLE;
ALTER FUNCTION admin.verify_trusted(text, text) OWNER TO OWNER_ROLE;
ALTER SCHEMA admin OWNER TO OWNER_ROLE;

----------------------------------------------------
-- API SCHEMA
----------------------------------------------------

-- Tally
--The tally role needs the ability to lookup objects within the api schema.
GRANT USAGE ON SCHEMA api TO TALLY_ROLE;

--The tally role needs the ability to execute all functions within the api schema.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA api TO TALLY_ROLE;

-- Adapter
--The adapter role needs the ability to lookup objects within the api schema.
GRANT USAGE ON SCHEMA api TO ADAPTER_ROLE;

--The adapter role needs the ability to execute the logImport function within the api schema.
GRANT EXECUTE ON FUNCTION api.logImport
() to ADAPTER_ROLE;

-- Object Ownership

ALTER FUNCTION api.aggregate(text, text, text, date)
  OWNER TO API_ROLE;

ALTER FUNCTION api.change(bigint, text, text)
  OWNER TO API_ROLE;

ALTER FUNCTION api.logImport()
  OWNER TO OWNER_ROLE;

ALTER FUNCTION api.reset()
  OWNER TO OWNER_ROLE;

ALTER FUNCTION api.version()
  OWNER TO API_ROLE;

ALTER SCHEMA api OWNER TO API_ROLE;

----------------------------------------------------
-- AUDIT SCHEMA
----------------------------------------------------

-- API

--The api role needs the ability to lookup objects within audit schema.
GRANT USAGE ON SCHEMA audit TO API_ROLE;

--The api role needs the ability to selects rows from the audit.change_log table.
--This will be used used to determine the last change using the api.version() function.
GRANT SELECT ON audit.change_log TO API_ROLE;

--The api role needs the ability to insert rows into the audit.change_log table.
--This will be used to create a log entry everytime the api.change() function is called.
GRANT INSERT ON audit.change_log TO API_ROLE;
GRANT USAGE, SELECT ON audit.change_log_id_seq to API_ROLE;

--The api role needs the ability to insert rows into the audit.aggregate_log table.
--This will be used to create an audit log everytime the api.aggregate() function is called.
GRANT INSERT ON audit.aggregate_log TO API_ROLE;
GRANT USAGE, SELECT ON audit.aggregate_log_id_seq to API_ROLE;

ALTER TABLE audit.aggregate_log OWNER TO OWNER_ROLE;
ALTER TABLE audit.change_log OWNER TO OWNER_ROLE;
ALTER TABLE audit.import_log OWNER TO OWNER_ROLE;
ALTER SCHEMA audit OWNER TO OWNER_ROLE;

----------------------------------------------------
-- UNIVERSAL SCHEMA
----------------------------------------------------

-- Adapter
/* DO WE NEED THIS AS OWNER???
  GRANT USAGE ON SCHEMA universal to ADAPTER_ROLE;

  --The adapter role needs the ability use sequences to generate keys.
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA universal TO ADAPTER_ROLE;

  --The adapter role needs the ability to truncate, insert, update, delete etc all data in the
  --universal schema.
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA universal TO ADAPTER_ROLE;
*/
-- API
--The api role needs the ability to lookup objects in the universal schema.
GRANT USAGE ON SCHEMA universal TO API_ROLE;

--The api role needs the ability to select all data from the universal schema.
--This will be used within indicator/concept functions to actually query clinical data.
GRANT SELECT ON ALL TABLES IN SCHEMA universal TO API_ROLE;


ALTER TABLE universal.attribute OWNER TO ADAPTER_ROLE;
ALTER TABLE universal.clinic OWNER TO ADAPTER_ROLE;
ALTER TABLE universal.entry_attribute OWNER TO ADAPTER_ROLE;
ALTER TABLE universal.entry OWNER TO ADAPTER_ROLE;
ALTER TABLE universal.patient_practitioner OWNER TO ADAPTER_ROLE;
ALTER TABLE universal.patient OWNER TO ADAPTER_ROLE;
ALTER TABLE universal.practitioner OWNER TO ADAPTER_ROLE;
ALTER TABLE universal.state OWNER TO ADAPTER_ROLE;

ALTER SCHEMA universal OWNER TO ADAPTER_ROLE;
----------------------------------------------------
-- CONCEPT & INDICATOR SCHEMAS
----------------------------------------------------

ALTER SCHEMA concept OWNER TO API_ROLE;
ALTER SCHEMA indicator OWNER TO API_ROLE;

----------------------------------------------------
-- DATABASE LEVEL PERMISSIONS
----------------------------------------------------

--The api role needs the ability to (re)create it's own schemas (eg concept & indicator)
GRANT CREATE ON DATABASE DATABASE_NAME to API_ROLE;

--The adapter role needs the ability to (re)create it's own schemas (eg universal).
GRANT CREATE ON DATABASE DATABASE_NAME to ADAPTER_ROLE;

-- These need to be done at the end of the script, otherwise the user running this permission
-- will not have the required permissions to run the above scripts.

ALTER DATABASE DATABASE_NAME OWNER TO OWNER_ROLE;
