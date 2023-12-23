import { encryptContent, decryptContent } from './encryption.js'

export const handleTextEncryption = async (form) => {
  form.querySelector('#decrypted').classList.add('hidden')

  const wrapper = form.querySelector('#encrypted')
  wrapper.innerText = 'encrypting ...'
  wrapper.classList.remove('hidden')

  const { content, passphrase } = getContents(form)

  if (!content || !passphrase) {
    return
  }

  const encrypted = await encryptContent(content, passphrase)

  wrapper.innerText = encrypted

  wrapper.addEventListener('click', () => copyToClipboard(wrapper, encrypted))
}

export const handleTextDecryption = async (form) => {
  form.querySelector('#encrypted').classList.add('hidden')

  const wrapper = form.querySelector('#decrypted')

  wrapper.classList.remove('error')
  wrapper.innerText = 'decrypting ...'

  const { content, passphrase } = getContents(form)

  if (!content || !passphrase) {
    return
  }

  try {
    const decrypted = await decryptContent(content, passphrase)

    wrapper.innerText = decrypted

    wrapper.addEventListener('click', () => copyToClipboard(wrapper, decrypted))

  } catch (error) {

    wrapper.innerText = 'Something went wrong, please make sure to use your previously encrypted text and the correct passphrase.'
    wrapper.classList.add('error')

    console.log(error)
  }

  wrapper.classList.remove('hidden')
}

export const handleFileEncryption = async (form) => {
  form.querySelector('#decrypted').classList.add('hidden')

  const wrapper = form.querySelector('#encrypted')
  wrapper.classList.remove('hidden')
  wrapper.innerText = 'encrypting ...'

  const { contents, passphrase, name, ext, type } = await getFileData(form)

  if (!contents || !passphrase || !name || !ext || !type) {
    return
  }

  const encrypted = await encryptContent(contents, passphrase)

  downloadFile(encrypted, `${name}.${ext}.enc`, type)
}

export const handleFileDecryption = async (form) => {
  form.querySelector('#encrypted').classList.add('hidden')

  const wrapper = form.querySelector('#decrypted')
  wrapper.classList.remove('hidden')
  wrapper.innerText = 'decrypting ...'

  const { contents, passphrase, name, ext, type } = await getFileData(form)

  const decrypted = await decryptContent(contents, passphrase)

  downloadFile(decrypted, name, type)
}

/**
 * Return the form contents (content and passphrase).
 *
 * @param {HTMLFormElement} form The form element
 * @returns {object}
 */
const getContents = (form) => {
  const contentInput = form.querySelector('#content')
  const content = contentInput.value
  contentInput.classList[content ? 'remove' : 'add']('error')

  const passphraseInput = form.querySelector('#passphrase')
  const passphrase = passphraseInput.value
  passphraseInput.classList[passphrase ? 'remove' : 'add']('error')

  return { content, passphrase }
}

/**
 * Return the file data (contents, passphrase, name, ext, type).
 *
 * @param {HTMLFormElement} form The form element
 * @returns {object}
 */
const getFileData = async (form) => {
  const fileInput = form.querySelector('#file')
  const file = fileInput.files[0]
  fileInput.classList[file ? 'remove' : 'add']('error')

  const fileName = file.name.split('.')
  const ext = fileName[fileName.length - 1]
  fileName.pop()
  const name = fileName.join('.')
  const type = file.type

  const buff = await file.arrayBuffer()
  const contentsArr = new Uint8Array(buff)
  const contents = new TextDecoder().decode(contentsArr).trim()

  const passphraseInput = form.querySelector('#passphrase')
  const passphrase = passphraseInput.value
  passphraseInput.classList[passphrase ? 'remove' : 'add']('error')

  return { contents, passphrase, name, ext, type }
}

/**
 * Download the encrypted or decrypted file.
 *
 * @param {string} contents The encrypted or decrypted content
 * @param {string} fileName The file name
 * @param {string} type The file type
 */
const downloadFile = (contents, fileName, type = null) => {
  const blob = new Blob([contents], { type: type || 'application/octet-stream' })
  const blobUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName

  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
  )

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
    link.remove()
  }, 100)
}

const copyToClipboard = async (wrapper, text) => {
  await navigator.clipboard.writeText(text)

  wrapper.classList.add('copied')
  setTimeout(() => wrapper.classList.remove('copied'), 1500)
}
