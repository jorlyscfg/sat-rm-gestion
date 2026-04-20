# PRD — Módulo de Gestión Operativa

## Estado Actual: Fase 4 Completada ✅

---

## 1. Resumen

SATS-RM. Permite verifica el ciclo operativo completo de respuesta al sargazo: desde la creación de tareas (detonadas por alertas(modulo a implementarse mas adelante) o manualmente) hasta su asignación, ejecución de campo y registro de resultados.

## 2. Roles y Permisos

| Rol | Acceso |
|---|---|
| `superadmin` | Todo: CRUD completo en todas las tablas |
| `coordinador` | Crear/asignar tareas, gestionar perfiles de operadores, ver dashboard |
| `operador_mar` | Ver/actualizar tareas marítimas asignadas |
| `operador_playa` | Ver/actualizar tareas de playa asignadas |
| `operador_tierra` | Ver/actualizar tareas de acopio asignadas |
| `gerencia` | Solo lectura: dashboard y reportes |

**Implementación**: Tabla `profiles` vinculada 1:1 a `auth.users` con campo `role` (ENUM).
**RLS**: Todas las tablas tienen Row Level Security habilitado con policies por rol.

---

## 3. Base de Datos

### 3.1 Tablas Implementadas (Fase 1)

| Tabla | Propósito | Registros Seed |
|---|---|---|
| `profiles` | Perfiles de usuario con rol operativo | Auto-generados via trigger |
| `tasks` | Tareas operativas (centro neurálgico) | — |
| `task_logs` | Historial inmutable de acciones sobre tareas | — |
| `disposal_destinations` | Catálogo CRUD de destinos de disposición final | 5 (Compostaje, Relleno, Bioproductos, Biochar, Acopio Temporal) |
| `alert_rules` | Reglas configurables de acción automática | — |

### 3.1b Tablas Implementadas (Fase 2)

| Tabla | Propósito |
|---|---|
| `assets` | Catálogo de activos operativos (embarcaciones, ATVs, pickups, camiones). Capacidad variable por activo. |
| `barriers` | Barreras de contención marina (flotante, fija, mixta). Estado, longitud y geolocalización. |
| `marine_collections` | Ciclos de colecta marina. Cada registro = 1 llenado de embarcación. Patrón "un tap". |
| `beach_trips` | Viajes de ATV playa→acopio. Cada registro = 1 viaje con GPS origen/destino. Patrón "un tap". |

### 3.1c Tablas Implementadas (Fase 3)

| Tabla | Propósito |
|---|---|
| `storage_entries` | Entradas de material al acopio. Vincula origen (mar/playa/manual) con pesaje y estado de secado. |
| `disposal_records` | Registros de disposición final. Vincula storage_entry con destino del catálogo y vehículo de transporte. |

### 3.2 Tipos ENUM Creados
- `user_role`: superadmin, coordinador, operador_mar, operador_playa, operador_tierra, gerencia  
- `task_type`: barrera_despliegue, colecta_marina, limpieza_playa, acopio_recepcion, disposicion, inspeccion
- `task_status`: pendiente, asignada, en_progreso, completada, cancelada, escalada
- `task_priority`: baja, media, alta, urgente
- `asset_type`: embarcacion, atv, pickup, camion
- `asset_status`: disponible, en_uso, mantenimiento, fuera_de_servicio
- `barrier_type`: flotante, fija, mixta
- `barrier_status`: almacenada, desplegada, mantenimiento, dañada
- `collection_status`: en_curso, completado, cancelado
- `storage_entry_status`: recibido, secando, listo, despachado, descartado
- `source_type`: colecta_marina, viaje_playa, manual

### 3.3 Triggers
- `handle_new_user`: Auto-crea perfil al registrar usuario en auth. El primer usuario es `superadmin`.
- `handle_updated_at`: Actualiza `updated_at` automáticamente en todas las tablas operativas.

### 3.4 Tablas Pendientes (Fase 4)
- `shifts` / `shift_members` — Turnos y asignaciones

---

## 4. Server Actions

