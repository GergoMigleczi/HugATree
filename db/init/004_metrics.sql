ALTER TABLE tree_detail_history
ADD COLUMN IF NOT EXISTS estimated_co2_stored_kg DECIMAL(12,2) NULL,
ADD COLUMN IF NOT EXISTS estimated_co2_sequestered_year_kg DECIMAL(12,2) NULL,
ADD COLUMN IF NOT EXISTS estimated_water_use_year_l DECIMAL(14,2) NULL,
ADD COLUMN IF NOT EXISTS weather_period_start DATE NULL,
ADD COLUMN IF NOT EXISTS weather_period_end DATE NULL,
ADD COLUMN IF NOT EXISTS weather_source VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS calculation_method_version VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMPTZ NULL;