-- Permite a contactos (rol CLIENTE) generar evidencias fotográficas
-- de visitas de sus sucursales. Ejecutar en SQL Editor.

DROP POLICY IF EXISTS "storage_select" ON storage.objects;

CREATE POLICY "storage_select" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inmotika' AND (
    public.is_management_staff()
    OR (
      (storage.foldername(name))[1] = 'usuarios'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    OR (
      (storage.foldername(name))[1] = 'evidencias'
      AND public.is_tecnico_asignado_visita(((storage.foldername(name))[2])::uuid)
    )
    OR (
      (storage.foldername(name))[1] = 'evidencias'
      AND public.is_contacto_of_visita(((storage.foldername(name))[2])::uuid)
    )
  )
);
