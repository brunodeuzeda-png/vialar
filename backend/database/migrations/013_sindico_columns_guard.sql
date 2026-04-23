-- Garante que as colunas do síndico e roteamento existem (idempotente)
ALTER TABLE condominiums ADD COLUMN IF NOT EXISTS sindico_name     VARCHAR(255);
ALTER TABLE condominiums ADD COLUMN IF NOT EXISTS sindico_phone    VARCHAR(20);
ALTER TABLE condominiums ADD COLUMN IF NOT EXISTS sindico_whatsapp VARCHAR(20);
ALTER TABLE condominiums ADD COLUMN IF NOT EXISTS sindico_email    VARCHAR(255);

ALTER TABLE demands ADD COLUMN IF NOT EXISTS assigned_setor VARCHAR(100);
ALTER TABLE demands ADD COLUMN IF NOT EXISTS routing_data   JSONB;

ALTER TABLE users ADD COLUMN IF NOT EXISTS setor  VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS funcao VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_users_setor    ON users(administradora_id, setor);
CREATE INDEX IF NOT EXISTS idx_demands_setor  ON demands(condominium_id, assigned_setor);
CREATE INDEX IF NOT EXISTS idx_condominiums_adm ON condominiums(administradora_id);
