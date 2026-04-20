-- ========================================
-- SATS-RM: Clients Module Migration
-- ========================================

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  work_area JSONB DEFAULT '[]',
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add client_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);

-- 4. Enable RLS on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for clients
CREATE POLICY "clients_read_org" ON clients
  FOR SELECT USING (
    get_user_role() = 'superadmin'
    OR organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('gerente', 'coordinador', 'operador')
  );

CREATE POLICY "clients_write_admin" ON clients
  FOR ALL USING (
    get_user_role() = 'superadmin'
    OR (get_user_role() IN ('gerente', 'coordinador')
        AND organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()))
  )
  WITH CHECK (
    get_user_role() = 'superadmin'
    OR (get_user_role() IN ('gerente', 'coordinador')
        AND organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()))
  );

-- 6. Trigger for updated_at
DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();