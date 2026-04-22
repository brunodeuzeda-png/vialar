CREATE TABLE providers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  administradora_id UUID REFERENCES administradoras(id),
  condominium_id    UUID REFERENCES condominiums(id),
  name              VARCHAR(255) NOT NULL,
  cnpj              VARCHAR(18),
  cpf               VARCHAR(14),
  email             VARCHAR(255),
  phone             VARCHAR(20),
  whatsapp          VARCHAR(20),
  specialties       TEXT[] DEFAULT '{}',
  rating_avg        DECIMAL(3,2) DEFAULT 0,
  rating_count      INTEGER DEFAULT 0,
  notes             TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE provider_ratings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id),
  demand_id   UUID REFERENCES demands(id),
  rated_by_id UUID NOT NULL REFERENCES users(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE quote_status AS ENUM ('PENDENTE', 'ENVIADO', 'RECEBIDO', 'APROVADO', 'REJEITADO');

CREATE TABLE quotes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demand_id       UUID NOT NULL REFERENCES demands(id),
  provider_id     UUID NOT NULL REFERENCES providers(id),
  condominium_id  UUID NOT NULL REFERENCES condominiums(id),
  status          quote_status NOT NULL DEFAULT 'PENDENTE',
  amount          DECIMAL(12,2),
  description     TEXT,
  validity_date   DATE,
  attachments     JSONB DEFAULT '[]',
  notes           TEXT,
  approved_at     TIMESTAMPTZ,
  approved_by_id  UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotes_demand ON quotes(demand_id);
CREATE INDEX idx_quotes_provider ON quotes(provider_id);
