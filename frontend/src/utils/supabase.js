import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[Inmotika] Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
