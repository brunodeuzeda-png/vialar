CREATE TABLE units (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id),
  identifier     VARCHAR(20) NOT NULL,
  block          VARCHAR(50),
  floor          INTEGER,
  type           VARCHAR(50) DEFAULT 'apartamento',
  area_sqm       DECIMAL(8,2),
  is_rented      BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(condominium_id, identifier)
);

ALTER TABLE users ADD CONSTRAINT fk_users_unit FOREIGN KEY (unit_id) REFERENCES units(id);

CREATE INDEX idx_units_condominium ON units(condominium_id);
