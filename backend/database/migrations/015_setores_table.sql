CREATE TABLE IF NOT EXISTS setores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  administradora_id UUID    NOT NULL REFERENCES administradoras(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  icon          VARCHAR(10)  NOT NULL DEFAULT '📋',
  color         VARCHAR(7)   NOT NULL DEFAULT '#6B7280',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(administradora_id, name)
);

CREATE INDEX IF NOT EXISTS idx_setores_administradora ON setores(administradora_id);

-- Seed default sectors for all existing administradoras
INSERT INTO setores (administradora_id, name, icon, color)
SELECT a.id, s.name, s.icon, s.color
FROM administradoras a
CROSS JOIN (VALUES
  ('Manutenção',       '🔧', '#F59E0B'),
  ('Financeiro',       '💰', '#3B82F6'),
  ('Jurídico',         '⚖️', '#8B5CF6'),
  ('Atendimento',      '🎧', '#EC4899'),
  ('Obras e Reformas', '🏗️', '#EA580C'),
  ('Segurança',        '🔒', '#DC2626'),
  ('Administrativo',   '📋', '#0891B2'),
  ('TI',               '💻', '#7C3AED')
) AS s(name, icon, color)
ON CONFLICT (administradora_id, name) DO NOTHING;
