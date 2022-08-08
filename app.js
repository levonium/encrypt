(() => {
  const form = document.querySelector('form')

  form.querySelector('#Encrypt').addEventListener('click', async (e) => {
    e.preventDefault()

    const wrapper = form.querySelector('#encrypted')
    wrapper.innerText = 'encrypting ...'

    const { content, pass } = getContents()

    if (!content || !pass) {
      return
    }

    const encrypted = await encryptContent(content, pass)

    wrapper.innerText = encrypted
    wrapper.classList.remove('hidden')

    wrapper.addEventListener('click', () => copyToClipboard(wrapper, encrypted))
  })

  form.querySelector('#Decrypt').addEventListener('click', async (e) => {
    e.preventDefault()

    const wrapper = form.querySelector('#decrypted')
    wrapper.classList.remove('error')
    wrapper.innerText = 'decrypting ...'

    const { content, pass } = getContents()

    if (!content || !pass) {
      return
    }

    try {
      const decrypted = await decryptContent(content, pass)

      wrapper.innerText = decrypted

      wrapper.addEventListener('click', () => copyToClipboard(wrapper, decrypted))

    } catch (error) {

      wrapper.innerText = 'Something went wrong, please make sure to use your previously encrypted text and the correct passphrase.'
      wrapper.classList.add('error')

      console.log(error)
    }

    wrapper.classList.remove('hidden')
  })

  /**
   * Returns the form contents (content and pass).
   *
   * @returns {object}
   */
   const getContents = () => {
    const contentInput = form.querySelector('textarea')
    const content = contentInput.value
    contentInput.classList[content ? 'remove' : 'add']('error')

    const passInput = form.querySelector('input')
    const pass = passInput.value
    passInput.classList[pass ? 'remove' : 'add']('error')

    return { content, pass }
  }

  const copyToClipboard = async (wrapper, text) => {
    await navigator.clipboard.writeText(text)

    wrapper.classList.add('copied')
    setTimeout(() => wrapper.classList.remove('copied'), 1500)
  }

  /**
   * Converts ArrayBuffer to string
   *
   * @param {ArrayBuffer} buffer
   * @returns string
   */
  const arrayBufferToString = (buffer) => {
    return window.btoa(
      String.fromCharCode.apply(null, new Uint8Array(buffer))
    )
  }

  /**
   * Converts string to ArrayBuffer
   *
   * @param {string} str
   * @returns ArrayBuffer
   */
  const stringToArrayBuffer = (str) => {

    const string = window.atob(str)
    const buffer = new ArrayBuffer(string.length)
    const bufferView = new Uint8Array(buffer)

    for (let i = 0; i < string.length; i++) {
      bufferView[i] = string.charCodeAt(i)
    }

    return buffer
  }

  /**
   * Concatenates encrypted text, salt and iv into a single Uint8Array
   *
   * @param {Uint8Array} text
   * @param {Uint8Array} salt
   * @param {Uint8Array} iv
   * @returns Uint8Array
   */
  const concatUint8Arrays = (text, salt, iv) => {
    let size = text.length + 32 + 12
    let result = new Uint8Array(size)

    result.set(salt, 0)
    result.set(iv, 32)
    result.set(text, 32 + 12)

    return result
  }

  /**
   * Creates a CryptoKey to encrypt/decrypt the content.
   *
   * @param {string} passphrase  User provided passphrase
   * @param {Uint8Array} salt    The salt
   * @param {Array} usage        Array of strings, what the key should be used for
   * @returns CryptoKey
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
        hash: { name: 'SHA-256'}
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      usage
    )
  }

  /**
   * Encrypts the provided content using the provided passphrase
   * Returns the an encoded string containing the encrypted content,
   * salt and IV used for encryption, which should be used for decryption as well.
   *
   * @param {string} data   The string content to be encrypted
   * @param {string} passphrase  The passphrase used for encrypted, provided by the user
   * @returns string
   */
  const encryptContent = async (data, passphrase) => {

    const salt = window.crypto.getRandomValues(new Uint8Array(32)) // Uint8Array
    const iv = window.crypto.getRandomValues(new Uint8Array(12)) // Uint8Array

    const key = await getCryptoKey(passphrase, salt)

    const encrypted = await window.crypto.subtle.encrypt({
      name: 'AES-GCM',
      iv,
    }, key, new TextEncoder().encode(data)) // ArrayBuffer

    const encryptedUint8Array = new Uint8Array(encrypted) // Uint8Array
    const concatenated = concatUint8Arrays(encryptedUint8Array, salt, iv) // Uint8Array
    const stringified = arrayBufferToString(concatenated)

    return stringified
  }

  /**
   * Decrypts the encrypted content, provided the text content
   * that contains the encryption salt and iv as well.
   *
   * @param {string} text        The decrypted string
   * @param {string} passphrase  The user provided passphrase
   * @returns string
   */
  const decryptContent = async (text, passphrase) => {

    const arrayBuffer = stringToArrayBuffer(text)

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
})()
