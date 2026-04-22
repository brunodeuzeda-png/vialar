CREATE TABLE financial_accounts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id),
  name           VARCHAR(255) NOT NULL,
  type           VARCHAR(50) NOT NULL DEFAULT 'CORRENTE',
  bank_name      VARCHAR(100),
  agency         VARCHAR(20),
  account_number VARCHAR(30),
  balance        DECIMAL(14,2) NOT NULL DEFAULT 0,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE entry_type AS ENUM ('RECEITA', 'DESPESA');

CREATE TABLE financial_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id  UUID NOT NULL REFERENCES condominiums(id),
  account_id      UUID NOT NULL REFERENCES financial_accounts(id),
  demand_id       UUID REFERENCES demands(id),
  quote_id        UUID REFERENCES quotes(id),
  type            entry_type NOT NULL,
  category        VARCHAR(100),
  description     VARCHAR(500) NOT NULL,
  amount          DECIMAL(14,2) NOT NULL,
  competence_date DATE NOT NULL,
  payment_date    DATE,
  is_paid         BOOLEAN DEFAULT FALSE,
  receipt_url     TEXT,
  created_by_id   UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_entries_condo ON financial_entries(condominium_id, competence_date);
CREATE INDEX idx_financial_entries_unpaid ON financial_entries(condominium_id, is_paid) WHERE is_paid = FALSE;
