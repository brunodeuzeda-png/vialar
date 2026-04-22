CREATE TABLE whatsapp_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL UNIQUE REFERENCES condominiums(id),
  session_data   TEXT,
  status         VARCHAR(50) NOT NULL DEFAULT 'DISCONNECTED',
  phone_number   VARCHAR(20),
  last_seen_at   TIMESTAMPTZ,
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE whatsapp_messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id),
  demand_id      UUID REFERENCES demands(id),
  wa_message_id  VARCHAR(255),
  direction      VARCHAR(10) NOT NULL,
  from_number    VARCHAR(20),
  to_number      VARCHAR(20),
  message_type   VARCHAR(50) DEFAULT 'text',
  content        TEXT,
  media_url      TEXT,
  is_processed   BOOLEAN DEFAULT FALSE,
  processed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wa_messages_condominium ON whatsapp_messages(condominium_id);
CREATE INDEX idx_wa_messages_from ON whatsapp_messages(from_number, condominium_id);
CREATE INDEX idx_wa_unprocessed ON whatsapp_messages(condominium_id, is_processed) WHERE is_processed = FALSE;
