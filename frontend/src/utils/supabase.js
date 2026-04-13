import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.info('🔧 Modo desarrollo: Supabase no configurado, usando modo mock');
  supabase = createClient('https://mock.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.xxMOCKxx', {
    auth: { persistSession: false }
  });
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Invoca una Edge Function pasando el access token en el body como `_token`.
 * Necesario porque el gateway de Supabase con verify_jwt=false no reenvía
 * el header Authorization al runtime de Deno (comportamiento del proxy).
 *
 * @param {string} fnName - Nombre de la Edge Function
 * @param {{ body?: object, headers?: object }} options
 */
export async function invokeFunction(fnName, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  return supabase.functions.invoke(fnName, {
    ...options,
    body: {
      ...options.body,
      _token: session?.access_token ?? null,
    },
  });
}

export { supabase };
