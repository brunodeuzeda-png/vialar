CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SINDICO', 'MORADOR', 'PRESTADOR');

CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  administradora_id   UUID REFERENCES administradoras(id),
  condominium_id      UUID REFERENCES condominiums(id),
  name                VARCHAR(255) NOT NULL,
  email               VARCHAR(255) UNIQUE NOT NULL,
  phone               VARCHAR(20),
  whatsapp_number     VARCHAR(20),
  password_hash       VARCHAR(255) NOT NULL,
  role                user_role NOT NULL DEFAULT 'MORADOR',
  unit_id             UUID,
  avatar_url          TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at       TIMESTAMPTZ,
  refresh_token_hash  VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_condominium ON users(condominium_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_whatsapp ON users(whatsapp_number);