### Archivo: `src/app/actions/profile.ts`
| Función | Descripción | Acceso |
|---|---|---|
| `getUserProfile()` | Obtener perfil del usuario autenticado | Todos |
| `listProfiles()` | Listar todos los perfiles | coordinador, superadmin |
| `createOperator()` | Crear operador (auth + profile) | coordinador, superadmin |
| `updateProfile()` | Actualizar perfil | Propio o admin |
| `getProfilesByRole()` | Perfiles activos por rol | coordinador, superadmin |

### Archivo: `src/app/actions/tasks.ts`
| Función | Descripción | Acceso |
|---|---|---|
| `getTasks(filters)` | Listar tareas con filtros | Según RLS |
| `getTaskById(id)` | Detalle + logs de una tarea | Según RLS |
| `createTask(input)` | Crear tarea | coordinador, superadmin |
| `updateTaskStatus(id, status)` | Cambiar estado | coordinador o asignado |
| `assignTask(id, profileId)` | Asignar tarea a operador | coordinador, superadmin |
| `getTaskStats()` | Stats para dashboard | coordinador, superadmin, gerencia |

### Archivo: `src/app/actions/assets.ts` (Fase 2)
| Función | Descripción | Acceso |
|---|---|---|
| `getAssets(filters)` | Listar activos con filtros por tipo/estado | Todos |
| `createAsset(input)` | Crear activo | coordinador, superadmin |
| `updateAsset(id, updates)` | Actualizar activo (estado, metadata) | coordinador, superadmin |
| `getAvailableAssets(type)` | Activos disponibles por tipo | Todos |
| `getBarriers(filters)` | Listar barreras | Todos |
| `createBarrier(input)` | Crear barrera | coordinador, superadmin |
| `updateBarrier(id, updates)` | Actualizar barrera | coordinador, superadmin |

### Archivo: `src/app/actions/operations.ts` (Fase 2)
| Función | Descripción | Acceso |
|---|---|---|
| `startMarineCollection(input)` | Iniciar ciclo de colecta (GPS auto) | operador_mar |
| `completeMarineCollection(id, vol)` | Completar ciclo con volumen | operador_mar |
| `getMarineCollections(taskId)` | Historial de ciclos de una tarea | Según RLS |
| `startBeachTrip(input)` | Iniciar viaje ATV (GPS origen) | operador_playa |
| `completeBeachTrip(id, input)` | Registrar llegada (GPS destino + vol) | operador_playa |
| `getBeachTrips(taskId)` | Historial de viajes de una tarea | Según RLS |
| `getTaskOperationSummary(taskId)` | Resumen de volúmenes y ciclos | Todos |

### Archivo: `src/app/actions/storage.ts` (Fase 3)
| Función | Descripción | Acceso |
|---|---|---|
| `createStorageEntry(input)` | Registrar recepción de material en acopio | operador_tierra, coordinador, superadmin |
| `getStorageEntries(filters)` | Listar entradas con filtros por tarea/estado | Según RLS |
| `updateStorageEntry(id, updates)` | Actualizar estado/medidas de una entrada | operador_tierra, coordinador, superadmin |
| `getStorageStats()` | Estadísticas de acopio (totales por estado) | Todos |
| `createDisposalRecord(input)` | Despachar material a destino final | operador_tierra, coordinador, superadmin |
| `getDisposalRecords(filters)` | Historial de disposición | Según RLS |
| `getDisposalDestinations()` | Catálogo de destinos activos | Todos |

---

## 5. Frontend

### 5.1 Rutas Implementadas

| Ruta | Tipo | Descripción |
|---|---|---|
| `/gestion` | Server Component | Dashboard del coordinador con stats, tareas recientes y acceso a activos |
| `/gestion/tareas` | Client Component | Lista de tareas con filtros (estado, tipo, búsqueda) |
| `/gestion/tareas/[id]` | Client Component | Detalle de tarea con timeline de acciones |
| `/gestion/tareas/nueva` | Client Component | Formulario de creación de tarea (soporta pre-fill desde alertas) |
| `/gestion/activos` | Client Component | Catálogo CRUD de activos: Embarcaciones, Vehículos, Barreras |
| `/gestion/operaciones/mar` | Client Component | Vista operador marítimo — ciclos de colecta "un tap" |
| `/gestion/operaciones/playa` | Client Component | Vista operador playa — viajes ATV "un tap" |
| `/gestion/operaciones/tierra` | Client Component | Vista completa de acopio: recepción, secado, despacho a disposición final |
| `/profile` | Server Component | Perfil del usuario autenticado |

