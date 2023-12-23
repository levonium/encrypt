import { generatePassphrase } from './encryption.js'
import {
  handleTextEncryption, handleTextDecryption,
  handleFileEncryption, handleFileDecryption
} from './dom.js'

(() => {
  const form = document.querySelector('form')

  form.addEventListener('submit', (e) => e.preventDefault())

  /**
   * Switch between content and file encryption/decryption.
   */
  const switchFormsButtons = document.querySelectorAll('button[data-type]')
  if (switchFormsButtons) {
    switchFormsButtons.forEach((button) => {
      button.addEventListener('click', () => {
        form.dataset.type = button.dataset.type
        switchFormsButtons.forEach(button => button.classList.remove('selected'))
        button.classList.add('selected')
        form.querySelectorAll('.wrap').forEach(wrap => wrap.classList.add('hidden'))
        form.querySelector('#passphrase').value = ''
        form.querySelectorAll('.wrap').forEach(wrap => wrap.classList.add('hidden'))
      })
    })
  }

  /**
   * Encrypt content or file.
   */
  form.querySelector('#encrypt').addEventListener('click', async (e) => {
    e.preventDefault()

    if (form.dataset.type === 'content') {
      handleTextEncryption(form)
      return
    }

    if (form.dataset.type === 'file') {
      handleFileEncryption(form)
      return
    }
  })

  /**
   * Decrypt content or file.
   */
  form.querySelector('#decrypt').addEventListener('click', async (e) => {
    e.preventDefault()

    if (form.dataset.type === 'content') {
      handleTextDecryption(form)
      return
    }

    if (form.dataset.type === 'file') {
      handleFileDecryption(form)
      return
    }
  })

  /**
   * Generate a random passphrase.
   */
  const generatePassphraseButton = document.querySelector('#generate-passphrase')
  if (generatePassphraseButton) {
    generatePassphraseButton.addEventListener('click', async () => {
      document.querySelector('#passphrase').value = await generatePassphrase()
    })
  }

  /**
   * Open/close the dialogs.
   */
  document.querySelectorAll('.open-dialog').forEach(button => button.addEventListener('click', () => {
    document.querySelector(`dialog.${button.dataset.dialog}`).showModal()
  }))
  document.querySelectorAll('dialog button.close').forEach(button => button.addEventListener('click', () => {
    button.closest('dialog').close()
  }))
})()
