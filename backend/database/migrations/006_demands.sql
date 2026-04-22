CREATE TYPE demand_status AS ENUM (
  'ABERTA', 'TRIAGEM', 'EM_ANDAMENTO', 'AGUARDANDO_ORCAMENTO',
  'AGUARDANDO_APROVACAO', 'AGENDADA', 'CONCLUIDA', 'CANCELADA'
);
CREATE TYPE demand_priority AS ENUM ('CRITICA', 'ALTA', 'MEDIA', 'BAIXA');
CREATE TYPE demand_category AS ENUM (
  'MANUTENCAO', 'LIMPEZA', 'SEGURANCA', 'FINANCEIRO',
  'BARULHO', 'INFRAESTRUTURA', 'ADMINISTRATIVO', 'OUTRO'
);
CREATE TYPE demand_origin AS ENUM ('WHATSAPP', 'APP', 'PORTAL', 'TELEFONE', 'PRESENCIAL');

CREATE TABLE demands (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id   UUID NOT NULL REFERENCES condominiums(id),
  requester_id     UUID NOT NULL REFERENCES users(id),
  assigned_to_id   UUID REFERENCES users(id),
  unit_id          UUID REFERENCES units(id),
  title            VARCHAR(255) NOT NULL,
  description      TEXT NOT NULL,
  status           demand_status NOT NULL DEFAULT 'ABERTA',
  priority         demand_priority NOT NULL DEFAULT 'MEDIA',
  category         demand_category NOT NULL DEFAULT 'OUTRO',
  origin           demand_origin NOT NULL DEFAULT 'PORTAL',
  ai_triage_data   JSONB,
  ai_summary       TEXT,
  attachments      JSONB DEFAULT '[]',
  internal_notes   TEXT,
  resolved_at      TIMESTAMPTZ,
  due_date         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demands_condominium ON demands(condominium_id);
CREATE INDEX idx_demands_status ON demands(condominium_id, status);
CREATE INDEX idx_demands_priority ON demands(condominium_id, priority);
CREATE INDEX idx_demands_created ON demands(condominium_id, created_at DESC);

CREATE TYPE update_type AS ENUM ('STATUS_CHANGE', 'COMMENT', 'ASSIGNMENT', 'ATTACHMENT', 'AI_NOTE');

CREATE TABLE demand_updates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demand_id  UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id),
  type       update_type NOT NULL DEFAULT 'COMMENT',
  content    TEXT NOT NULL,
  old_value  VARCHAR(100),
  new_value  VARCHAR(100),
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demand_updates_demand ON demand_updates(demand_id);
