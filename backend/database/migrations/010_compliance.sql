CREATE TYPE obligation_frequency AS ENUM ('UNICA', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'BIENAL', 'QUINQUENAL');

CREATE TABLE compliance_obligation_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  legal_basis TEXT,
  category    VARCHAR(100),
  frequency   obligation_frequency NOT NULL,
  alert_days  INTEGER[] NOT NULL DEFAULT '{90,30,7}',
  is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE compliance_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id  UUID NOT NULL REFERENCES condominiums(id),
  template_id     UUID NOT NULL REFERENCES compliance_obligation_templates(id),
  due_date        DATE NOT NULL,
  completed_date  DATE,
  status          VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
  document_url    TEXT,
  notes           TEXT,
  provider_id     UUID REFERENCES providers(id),
  cost            DECIMAL(12,2),
  created_by_id   UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_records_due ON compliance_records(condominium_id, due_date);
CREATE INDEX idx_compliance_records_status ON compliance_records(condominium_id, status);
