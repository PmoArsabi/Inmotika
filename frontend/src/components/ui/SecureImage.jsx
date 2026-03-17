import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * SecureImage - Displays an image from a private Supabase Storage bucket
 * by generating a temporary Signed URL.
 * 
 * @param {string} path - Relative path in the storage bucket.
 * @param {string} bucket - Storage bucket name (default: 'inmotika').
 * @param {string} alt - Alt text for the image.
 * @param {string} className - Additional CSS classes.
 * @param {React.ReactNode} fallback - Element to show if path is empty or error occurs.
 * @param {number} expiresIn - Expiration time for the signed URL in seconds.
 */
const SecureImage = ({ 
  path, 
  bucket = 'inmotika', 
  alt = '', 
  className = '', 
  fallback = null,
  expiresIn = 3600 
}) => {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSecureUrl = async () => {
      if (!path) {
        setLoading(false);
        return;
      }

      // Handle local blob URLs (previews before saving)
      if (path.startsWith('blob:')) {
        setUrl(path);
        setLoading(false);
        return;
      }

      // Handle already full URLs (external)
      if (path.startsWith('http')) {
        setUrl(path);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);

        const { data, error: signedError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn);

        if (signedError) throw signedError;

        if (isMounted) {
          setUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('[SecureImage] Error generating signed URL:', err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSecureUrl();

    return () => {
      isMounted = false;
    };
  }, [path, bucket, expiresIn]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
        <Loader2 size={16} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || (!path && fallback)) {
    return fallback || (
      <div className={`flex items-center justify-center bg-gray-50 text-gray-400 ${className}`}>
        <AlertCircle size={16} />
      </div>
    );
  }

  if (!url) return fallback;

  return (
    <img 
      src={url} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)}
    />
  );
};

export default SecureImage;