### 5.2 Navegación
El bottom navbar fue actualizado:
- **Antes**: `Inicio | Detecciones | [MAPA] | Alertas | Perfil(disabled)`
- **Ahora**: `Inicio | Gestión | [MAPA] | Alertas | Perfil`

### 5.3 Componentes Nuevos
- `src/components/profile/sign-out-button.tsx` — Botón de cerrar sesión (client component)

### 5.4 Flujo de Redirección por Rol
Cuando un operador accede a `/gestion`:
- `operador_mar` → redirigido a `/gestion/operaciones/mar`
- `operador_playa` → redirigido a `/gestion/operaciones/playa`
- `operador_tierra` → redirigido a `/gestion/operaciones/tierra`
- `coordinador`, `superadmin`, `gerencia` → ven el dashboard

---

## 6. Ciclo de Vida de una Tarea

```
PENDIENTE ──── ASIGNADA ──── EN_PROGRESO ──── COMPLETADA
                  │               │
                  │               └──── ESCALADA ──── ASIGNADA (vuelta)
                  │               │
                  └───────────────└──── CANCELADA
```

Cada transición se registra en `task_logs` con:
- Status anterior y nuevo
- Quién hizo el cambio
- Timestamp automático
- Nota opcional

---

## 7. Decisiones de Diseño

1. **Registro de operadores**: El coordinador crea las cuentas, no se registran solos.
2. **Volumen de ATV**: Variable por activo (no fijo a 2 m³).
3. **Unidades**: kg para pesaje, m³ para volumen.
4. **Destinos de disposición**: CRUD configurable (Compostaje, Relleno Sanitario, Bioproductos, Biochar, Acopio Temporal como seed).
5. **Turnos**: Horarios flexibles asignados por el coordinador.
6. **Detecciones**: Se moverá como tab dentro de `/mapa` (pendiente).

---

## 8. Patrón "Un Tap" (Operadores de Campo)

Las vistas operativas emplean un diseño simplificado para trabajo en campo:

### Colecta Marina (`/gestion/operaciones/mar`)
1. Operador ve sus tareas `colecta_marina` asignadas/en_progreso
2. Selecciona embarcación (opcional)
3. Toca **"Iniciar Ciclo"** → registra GPS + hora automáticamente
4. Al llenar la embarcación, toca **"Completar"** → ingresa volumen (m³)
5. Puede repetir ciclos indefinidamente

### Limpieza Playa (`/gestion/operaciones/playa`)
1. Operador ve sus tareas `limpieza_playa` asignadas/en_progreso
2. Selecciona ATV/vehículo (opcional)
3. Toca **"Salir"** → registra GPS origen + hora de salida
4. Al llegar al acopio, toca **"Llegué"** → registra GPS destino + volumen (m³)
5. Puede repetir viajes indefinidamente

---

## 9. Integración Alertas → Gestión (dejar para proxima etapa de implementacion)

Desde la página de alertas (`/alerts`), cada alerta incluye un botón **"Crear Tarea"** que:
- Redirige a `/gestion/tareas/nueva` con query params
- Pre-selecciona la ubicación de la alerta (`location_id`)
- Establece la prioridad en "alta" por defecto
- Muestra indicador "Creada desde Alerta" en el header

---

## 10. Flujo de Acopio y Disposición Final (Fase 3)

### Vista Operador de Tierra (`/gestion/operaciones/tierra`)

**Tab Recepciones:**
1. Operador toca **"Registrar Recepción"** → modal con origen (mar/playa/manual), peso (kg), volumen (m³)
2. Entrada se crea con estado `recibido`
3. Botones rápidos para cambiar estado:
   - `recibido` → `secando` (a secar al sol)
   - `secando` → `listo` (preparado para despacho)
4. Cuando está `listo`, aparece botón **"Despachar"**

**Tab Despacho:**
1. Muestra solo entradas con estado `listo`
2. Operador toca **"Despachar"** → modal con:
   - Destino (del catálogo `disposal_destinations`)
   - Peso/volumen de despacho (puede diferir del ingreso por secado)
   - Vehículo de transporte (opcional, del catálogo `assets`)
   - Folio / guía de remisión
