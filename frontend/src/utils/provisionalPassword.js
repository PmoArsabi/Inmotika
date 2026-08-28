const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/**
 * Genera una clave provisional aleatoria (sin caracteres ambiguos 0/O/1/l).
 * @param {number} [length=10]
 * @returns {string}
 */
export function generateProvisionalPassword(length = 10) {
  const arr = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 0xffffffff);
  }
  return Array.from(arr, (n) => CHARS[n % CHARS.length]).join('');
}
