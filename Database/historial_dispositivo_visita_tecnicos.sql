-- Extiende el historial de visita para registrar también altas/bajas de técnicos.
-- Ejecutar en SQL Editor del proyecto Supabase (después de historial_dispositivo_visita.sql).

ALTER TABLE public.historial_dispositivo_visita
  ALTER COLUMN dispositivo_id DROP NOT NULL;

ALTER TABLE public.historial_dispositivo_visita
  ADD COLUMN IF NOT EXISTS tipo_entidad text NOT NULL DEFAULT 'DISPOSITIVO';

ALTER TABLE public.historial_dispositivo_visita
  ADD COLUMN IF NOT EXISTS tecnico_id uuid REFERENCES public.tecnico(id);

ALTER TABLE public.historial_dispositivo_visita
  DROP CONSTRAINT IF EXISTS historial_dispositivo_visita_tipo_check;

ALTER TABLE public.historial_dispositivo_visita
  ADD CONSTRAINT historial_dispositivo_visita_tipo_check
    CHECK (tipo_entidad IN ('DISPOSITIVO', 'TECNICO'));

ALTER TABLE public.historial_dispositivo_visita
  DROP CONSTRAINT IF EXISTS historial_dispositivo_visita_entidad_check;

ALTER TABLE public.historial_dispositivo_visita
  ADD CONSTRAINT historial_dispositivo_visita_entidad_check
    CHECK (
      (tipo_entidad = 'DISPOSITIVO' AND dispositivo_id IS NOT NULL)
      OR (tipo_entidad = 'TECNICO' AND tecnico_id IS NOT NULL)
    );

CREATE INDEX IF NOT EXISTS idx_historial_dispositivo_visita_tecnico_id
  ON public.historial_dispositivo_visita (tecnico_id);

NOTIFY pgrst, 'reload schema';
