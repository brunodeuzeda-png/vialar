-- Adiciona papel de funcionário da administradora
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'FUNCIONARIO';

-- Campos de setor e função para funcionários
ALTER TABLE users ADD COLUMN IF NOT EXISTS setor    VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS funcao   VARCHAR(150);

-- Dados do síndico no condomínio
ALTER TABLE condominiums ADD COLUMN IF NOT EXISTS sindico_name      VARCHAR(255);
ALTER TABLE condominiums ADD COLUMN IF NOT EXISTS sindico_phone     VARCHAR(20);
ALTER TABLE condominiums ADD COLUMN IF NOT EXISTS sindico_whatsapp  VARCHAR(20);
ALTER TABLE condominiums ADD COLUMN IF NOT EXISTS sindico_email     VARCHAR(255);

-- Roteamento de demanda por setor
ALTER TABLE demands ADD COLUMN IF NOT EXISTS assigned_setor  VARCHAR(100);
ALTER TABLE demands ADD COLUMN IF NOT EXISTS routing_data    JSONB;

CREATE INDEX IF NOT EXISTS idx_users_setor ON users(administradora_id, setor);
CREATE INDEX IF NOT EXISTS idx_demands_setor ON demands(condominium_id, assigned_setor);
