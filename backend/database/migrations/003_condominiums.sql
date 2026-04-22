CREATE TABLE condominiums (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  administradora_id UUID NOT NULL REFERENCES administradoras(id),
  name              VARCHAR(255) NOT NULL,
  cnpj              VARCHAR(18),
  address           TEXT,
  city              VARCHAR(100),
  state             CHAR(2),
  zip_code          VARCHAR(10),
  total_units       INTEGER NOT NULL DEFAULT 0,
  whatsapp_number   VARCHAR(20),
  settings          JSONB NOT NULL DEFAULT '{}',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_condominiums_administradora ON condominiums(administradora_id);
