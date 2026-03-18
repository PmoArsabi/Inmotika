import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Crear un cliente mock si no hay variables de entorno
let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  // Crear un cliente mock con valores dummy (solo en desarrollo o cuando no hay .env)
  console.info('🔧 Modo desarrollo: Supabase no configurado, usando modo mock');
  supabase = createClient('https://mock.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.xxMOCKxx', {
    auth: { persistSession: false }
  });
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
