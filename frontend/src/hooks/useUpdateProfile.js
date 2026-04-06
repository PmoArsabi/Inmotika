import { useState } from 'react';
import { supabase } from '../utils/supabase';

/**
 * Hook para actualizar el perfil del usuario autenticado.
 * Maneja:
 *  - Cambio de foto de perfil (upsert en storage con path fijo → no acumula archivos)
 *  - Actualización de avatar_url en perfil_usuario
 *
 * El restablecimiento de contraseña se delega a resetPassword() del AuthContext
 * (flujo por email, mejor práctica con Supabase).
 *
 * @returns {{ uploadAvatar, loading, error }}
 */
export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Sube una nueva foto de perfil y actualiza perfil_usuario.avatar_url.
   * El path es fijo: `avatars/{userId}.{ext}` → upsert sobrescribe el archivo anterior.
   * @param {string} userId - UUID del usuario autenticado
   * @param {File} file - Archivo de imagen seleccionado
   * @returns {Promise<string>} path relativo guardado en avatar_url
   */
  const uploadAvatar = async (userId, file) => {
    setLoading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `avatars/${userId}.${ext}`;

      // upsert: true → sobrescribe si ya existe, evita acumulación de archivos
      const { error: uploadError } = await supabase.storage
        .from('inmotika')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Actualizar la referencia en perfil_usuario
      const { error: updateError } = await supabase
        .from('perfil_usuario')
        .update({ avatar_url: path })
        .eq('id', userId);

      if (updateError) throw updateError;

      return path;
    } catch (err) {
      setError(err.message || 'Error al actualizar la foto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { uploadAvatar, loading, error };
}
