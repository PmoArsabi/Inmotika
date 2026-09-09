-- Historial de altas/bajas de dispositivos en una visita ya programada o en progreso.
-- Ejecutar en SQL Editor del proyecto Supabase.

CREATE TABLE IF NOT EXISTS public.historial_dispositivo_visita (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id uuid NOT NULL REFERENCES public.visita(id) ON DELETE CASCADE,
  solicitud_id uuid REFERENCES public.solicitud_visita(id) ON DELETE SET NULL,
  dispositivo_id uuid REFERENCES public.dispositivo(id),
  tecnico_id uuid REFERENCES public.tecnico(id),
  tipo_entidad text NOT NULL DEFAULT 'DISPOSITIVO',
  accion text NOT NULL,
  motivo text,
  usuario_id uuid REFERENCES public.perfil_usuario(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT historial_dispositivo_visita_accion_check
    CHECK (accion IN ('AGREGADO', 'REMOVIDO')),
  CONSTRAINT historial_dispositivo_visita_tipo_check
    CHECK (tipo_entidad IN ('DISPOSITIVO', 'TECNICO')),
  CONSTRAINT historial_dispositivo_visita_entidad_check
    CHECK (
      (tipo_entidad = 'DISPOSITIVO' AND dispositivo_id IS NOT NULL)
      OR (tipo_entidad = 'TECNICO' AND tecnico_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_historial_dispositivo_visita_visita_id
  ON public.historial_dispositivo_visita (visita_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_historial_dispositivo_visita_dispositivo_id
  ON public.historial_dispositivo_visita (dispositivo_id);

CREATE INDEX IF NOT EXISTS idx_historial_dispositivo_visita_usuario_id
  ON public.historial_dispositivo_visita (usuario_id);

CREATE INDEX IF NOT EXISTS idx_historial_dispositivo_visita_tecnico_id
  ON public.historial_dispositivo_visita (tecnico_id);

ALTER TABLE public.historial_dispositivo_visita ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON TABLE public.historial_dispositivo_visita TO authenticated;
GRANT ALL ON TABLE public.historial_dispositivo_visita TO service_role;

DROP POLICY IF EXISTS "Admin manage historial_dispositivo_visita"
  ON public.historial_dispositivo_visita;
CREATE POLICY "Admin manage historial_dispositivo_visita"
  ON public.historial_dispositivo_visita
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_coordinator())
  WITH CHECK (public.is_admin_or_coordinator());

DROP POLICY IF EXISTS "Authenticated can view historial_dispositivo_visita"
  ON public.historial_dispositivo_visita;
CREATE POLICY "Authenticated can view historial_dispositivo_visita"
  ON public.historial_dispositivo_visita
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
