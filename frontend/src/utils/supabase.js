import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Crear un cliente mock si no hay variables de entorno
let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  // Crear un cliente mock con valores dummy (solo en desarrollo)
  if (import.meta.env.DEV) {
    console.info('🔧 Modo desarrollo: Supabase no configurado, usando modo mock');
  }
  supabase = createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