3. Al confirmar, la `storage_entry` cambia a `despachado` y se crea el `disposal_record`

### Trazabilidad Completa
```
Satélite → Detección → Alerta → Tarea → Colecta/Viaje → Acopio → Disposición Final
         [datos]    [coord]  [asig]   [campo]        [peso]   [destino + folio]
```

---

## 11. Pendientes para Fases Siguientes

## 11. Gestión de Turnos y Reportes (Fase 4)

### Tablas de Base de Datos

| Tabla | Descripción |
|-------|------------|
| `shifts` | Turnos operativos. Cada turno tiene coordinador, fecha, tipo, horarios y resumen JSONB de productividad |
| `shift_members` | Asignación M:N de perfiles a turnos. Constraint UNIQUE por (shift_id, profile_id) |

### ENUMs
- `shift_type`: `matutino`, `vespertino`, `nocturno`, `especial`
- `shift_status`: `programado`, `activo`, `completado`, `cancelado`

### RLS
- **superadmin/coordinador**: CRUD completo
- **operadores**: solo lectura de turnos donde están asignados como miembros
- **gerencia**: solo lectura

### Server Actions (`actions/shifts.ts`)

| Función | Descripción |
|---------|------------|
| `createShift()` | Crear turno con fecha, tipo, horarios. Opcionalmente asigna miembros |
| `getShifts()` | Listar turnos con filtros (status, rango de fechas), incluye coordinador y miembros expandidos |
| `startShift()` | `programado` → `activo`, registra hora real de inicio |
| `completeShift()` | `activo` → `completado`, genera resumen automático de productividad consultando todas las tablas operativas |
| `addShiftMember()` | Agregar operador a un turno existente |
| `removeShiftMember()` | Remover operador de un turno |
| `getManagementReport()` | Métricas agregadas para dashboard gerencial con filtro por rango de fechas |

### Resumen de Productividad (ShiftSummary)
Al cerrar un turno, se genera automáticamente un JSONB con:
- Tareas completadas en el período
- Ciclos marinos completados por miembros del turno + volumen m³
- Viajes de playa completados + volumen m³
- Entradas al acopio + peso kg
- Disposiciones en el período
- Cantidad de miembros

### Vista Turnos (`/gestion/turnos`)
- Listado de turnos con separación activos / historial
- Crear turno: fecha, tipo, horarios programados
- Expandir turno: ver miembros, agregar/remover, iniciar/cerrar
- Al cerrar turno: muestra resumen de productividad generado

### Dashboard Gerencial (`/gestion/reportes`)
- Filtro por rango de fechas (default: últimos 30 días)
- Secciones:
  - **Tareas**: total, completadas, canceladas, tasa de completado, tiempo medio de respuesta
  - **Operaciones**: ciclos marinos (cantidad + volumen), viajes playa (cantidad + volumen), volumen total
  - **Acopio**: entradas, peso total kg, volumen total m³
  - **Disposición**: total despachos, desglose por destino con barras proporcionales
  - **Turnos**: total turnos, total asignaciones

### Dashboard Coordinador (`/gestion`)
- Grid de 3 columnas con accesos rápidos: Activos, Turnos, Reportes
- Botón destacado para gerencia → Dashboard de reportes
- Versión actualizada a v2.0

### Trazabilidad Completa
```
Satélite → Detección → Alerta → Tarea → Turno → Colecta/Viaje → Acopio → Disposición Final
         [datos]    [coord]  [asig]   [equipo]   [campo]        [peso]   [destino + folio]
```

---

## 12. Pendientes para Fases Siguientes

### Fase 5+ — Mejoras Futuras
- Alerta sonora en dashboard del coordinador
- WhatsApp integration (Twilio)
- CCTV / Drones
- IA para sugerencias automáticas
- Tracking GPS en tiempo real
- Sincronización offline

## 13. Stack Tecnológico
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- insforge
- Mobile First
- PWA

---

*Creado: 10 de Abril, 2026*  
*Última actualización: 10 de Abril, 2026*  
*Versión: 4.0.0 (Fase 4 Completada)*
