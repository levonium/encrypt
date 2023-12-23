/**
 * Encrypt the provided content using the provided passphrase
 * Returns the an encoded string containing the encrypted content,
 * salt and IV used for encryption, which should be used for decryption as well.
 *
 * @param {string} plainText   The string content to be encrypted
 * @param {string} passphrase  The passphrase used for encrypted, provided by the user
 * @returns {Promise<string>}
 */
export const encryptContent = async (plainText, passphrase) => {

  const salt = window.crypto.getRandomValues(new Uint8Array(32)) // Uint8Array
  const iv = window.crypto.getRandomValues(new Uint8Array(12)) // Uint8Array

  const key = await getCryptoKey(passphrase, salt)

  const encrypted = await window.crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv,
  }, key, new TextEncoder().encode(plainText)) // ArrayBuffer

  const encryptedUint8Array = new Uint8Array(encrypted) // Uint8Array
  const concatenated = _concatUint8Arrays(encryptedUint8Array, salt, iv) // Uint8Array
  const stringified = _ab2str(concatenated)

  return stringified
}

/**
 * Decrypt the encrypted content, provided the text content
 * that contains the encryption salt and iv as well.
 *
 * @param {string} cipherText        The decrypted string
 * @param {string} passphrase  The user provided passphrase
 * @returns {Promise<string>}
 */
export const decryptContent = async (cipherText, passphrase) => {

  const arrayBuffer = _str2ab(cipherText)

  const salt = new Uint8Array(arrayBuffer.slice(0, 32))
  const iv = new Uint8Array(arrayBuffer.slice(32, 44))
  const encrypted = new Uint8Array(arrayBuffer.slice(44))

  const key = await getCryptoKey(passphrase, salt, ['decrypt'])

  const decrypted = await window.crypto.subtle.decrypt({
    name: 'AES-GCM',
    iv,
  }, key, encrypted)

  const bytesDecrypted = new Uint8Array(decrypted)

  return new TextDecoder().decode(bytesDecrypted)
}

/**
 * Generate a random passphrase.
 *
 * @returns {Promise<string>}
 */
export const generatePassphrase = async () => {
  const array = new Uint32Array(8)
  window.crypto.getRandomValues(array)

  let passphrase = ''

  for (let i = 0; i < array.length; i++) {
    passphrase += array[i].toString(16).slice(-4)
  }

  return passphrase
}

/**
 * Create a CryptoKey to encrypt/decrypt the content/file.
 *
 * @param {string} passphrase  User provided passphrase
 * @param {Uint8Array} salt    The salt
 * @param {Array} usage        Array of strings, what the key should be used for
 * @returns {Promise<CryptoKey>}
 */
const getCryptoKey = async (passphrase, salt, usage = ['encrypt']) => {

  const importedKey = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return await window.crypto.subtle.deriveKey({
    name: 'PBKDF2',
    salt,
    iterations: 250_000,
    hash: { name: 'SHA-256' }
  },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usage
  )
}

/**
 * Convert ArrayBuffer to string
 *
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
const _ab2str = (buffer) => {
  return window.btoa(
    String.fromCharCode.apply(null, new Uint8Array(buffer))
  )
}

/**
 * Convert string to ArrayBuffer
 *
 * @param {string} str
 * @returns {ArrayBuffer}
 */
const _str2ab = (str) => {

  const string = window.atob(str)
  const buffer = new ArrayBuffer(string.length)
  const bufferView = new Uint8Array(buffer)

  for (let i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i)
  }

  return buffer
}

/**
 * Concatenate encrypted text, salt and iv into a single Uint8Array
 *
 * @param {Uint8Array} text
 * @param {Uint8Array} salt
 * @param {Uint8Array} iv
 * @returns {Uint8Array}
 */
const _concatUint8Arrays = (text, salt, iv) => {
  let size = text.length + 32 + 12
  let result = new Uint8Array(size)

  result.set(salt, 0)
  result.set(iv, 32)
  result.set(text, 32 + 12)

  return result
}
