-- 1. Función Helper que incluye explícitamente al rol DIRECTOR
CREATE OR REPLACE FUNCTION public.is_management_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfil_usuario p
    JOIN public.catalogo_rol r ON p.rol_id = r.id
    WHERE p.id = auth.uid() 
    AND r.codigo IN ('ADMIN', 'DIRECTOR', 'COORDINADOR')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Habilitar RLS en las tablas de roles especializados
ALTER TABLE public.director ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecnico ENABLE ROW LEVEL SECURITY;

-- 3. Aplicar políticas de acceso para todo el personal de gestión (Admin/Director/Coord)
DROP POLICY IF EXISTS "Management staff access" ON public.director;
CREATE POLICY "Management staff access" ON public.director
FOR ALL USING (public.is_management_staff() OR usuario_id = auth.uid());

DROP POLICY IF EXISTS "Management staff access" ON public.coordinador;
CREATE POLICY "Management staff access" ON public.coordinador
FOR ALL USING (public.is_management_staff() OR usuario_id = auth.uid());

DROP POLICY IF EXISTS "Management staff access" ON public.tecnico;
CREATE POLICY "Management staff access" ON public.tecnico
FOR ALL USING (public.is_management_staff() OR usuario_id = auth.uid());
