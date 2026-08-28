-- Excluye documentos FIRMA de lo que un contacto puede listar por visita.
-- Ejecutar en SQL Editor del proyecto Supabase.

CREATE OR REPLACE FUNCTION public.get_documentos_tecnicos_visita(p_visita_id uuid)
RETURNS TABLE (
  doc_id      uuid,
  usuario_id  uuid,
  nombre      varchar,
  tipo        varchar,
  url         text,
  tecnico_nombres   text,
  tecnico_apellidos text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contacto_id uuid;
  v_caller_email text;
BEGIN
  SELECT pu.email INTO v_caller_email
  FROM public.perfil_usuario pu
  WHERE pu.id = auth.uid()
  LIMIT 1;

  SELECT c.id INTO v_contacto_id
  FROM public.contacto c
  WHERE c.usuario_id = auth.uid()
     OR (c.usuario_id IS NULL AND LOWER(c.email) = LOWER(v_caller_email))
  LIMIT 1;

  IF v_contacto_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.contacto c2
  SET usuario_id = auth.uid(), updated_at = now()
  WHERE c2.id = v_contacto_id
    AND c2.usuario_id IS NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM public.visita v
    JOIN public.contacto_sucursal cs ON cs.sucursal_id = v.sucursal_id
    WHERE v.id = p_visita_id
      AND cs.contacto_id = v_contacto_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ud.id,
    ud.usuario_id,
    ud.nombre,
    ud.tipo,
    ud.url,
    pu.nombres::text,
    pu.apellidos::text
  FROM public.visita_tecnico vt
  JOIN public.tecnico t        ON t.id = vt.tecnico_id
  JOIN public.perfil_usuario pu ON pu.id = t.usuario_id
  JOIN public.usuario_documento ud ON ud.usuario_id = pu.id
  WHERE vt.visita_id = p_visita_id
    AND ud.activo = true
    AND UPPER(TRIM(COALESCE(ud.tipo, ''))) <> 'FIRMA'
    AND UPPER(TRIM(COALESCE(ud.nombre, ''))) <> 'FIRMA'
  ORDER BY pu.nombres, ud.tipo, ud.nombre;
END;
$$;
