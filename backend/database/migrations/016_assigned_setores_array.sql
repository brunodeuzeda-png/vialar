-- Add assigned_setores array column (multi-sector routing)
ALTER TABLE demands ADD COLUMN IF NOT EXISTS assigned_setores TEXT[] DEFAULT '{}';

-- Migrate existing assigned_setor values into the array
UPDATE demands
  SET assigned_setores = ARRAY[assigned_setor]
  WHERE assigned_setor IS NOT NULL AND (assigned_setores IS NULL OR assigned_setores = '{}');

CREATE INDEX IF NOT EXISTS idx_demands_setores ON demands USING GIN(assigned_setores);
