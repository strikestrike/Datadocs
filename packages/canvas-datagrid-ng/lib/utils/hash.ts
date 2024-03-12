import md5 from 'crypto-js/md5';

/**
 * Get md5 hash of a string
 * @param value
 * @returns
 */
export function getMD5Hash(value: string) {
  return md5(value).toString();
}
