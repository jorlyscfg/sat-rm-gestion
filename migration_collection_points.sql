-- ========================================
-- Migration: collection_points
-- Puntos de acopio por organización
-- ========================================

-- Table: collection_points
CREATE TABLE IF NOT EXISTS collection_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  work_area JSONB NOT NULL DEFAULT '[]',
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  capacity_m3 DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collection_points_organization_id ON collection_points(organization_id);
CREATE INDEX IF NOT EXISTS idx_collection_points_is_active ON collection_points(is_active);

-- Auto updated_at trigger
DROP TRIGGER IF EXISTS collection_points_updated_at ON collection_points;
CREATE TRIGGER collection_points_updated_at
  BEFORE UPDATE ON collection_points
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE collection_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Todos los usuarios autenticados de la organización pueden ver
CREATE POLICY "collection_points_read_org" ON collection_points
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )
    OR get_user_role() = 'superadmin'
  );

-- Solo managers pueden crear/modificar/eliminar
CREATE POLICY "collection_points_write_admin" ON collection_points
  FOR INSERT WITH CHECK (
    get_user_role() IN ('superadmin', 'gerente', 'coordinador')
  );

CREATE POLICY "collection_points_update_admin" ON collection_points
  FOR UPDATE USING (
    get_user_role() IN ('superadmin', 'gerente', 'coordinador')
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'gerente', 'coordinador')
  );

CREATE POLICY "collection_points_delete_admin" ON collection_points
  FOR DELETE USING (
    get_user_role() IN ('superadmin', 'gerente', 'coordinador')
  );
