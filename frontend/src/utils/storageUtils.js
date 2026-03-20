import { supabase } from './supabase';

/**
 * Uploads a file to Supabase Storage and optionally updates a database record.
 * Following Supabase best practices:
 * 1. deterministic paths (storageFolder/fileName)
 * 2. Store relative path in DB
 * 3. Atomic sequencing (Upload then DB update)
 * 
 * @param {Object} options
 * @param {File|string} options.file - The File object to upload or an existing string path.
 * @param {string} options.fileName - Destination filename (e.g. 'cedula.pdf').
 * @param {string} options.storageFolder - Destination folder (e.g. 'tecnicos/UUID').
 * @param {string} [options.bucket='inmotika'] - Storage bucket name.
 * @param {Object} [options.dbTarget] - Optional DB update target.
 * @param {string} options.dbTarget.table - Table name.
 * @param {string} options.dbTarget.id - Record ID.
 * @param {string} options.dbTarget.column - Column name.
 * @returns {Promise<string>} The final storage path.
 */
export async function uploadAndSyncFile({
  file,
  fileName,
  storageFolder,
  bucket = 'inmotika',
  dbTarget = null
}) {
  // If not a File object, it's either an existing path or empty
  if (!(file instanceof File)) {
    return file;
  }

  const finalPath = `${storageFolder}/${fileName}`;

  try {
    // 1. Upload to Storage (deterministic path)
    console.log(`[storageUtils] Uploading to ${bucket}/${finalPath}...`);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(finalPath, file, { 
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;
    console.log(`[storageUtils] Upload successful: ${finalPath}`);

    // 2. Update Database Record if target provided
    if (dbTarget) {
      const { table, id, column } = dbTarget;
      console.log(`[storageUtils] Syncing DB: ${table}.${column} for ID ${id}...`);
      const { data: updateData, error: dbError } = await supabase
        .from(table)
        .update({ [column]: finalPath })
        .eq('id', id)
        .select();

      if (dbError) throw dbError;
      if (!updateData || updateData.length === 0) {
        console.warn(`[storageUtils] Warning: No rows updated in ${table} for ID ${id}. Record might not exist.`);
      } else {
        console.log(`[storageUtils] DB sync successful.`);
      }
    }

    return finalPath;
  } catch (error) {
    console.error(`[storageUtils] Error uploading/syncing ${fileName}:`, error);
    throw error;
  }
}

/**
 * Deletes a file from Supabase Storage.
 */
export async function deleteFile(path, bucket = 'inmotika') {
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.warn(`[storageUtils] Warn: Could not delete ${path}`, error);
  }
}

/**
 * Returns the public URL for a given storage path.
 */
export function getStorageUrl(path, bucket = 'inmotika') {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already a full URL
  if (path.startsWith('blob:')) return path; // Local preview URL
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}
