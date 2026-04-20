-- ========================================
-- SATS-RM: Complete Database Schema
-- All 4 Phases
-- ========================================

-- ========================================
-- PHASE 1: Core Tables
-- ========================================

-- ENUM: User Role
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('superadmin', 'coordinador', 'operador_mar', 'operador_playa', 'operador_tierra', 'gerencia');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ENUM: Task Types
DO $$ BEGIN
  CREATE TYPE task_type AS ENUM ('barrera_despliegue', 'colecta_marina', 'limpieza_playa', 'acopio_recepcion', 'disposicion', 'inspeccion');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ENUM: Task Status
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pendiente', 'asignada', 'en_progreso', 'completada', 'cancelada', 'escalada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ENUM: Task Priority
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('baja', 'media', 'alta', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operador_playa',
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type task_type NOT NULL,
  status task_status NOT NULL DEFAULT 'pendiente',
  priority task_priority NOT NULL DEFAULT 'media',
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: task_logs
CREATE TABLE IF NOT EXISTS task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  status_from task_status,
  status_to task_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: disposal_destinations
CREATE TABLE IF NOT EXISTS disposal_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: alert_rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- PHASE 2: Assets & Operations
-- ========================================

-- ENUM: Asset Type
DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM ('embarcacion', 'atv', 'pickup', 'camion');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ENUM: Asset Status
DO $$ BEGIN
  CREATE TYPE asset_status AS ENUM ('disponible', 'en_uso', 'mantenimiento', 'fuera_de_servicio');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ENUM: Barrier Type
DO $$ BEGIN
  CREATE TYPE barrier_type AS ENUM ('flotante', 'fija', 'mixta');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ENUM: Barrier Status
DO $$ BEGIN
  CREATE TYPE barrier_status AS ENUM ('almacenada', 'desplegada', 'mantenimiento', 'dañada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ENUM: Collection Status
DO $$ BEGIN
  CREATE TYPE collection_status AS ENUM ('en_curso', 'completado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table: assets
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type asset_type NOT NULL,
  status asset_status NOT NULL DEFAULT 'disponible',
  capacity DOUBLE PRECISION,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: barriers
CREATE TABLE IF NOT EXISTS barriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type barrier_type NOT NULL,
  status barrier_status NOT NULL DEFAULT 'almacenada',
  length_m DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: marine_collections
CREATE TABLE IF NOT EXISTS marine_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) NOT NULL,
  asset_id UUID REFERENCES assets(id),
  status collection_status NOT NULL DEFAULT 'en_curso',
  start_latitude DOUBLE PRECISION,
  start_longitude DOUBLE PRECISION,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_latitude DOUBLE PRECISION,
  end_longitude DOUBLE PRECISION,
  end_time TIMESTAMPTZ,
  volume_m3 DOUBLE PRECISION,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: beach_trips
CREATE TABLE IF NOT EXISTS beach_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) NOT NULL,
  asset_id UUID REFERENCES assets(id),
  status collection_status NOT NULL DEFAULT 'en_curso',
  origin_latitude DOUBLE PRECISION,
  origin_longitude DOUBLE PRECISION,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  destination_latitude DOUBLE PRECISION,
  destination_longitude DOUBLE PRECISION,
  end_time TIMESTAMPTZ,
  volume_m3 DOUBLE PRECISION,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- PHASE 3: Storage & Disposal
-- ========================================

-- ENUM: Storage Entry Status
DO $$ BEGIN
  CREATE TYPE storage_entry_status AS ENUM ('recibido', 'secando', 'listo', 'despachado', 'descartado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ENUM: Source Type
DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('colecta_marina', 'viaje_playa', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table: storage_entries
CREATE TABLE IF NOT EXISTS storage_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  source_type source_type NOT NULL,
  source_id TEXT,
  weight_kg DOUBLE PRECISION,
  volume_m3 DOUBLE PRECISION,
  moisture_pct DOUBLE PRECISION,
  status storage_entry_status NOT NULL DEFAULT 'recibido',
  notes TEXT,
  received_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: disposal_records
CREATE TABLE IF NOT EXISTS disposal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_entry_id UUID REFERENCES storage_entries(id) NOT NULL,
  destination_id UUID REFERENCES disposal_destinations(id) NOT NULL,
  weight_kg DOUBLE PRECISION,
  volume_m3 DOUBLE PRECISION,
  vehicle_id UUID REFERENCES assets(id),
  folio TEXT,
  dispatched_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- PHASE 4: Shifts & Reports
-- ========================================

-- ENUM: Shift Type
DO $$ BEGIN
  CREATE TYPE shift_type AS ENUM ('matutino', 'vespertino', 'nocturno', 'especial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ENUM: Shift Status
DO $$ BEGIN
  CREATE TYPE shift_status AS ENUM ('programado', 'activo', 'completado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table: shifts
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID REFERENCES profiles(id) NOT NULL,
  date DATE NOT NULL,
  type shift_type NOT NULL DEFAULT 'matutino',
  status shift_status NOT NULL DEFAULT 'programado',
  scheduled_start TIME,
  scheduled_end TIME,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: shift_members
CREATE TABLE IF NOT EXISTS shift_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  role_override TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shift_id, profile_id)
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_marine_collections_task_id ON marine_collections(task_id);
CREATE INDEX IF NOT EXISTS idx_marine_collections_status ON marine_collections(status);
CREATE INDEX IF NOT EXISTS idx_beach_trips_task_id ON beach_trips(task_id);
CREATE INDEX IF NOT EXISTS idx_beach_trips_status ON beach_trips(status);
CREATE INDEX IF NOT EXISTS idx_storage_entries_task_id ON storage_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_storage_entries_status ON storage_entries(status);
CREATE INDEX IF NOT EXISTS idx_disposal_records_storage_entry_id ON disposal_records(storage_entry_id);
CREATE INDEX IF NOT EXISTS idx_shifts_coordinator_id ON shifts(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shift_members_shift_id ON shift_members(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_members_profile_id ON shift_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_barriers_status ON barriers(status);

-- ========================================
-- TRIGGERS
-- ========================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.profile->>'name', NEW.email),
    CASE
      WHEN (SELECT COUNT(*) FROM profiles) = 0 THEN 'superadmin'::user_role
      ELSE 'operador_playa'::user_role
    END,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'tasks', 'task_logs', 'disposal_destinations', 'alert_rules', 'assets', 'barriers', 'marine_collections', 'beach_trips', 'storage_entries', 'shifts')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION handle_updated_at()', t, t);
  END LOOP;
END $$;

-- ========================================
-- SEED DATA: Disposal Destinations
-- ========================================

INSERT INTO disposal_destinations (name, description, is_active) VALUES
  ('Compostaje', 'Procesamiento de sargazo para abono orgánico', true),
  ('Relleno Sanitario', 'Disposición en relleno sanitario autorizado', true),
  ('Bioproductos', 'Transformación en биопродукты y materiales', true),
  ('Biochar', 'Conversión a biochar mediante pirólisis', true),
  ('Acopio Temporal', 'Almacenamiento temporal para procesamiento posterior', true)
ON CONFLICT DO NOTHING;

-- ========================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE barriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marine_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE beach_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_members ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES: Helper function for role checks
-- ========================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role 
  FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND is_active = true
  LIMIT 1;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ========================================
-- RLS POLICIES: profiles
-- ========================================

CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_read_admin" ON profiles
  FOR SELECT USING (
    get_user_role() IN ('superadmin', 'coordinador')
  );

CREATE POLICY "profiles_read_gerencia" ON profiles
  FOR SELECT USING (
    get_user_role() = 'gerencia'
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_admin_write" ON profiles
  FOR ALL USING (
    get_user_role() IN ('superadmin', 'coordinador', 'gerencia')
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador', 'gerencia')
  );

-- ========================================
-- RLS POLICIES: tasks
-- ========================================

CREATE POLICY "tasks_read_assigned" ON tasks
  FOR SELECT USING (
    assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador', 'gerencia')
  );

CREATE POLICY "tasks_write_admin" ON tasks
  FOR INSERT WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador')
  );

CREATE POLICY "tasks_update_admin" ON tasks
  FOR UPDATE USING (
    get_user_role() IN ('superadmin', 'coordinador')
    OR assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador')
    OR assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ========================================
-- RLS POLICIES: task_logs
-- ========================================

CREATE POLICY "task_logs_read_via_tasks" ON task_logs
  FOR SELECT USING (
    task_id IN (SELECT id FROM tasks WHERE
      assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR get_user_role() IN ('superadmin', 'coordinador', 'gerencia')
    )
  );

CREATE POLICY "task_logs_insert" ON task_logs
  FOR INSERT WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador')
    OR auth.uid() IS NOT NULL
  );

-- ========================================
-- RLS POLICIES: disposal_destinations
-- ========================================

CREATE POLICY "destinations_read_all" ON disposal_destinations
  FOR SELECT USING (true);

CREATE POLICY "destinations_write_admin" ON disposal_destinations
  FOR ALL USING (
    get_user_role() IN ('superadmin', 'coordinador')
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador')
  );

-- ========================================
-- RLS POLICIES: alert_rules
-- ========================================

CREATE POLICY "alert_rules_read_all" ON alert_rules
  FOR SELECT USING (true);

CREATE POLICY "alert_rules_write_admin" ON alert_rules
  FOR ALL USING (
    get_user_role() IN ('superadmin', 'coordinador')
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador')
  );

-- ========================================
-- RLS POLICIES: assets
-- ========================================

CREATE POLICY "assets_read_all" ON assets
  FOR SELECT USING (true);

CREATE POLICY "assets_write_admin" ON assets
  FOR ALL USING (
    get_user_role() IN ('superadmin', 'coordinador')
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador')
  );

-- ========================================
-- RLS POLICIES: barriers
-- ========================================

CREATE POLICY "barriers_read_all" ON barriers
  FOR SELECT USING (true);

CREATE POLICY "barriers_write_admin" ON barriers
  FOR ALL USING (
    get_user_role() IN ('superadmin', 'coordinador')
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador')
  );

-- ========================================
-- RLS POLICIES: marine_collections
-- ========================================

CREATE POLICY "marine_collections_read_assigned" ON marine_collections
  FOR SELECT USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador', 'gerencia')
  );

CREATE POLICY "marine_collections_write_operators" ON marine_collections
  FOR INSERT WITH CHECK (
    get_user_role() IN ('operador_mar', 'superadmin', 'coordinador')
  );

CREATE POLICY "marine_collections_update_own" ON marine_collections
  FOR UPDATE USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador')
  )
  WITH CHECK (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador')
  );

-- ========================================
-- RLS POLICIES: beach_trips
-- ========================================

CREATE POLICY "beach_trips_read_assigned" ON beach_trips
  FOR SELECT USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador', 'gerencia')
  );

CREATE POLICY "beach_trips_write_operators" ON beach_trips
  FOR INSERT WITH CHECK (
    get_user_role() IN ('operador_playa', 'superadmin', 'coordinador')
  );

CREATE POLICY "beach_trips_update_own" ON beach_trips
  FOR UPDATE USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador')
  )
  WITH CHECK (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR get_user_role() IN ('superadmin', 'coordinador')
  );

