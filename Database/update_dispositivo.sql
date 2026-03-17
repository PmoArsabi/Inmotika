ALTER TABLE "public"."dispositivo" 
ADD COLUMN IF NOT EXISTS "marca" character varying(255),
ADD COLUMN IF NOT EXISTS "modelo" character varying(255);

-- Comentario informativo
COMMENT ON COLUMN "public"."dispositivo"."marca" IS 'Marca del fabricante del dispositivo';
COMMENT ON COLUMN "public"."dispositivo"."modelo" IS 'Modelo específico del dispositivo';
