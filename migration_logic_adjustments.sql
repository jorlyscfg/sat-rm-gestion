-- ========================================
-- Migration: Logic Adjustments
-- Ajusta la BD a la lógica real de negocio:
-- 1. Origen y destino de tareas a puntos de acopio.
-- 2. Relación Tarea -> Múltiples Activos.
-- 3. Relación Activo -> Múltiples Operadores.
-- ========================================

-- 1. Modificar tabla tasks para orígenes y destinos de acopio
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS origin_collection_point_id UUID REFERENCES collection_points(id),
ADD COLUMN IF NOT EXISTS destination_collection_point_id UUID REFERENCES collection_points(id);

CREATE INDEX IF NOT EXISTS idx_tasks_origin_cp_id ON tasks(origin_collection_point_id);
CREATE INDEX IF NOT EXISTS idx_tasks_destination_cp_id ON tasks(destination_collection_point_id);

-- 2. Tabla intermedia: task_assets (Asignación de Activos a Tareas)
CREATE TABLE IF NOT EXISTS task_assets (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (task_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assets_task_id ON task_assets(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assets_asset_id ON task_assets(asset_id);

ALTER TABLE task_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_assets_read_all" ON task_assets;
CREATE POLICY "task_assets_read_all" ON task_assets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "task_assets_write_admin" ON task_assets;
CREATE POLICY "task_assets_write_admin" ON task_assets
  FOR ALL USING (
    get_user_role() IN ('superadmin', 'coordinador', 'gerente')
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador', 'gerente')
  );

-- 3. Tabla intermedia: asset_operators (Asignación de múltiples operadores a un activo)
CREATE TABLE IF NOT EXISTS asset_operators (
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (asset_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_operators_asset_id ON asset_operators(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_operators_profile_id ON asset_operators(profile_id);

ALTER TABLE asset_operators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asset_operators_read_all" ON asset_operators;
CREATE POLICY "asset_operators_read_all" ON asset_operators
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "asset_operators_write_admin" ON asset_operators;
CREATE POLICY "asset_operators_write_admin" ON asset_operators
  FOR ALL USING (
    get_user_role() IN ('superadmin', 'coordinador', 'gerente')
  )
  WITH CHECK (
    get_user_role() IN ('superadmin', 'coordinador', 'gerente')
  );

-- Actualizar vista de esquema completo (Eliminar columna huérfana assigned_operator_id de assets si existiera en un entorno futuro, aunque no estaba en el schema base).
-- Nota: En schema.sql, la tabla assets no tenía 'assigned_operator_id', pero los tipos sí. Por seguridad, no ejecutamos DROP COLUMN aquí para no romper si no existe.