-- ========================================
-- RLS POLICIES: storage_entries
-- ========================================

CREATE POLICY "storage_entries_tierra_admin" ON storage_entries
  FOR ALL USING (
    get_user_role() IN ('operador_tierra', 'superadmin', 'coordinador')
    OR get_user_role() = 'gerencia' AND EXISTS (SELECT 1 FROM storage_entries WHERE true)
  )
  WITH CHECK (
    get_user_role() IN ('operador_tierra', 'superadmin', 'coordinador')
  );

CREATE POLICY "storage_entries_read_gerencia" ON storage_entries
  FOR SELECT USING (
    get_user_role() = 'gerencia'
  );

-- ========================================
-- RLS POLICIES: disposal_records
-- ========================================

CREATE POLICY "disposal_records_tierra_admin" ON disposal_records
  FOR ALL USING (
    get_user_role() IN ('operador_tierra', 'superadmin', 'coordinador')
  )
  WITH CHECK (
    get_user_role() IN ('operador_tierra', 'superadmin', 'coordinador')
  );

CREATE POLICY "disposal_records_read_gerencia" ON disposal_records
  FOR SELECT USING (
    get_user_role() = 'gerencia'
  );

-- ========================================
-- RLS POLICIES: shifts
-- ========================================

CREATE POLICY "shifts_read_admin" ON shifts
  FOR SELECT USING (
    get_user_role() IN ('superadmin', 'coordinador', 'gerencia')
    OR EXISTS (
      SELECT 1 FROM shift_members sm
      WHERE sm.shift_id = shifts.id
      AND sm.profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "shifts_write_admin" ON shifts
  FOR ALL USING (
    get_user_role() IN ('superadmin', 'coordinador')
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador')
  );

-- ========================================
-- RLS POLICIES: shift_members
-- ========================================

CREATE POLICY "shift_members_read_admin" ON shift_members
  FOR SELECT USING (
    get_user_role() IN ('superadmin', 'coordinador', 'gerencia')
    OR profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "shift_members_write_admin" ON shift_members
  FOR ALL USING (
    get_user_role() IN ('superadmin', 'coordinador')
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador')
  );