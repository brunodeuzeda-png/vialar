CREATE TABLE administradoras (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  cnpj          VARCHAR(18) UNIQUE,
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  plan          VARCHAR(50) NOT NULL DEFAULT 'basic',
  plan_limits   JSONB NOT NULL DEFAULT '{"condominiums": 3, "users": 50, "ai_calls_month": 500}',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
