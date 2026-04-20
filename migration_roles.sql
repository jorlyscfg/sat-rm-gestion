-- ========================================
-- SATS-RM: Role Restructuring Migration
-- superadmin | gerente | coordinador | operador
-- + organizations table
-- + current_task_id on assets
-- ========================================

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Alter user_role ENUM: add new values, then clean up
DO $$ BEGIN
  -- Add new roles
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gerente';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operador';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Add organization_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 4. Add organization_id to core operational tables
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE barriers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE disposal_destinations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE marine_collections ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE beach_trips ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE storage_entries ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 5. Add current_task_id to assets for locking
ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_task_id UUID REFERENCES tasks(id);

-- 6. Migrate existing roles:
-- gerencia → gerente, operador_mar/playa/tierra → operador
UPDATE profiles SET role = 'gerente' WHERE role = 'gerencia';
UPDATE profiles SET role = 'operador' WHERE role IN ('operador_mar', 'operador_playa', 'operador_tierra');

-- 7. Remove old ENUM values (PostgreSQL doesn't support DROP VALUE, so we recreate the ENUM)
-- This requires renaming the old type and creating a new one
-- WARNING: This section should be run when no active connections are using the old values
-- For safety, we keep the old values in the ENUM and handle them in app code

-- 8. Update default role in profiles table from 'operador_playa' to 'operador'
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'operador';

-- 9. Update the trigger function for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.profile->>'name', NEW.email),
    CASE
      WHEN (SELECT COUNT(*) FROM profiles) = 0 THEN 'superadmin'::user_role
      ELSE 'operador'::user_role
    END,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Indexes for organization_id
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_organization_id ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_barriers_organization_id ON barriers(organization_id);
CREATE INDEX IF NOT EXISTS idx_shifts_organization_id ON shifts(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_current_task_id ON assets(current_task_id);

-- 11. Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 12. RLS for organizations: superadmin sees all, members see their own org
CREATE POLICY "organizations_read_superadmin" ON organizations
  FOR SELECT USING (
    get_user_role() = 'superadmin'
  );

CREATE POLICY "organizations_read_members" ON organizations
  FOR SELECT USING (
    id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "organizations_write_superadmin" ON organizations
  FOR ALL USING (
    get_user_role() = 'superadmin'
  )
  WITH CHECK (
    get_user_role() = 'superadmin'
  );

-- 13. Update RLS policies for profiles to include gerente
-- Drop old gerencia policies
DROP POLICY IF EXISTS "profiles_read_gerencia" ON profiles;

-- Update profiles_read_admin to include gerente
CREATE OR REPLACE POLICY "profiles_read_admin" ON profiles
  FOR SELECT USING (
    get_user_role() IN ('superadmin', 'coordinador', 'gerente')
    OR organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

-- Update profiles_admin_write for org management
CREATE OR REPLACE POLICY "profiles_admin_write" ON profiles
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

-- 14. Update RLS for tasks: org-scoped access
CREATE OR REPLACE POLICY "tasks_read_assigned" ON tasks
  FOR SELECT USING (
    assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador', 'gerente')
    OR organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

-- 15. Update RLS for assets: org-scoped + superadmin sees all
CREATE OR REPLACE POLICY "assets_read_all" ON assets
  FOR SELECT USING (
    get_user_role() = 'superadmin'
    OR organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE OR REPLACE POLICY "assets_write_admin" ON assets
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

-- 16. Update RLS for barriers: same as assets
CREATE OR REPLACE POLICY "barriers_read_all" ON barriers
  FOR SELECT USING (
    get_user_role() = 'superadmin'
    OR organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE OR REPLACE POLICY "barriers_write_admin" ON barriers
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

-- 17. Update RLS for marine_collections: operador can insert/update
CREATE OR REPLACE POLICY "marine_collections_read_assigned" ON marine_collections
  FOR SELECT USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador', 'gerente')
    OR organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE OR REPLACE POLICY "marine_collections_write_operators" ON marine_collections
  FOR INSERT WITH CHECK (
    get_user_role() IN ('operador', 'superadmin', 'coordinador')
  );

CREATE OR REPLACE POLICY "marine_collections_update_own" ON marine_collections
  FOR UPDATE USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador')
  )
  WITH CHECK (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador')
  );

-- 18. Update RLS for beach_trips: same pattern
CREATE OR REPLACE POLICY "beach_trips_read_assigned" ON beach_trips
  FOR SELECT USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador', 'gerente')
    OR organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE OR REPLACE POLICY "beach_trips_write_operators" ON beach_trips
  FOR INSERT WITH CHECK (
    get_user_role() IN ('operador', 'superadmin', 'coordinador')
  );

CREATE OR REPLACE POLICY "beach_trips_update_own" ON beach_trips
  FOR UPDATE USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador')
  )
  WITH CHECK (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador')
  );

-- 19. Update storage_entries RLS for operador
CREATE OR REPLACE POLICY "storage_entries_tierra_admin" ON storage_entries
  FOR ALL USING (
    get_user_role() IN ('operador', 'superadmin', 'coordinador')
    OR (get_user_role() = 'gerente'
        AND organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()))
  )
  WITH CHECK (
    get_user_role() IN ('operador', 'superadmin', 'coordinador')
  );

CREATE OR REPLACE POLICY "storage_entries_read_gerente" ON storage_entries
  FOR SELECT USING (
    get_user_role() = 'gerente'
    AND organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

-- 20. Update disposal_records RLS for operador
CREATE OR REPLACE POLICY "disposal_records_tierra_admin" ON disposal_records
  FOR ALL USING (
    get_user_role() IN ('operador', 'superadmin', 'coordinador')
  )
  WITH CHECK (
    get_user_role() IN ('operador', 'superadmin', 'coordinador')
  );

CREATE OR REPLACE POLICY "disposal_records_read_gerente" ON disposal_records
  FOR SELECT USING (
    get_user_role() = 'gerente'
    AND organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

-- 21. Update shifts RLS for gerente
CREATE OR REPLACE POLICY "shifts_read_admin" ON shifts
  FOR SELECT USING (
    get_user_role() IN ('superadmin', 'coordinador', 'gerente')
    OR EXISTS (
      SELECT 1 FROM shift_members sm
      WHERE sm.shift_id = shifts.id
      AND sm.profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE OR REPLACE POLICY "shifts_write_admin" ON shifts
  FOR ALL USING (
    get_user_role() IN ('superadmin', 'coordinador')
    OR (get_user_role() = 'gerente'
        AND organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()))
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador')
    OR (get_user_role() = 'gerente'
        AND organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()))
  );

-- 22. Update task_logs RLS
CREATE OR REPLACE POLICY "task_logs_read_via_tasks" ON task_logs
  FOR SELECT USING (
    task_id IN (SELECT id FROM tasks WHERE
      assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR get_user_role() IN ('superadmin', 'coordinador', 'gerente')
      OR organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- 23. Update tasks write policies for gerente
CREATE OR REPLACE POLICY "tasks_write_admin" ON tasks
  FOR INSERT WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador', 'gerente')
  );

CREATE OR REPLACE POLICY "tasks_update_admin" ON tasks
  FOR UPDATE USING (
    get_user_role() IN ('superadmin', 'coordinador', 'gerente')
    OR assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador', 'gerente')
    OR assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );