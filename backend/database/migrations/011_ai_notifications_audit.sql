CREATE TABLE ai_interactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id    UUID REFERENCES condominiums(id),
  user_id           UUID REFERENCES users(id),
  demand_id         UUID REFERENCES demands(id),
  interaction_type  VARCHAR(100) NOT NULL,
  prompt_tokens     INTEGER,
  completion_tokens INTEGER,
  model_used        VARCHAR(100),
  input_preview     TEXT,
  output_preview    TEXT,
  metadata          JSONB,
  duration_ms       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_condo ON ai_interactions(condominium_id, created_at DESC);

CREATE TABLE notifications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id),
  user_id        UUID REFERENCES users(id),
  type           VARCHAR(100) NOT NULL,
  title          VARCHAR(255) NOT NULL,
  body           TEXT,
  channel        VARCHAR(50) NOT NULL DEFAULT 'APP',
  is_read        BOOLEAN DEFAULT FALSE,
  read_at        TIMESTAMPTZ,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

CREATE TABLE audit_log (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID REFERENCES condominiums(id),
  user_id        UUID REFERENCES users(id),
  action         VARCHAR(100) NOT NULL,
  entity_type    VARCHAR(100),
  entity_id      UUID,
  old_data       JSONB,
  new_data       JSONB,
  ip_address     INET,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_condominium ON audit_log(condominium_id, created_at DESC);
