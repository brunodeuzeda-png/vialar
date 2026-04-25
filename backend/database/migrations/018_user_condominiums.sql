CREATE TABLE IF NOT EXISTS user_condominiums (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, condominium_id)
);

CREATE INDEX IF NOT EXISTS idx_user_condominiums_user ON user_condominiums(user_id);
CREATE INDEX IF NOT EXISTS idx_user_condominiums_condo ON user_condominiums(condominium_id);

-- Migrate existing single-condo assignments
INSERT INTO user_condominiums (user_id, condominium_id)
SELECT id, condominium_id FROM users WHERE condominium_id IS NOT NULL
ON CONFLICT DO NOTHING;
