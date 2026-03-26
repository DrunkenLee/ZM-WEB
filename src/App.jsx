import { useEffect } from 'react'
import homeTemplate from './template/homeTemplate.html?raw'

const TEMPLATE_SCRIPTS = [
  '/js/jquery-1.12.1.min.js',
  '/js/popper.min.js',
  '/js/bootstrap.min.js',
  '/js/jquery.magnific-popup.js',
  '/js/swiper.min.js',
  '/js/masonry.pkgd.js',
  '/js/owl.carousel.min.js',
  '/js/jquery.nice-select.min.js',
  '/js/slick.min.js',
  '/js/jquery.counterup.min.js',
  '/js/waypoints.min.js',
  '/js/contact.js',
  '/js/jquery.ajaxchimp.min.js',
  '/js/jquery.form.js',
  '/js/jquery.validate.min.js',
  '/js/mail-script.js',
  '/js/custom.js',
]

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[data-template-script="${src}"]`)
    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve()
        return
      }

      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error(`Failed to load script: ${src}`)),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.dataset.templateScript = src
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true'
        resolve()
      },
      { once: true },
    )
    script.addEventListener(
      'error',
      () => reject(new Error(`Failed to load script: ${src}`)),
      { once: true },
    )
    document.body.appendChild(script)
  })

const copyText = async (value) => {
  if (!value) return false

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Fall back below.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  let didCopy = false
  try {
    didCopy = document.execCommand('copy')
  } catch {
    didCopy = false
  }

  textArea.remove()
  return didCopy
}

function App() {
  useEffect(() => {
    let isUnmounted = false

    const bootstrapTemplateScripts = async () => {
      for (const scriptSrc of TEMPLATE_SCRIPTS) {
        if (isUnmounted) return
        await loadScript(scriptSrc)
      }
    }

    bootstrapTemplateScripts().catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error)
    })

    return () => {
      isUnmounted = true
    }
  }, [])

  useEffect(() => {
    const handleCopyClick = async (event) => {
      if (!(event.target instanceof Element)) return
      const targetButton = event.target.closest('[data-copy-text]')
      if (!targetButton) return

      event.preventDefault()

      const value = targetButton.getAttribute('data-copy-text')
      const defaultLabel = targetButton.getAttribute('data-default-label') || 'Copy'
      const copiedLabel = targetButton.getAttribute('data-copied-label') || 'Copied!'
      const failedLabel = targetButton.getAttribute('data-failed-label') || 'Try Again'
      const labelElement = targetButton.querySelector('[data-copy-label]')

      const didCopy = await copyText(value)
      if (labelElement) {
        labelElement.textContent = didCopy ? copiedLabel : failedLabel
      }

      window.setTimeout(() => {
        if (labelElement) {
          labelElement.textContent = defaultLabel
        }
      }, 1400)
    }

    document.addEventListener('click', handleCopyClick)
    return () => {
      document.removeEventListener('click', handleCopyClick)
    }
  }, [])

  return (
    <div
      dangerouslySetInnerHTML={{ __html: homeTemplate }}
      suppressHydrationWarning
    />
  )
}

export default App
