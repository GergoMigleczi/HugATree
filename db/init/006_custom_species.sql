-- 006_custom_species.sql
-- Adds a free-text custom_species_name column to trees so users can record
-- a species that is not yet in the species table.

BEGIN;

ALTER TABLE trees
  ADD COLUMN IF NOT EXISTS custom_species_name VARCHAR;

COMMIT;
