window.shapeButtons = []

const primaryShape = new Button({
  type: 'pill',
  width: 180,
  height: 72,
  label: 'Imported SVG glass button',
  tintOpacity: 0.22
})

window.shapeButtons.push(primaryShape)
window.primaryShapeButton = primaryShape
document.body.appendChild(primaryShape.element)
setupInteractiveGlassButton(primaryShape)

function setupInteractiveGlassButton(button) {
  const element = button.element
  const resizeHandle = document.createElement('div')
  let dragState = null
  let resizeState = null

  element.classList.add('glass-button-interactive')
  element.style.position = 'fixed'
  element.style.left = '72px'
  element.style.top = '88px'
  element.style.zIndex = '9999'
  element.style.touchAction = 'none'

  resizeHandle.className = 'glass-resize-handle'
  resizeHandle.setAttribute('aria-hidden', 'true')
  element.appendChild(resizeHandle)

  element.addEventListener('pointerdown', event => {
    if (event.target === resizeHandle) return

    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: parseFloat(element.style.left),
      top: parseFloat(element.style.top)
    }

    element.setPointerCapture(event.pointerId)
  })

  resizeHandle.addEventListener('pointerdown', event => {
    event.preventDefault()
    event.stopPropagation()

    resizeState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: button.width,
      height: button.height,
      aspect: button.width / button.height
    }

    element.classList.add('is-resizing')
    resizeHandle.setPointerCapture(event.pointerId)
  })

  window.addEventListener('pointermove', event => {
    if (dragState && event.pointerId === dragState.pointerId) {
      const nextLeft = dragState.left + event.clientX - dragState.startX
      const nextTop = dragState.top + event.clientY - dragState.startY

      element.style.left = Math.max(0, Math.min(window.innerWidth - button.width, nextLeft)) + 'px'
      element.style.top = Math.max(0, Math.min(window.innerHeight - button.height, nextTop)) + 'px'
      if (button.render) button.render()
    }

    if (resizeState && event.pointerId === resizeState.pointerId) {
      const delta = Math.max(event.clientX - resizeState.startX, event.clientY - resizeState.startY)
      const nextWidth = Math.max(48, Math.min(420, resizeState.width + delta))
      const nextHeight = Math.round(nextWidth / resizeState.aspect)

      if (button.useMaskTexture) {
        button.setGeometrySize(nextWidth, nextHeight, 'custom')
      } else {
        button.setGeometrySize(nextWidth, nextHeight, 'pill')
      }
      keepButtonInViewport(button)
    }
  })

  window.addEventListener('pointerup', event => {
    if (dragState && event.pointerId === dragState.pointerId) {
      dragState = null
    }
    if (resizeState && event.pointerId === resizeState.pointerId) {
      resizeState = null
      element.classList.remove('is-resizing')
    }
  })
}

function keepButtonInViewport(button) {
  const element = button.element
  const left = parseFloat(element.style.left) || 0
  const top = parseFloat(element.style.top) || 0

  element.style.left = Math.max(0, Math.min(window.innerWidth - button.width, left)) + 'px'
  element.style.top = Math.max(0, Math.min(window.innerHeight - button.height, top)) + 'px'
  if (button.render) button.render()
}

window.keepButtonInViewport = keepButtonInViewport

let resizeTimeout
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    Container.pageSnapshot = null
    Container.isCapturing = true
    Container.waitingForSnapshot = Container.instances.slice()

    html2canvas(document.body, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      ignoreElements: function (element) {
        return (
          element.classList.contains('glass-container') ||
          element.classList.contains('glass-button') ||
          element.classList.contains('glass-button-text') ||
          element.classList.contains('glass-resize-handle')
        )
      }
    })
      .then(snapshot => {
        Container.pageSnapshot = snapshot
        Container.isCapturing = false

        const img = new Image()
        img.src = snapshot.toDataURL()
        img.onload = () => {
          Container.instances.forEach(instance => {
            if (!instance.gl_refs || !instance.gl_refs.gl) return

            const gl = instance.gl_refs.gl
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, instance.gl_refs.texture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
            gl.uniform2f(instance.gl_refs.textureSizeLoc, img.width, img.height)

            if (instance.render) {
              instance.render()
            }
          })
        }

        Container.waitingForSnapshot = []
      })
      .catch(error => {
        console.error('html2canvas error on resize:', error)
        Container.isCapturing = false
        Container.waitingForSnapshot = []
      })
  }, 300)
})
