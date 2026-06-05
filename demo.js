setupDynamicBackground()

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
loadDefaultSvgShape()

function setupDynamicBackground() {
  const canvas = document.getElementById('fluid-background-canvas')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  let media = null
  let mediaType = null

  window.dynamicBackgroundCanvas = canvas

  const defaultBackground = new Image()
  defaultBackground.onload = () => {
    media = defaultBackground
    mediaType = 'image'
  }
  defaultBackground.src = '../../bg.png'

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.round(window.innerWidth * ratio)
    canvas.height = Math.round(window.innerHeight * ratio)
  }

  function drawCover(source) {
    const canvasRatio = canvas.width / canvas.height
    const sourceWidth = source.videoWidth || source.naturalWidth || source.width
    const sourceHeight = source.videoHeight || source.naturalHeight || source.height
    const sourceRatio = sourceWidth / sourceHeight
    let drawWidth = canvas.width
    let drawHeight = canvas.height
    let x = 0
    let y = 0

    if (sourceRatio > canvasRatio) {
      drawWidth = canvas.height * sourceRatio
      x = (canvas.width - drawWidth) / 2
    } else {
      drawHeight = canvas.width / sourceRatio
      y = (canvas.height - drawHeight) / 2
    }

    ctx.drawImage(source, x, y, drawWidth, drawHeight)
  }

  function drawFluid(time) {
    const width = canvas.width
    const height = canvas.height
    const t = time * 0.00018

    ctx.clearRect(0, 0, width, height)

    const base = ctx.createLinearGradient(0, 0, width, height)
    base.addColorStop(0, '#02030a')
    base.addColorStop(0.34, '#071632')
    base.addColorStop(0.58, '#0b7dc0')
    base.addColorStop(0.76, '#6a42cc')
    base.addColorStop(1, '#f0603c')
    ctx.fillStyle = base
    ctx.fillRect(0, 0, width, height)

    for (let i = 0; i < 4; i++) {
      const cx = width * (0.12 + i * 0.24 + Math.sin(t * (1.4 + i * 0.2)) * 0.08)
      const cy = height * (0.18 + i * 0.2 + Math.cos(t * (1.2 + i * 0.3)) * 0.12)
      const radius = Math.max(width, height) * (0.34 - i * 0.035)
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      const colors = ['rgba(0, 214, 255, 0.55)', 'rgba(90, 83, 255, 0.42)', 'rgba(255, 70, 170, 0.32)', 'rgba(255, 105, 45, 0.36)']
      glow.addColorStop(0, colors[i])
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)
    }

    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)'
    ctx.lineWidth = Math.max(1, width / 900)
    for (let x = -width; x < width * 1.6; x += width / 70) {
      ctx.beginPath()
      for (let y = 0; y <= height; y += 18) {
        const wave = Math.sin(y * 0.006 + t * 7) * width * 0.045
        const px = x + y * 0.56 + wave
        if (y === 0) ctx.moveTo(px, y)
        else ctx.lineTo(px, y)
      }
      ctx.stroke()
    }
    ctx.restore()

    const grainCount = 420
    ctx.fillStyle = 'rgba(255, 255, 255, 0.34)'
    for (let i = 0; i < grainCount; i++) {
      const x = (Math.sin(i * 12.9898 + time * 0.00005) * 43758.5453) % 1
      const y = (Math.sin(i * 78.233 + time * 0.00007) * 24634.6345) % 1
      ctx.fillRect(Math.abs(x) * width, Math.abs(y) * height, 1, 1)
    }
  }

  function frame(time) {
    if (media && mediaType === 'image') {
      drawCover(media)
    } else if (media && mediaType === 'video' && media.readyState >= 2) {
      drawCover(media)
    } else {
      drawFluid(time)
    }
    requestAnimationFrame(frame)
  }

  window.setBackgroundMediaFile = file => {
    const url = URL.createObjectURL(file)
    if (media && media.src?.startsWith('blob:')) URL.revokeObjectURL(media.src)

    if (file.type.startsWith('video/')) {
      media = document.createElement('video')
      media.src = url
      media.muted = true
      media.loop = true
      media.playsInline = true
      media.autoplay = true
      mediaType = 'video'
      media.play().catch(() => {})
    } else {
      media = new Image()
      media.src = url
      mediaType = 'image'
    }
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  requestAnimationFrame(frame)
}

function loadDefaultSvgShape() {
  const defaultSvgPath = '../../SVG/%E8%B5%84%E6%BA%90%203.svg'
  const image = new Image()

  image.onload = () => {
    if (!window.rasterizeImageToMask || !window.primaryShapeButton) return

    const mask = window.rasterizeImageToMask(image, image.naturalWidth / image.naturalHeight)
    const size = Math.max(window.primaryShapeButton.width, window.primaryShapeButton.height)
    const width = mask.aspect >= 1 ? size : Math.round(size * mask.aspect)
    const height = mask.aspect >= 1 ? Math.round(size / mask.aspect) : size

    window.primaryShapeButton.setGeometrySize(width, height, 'custom')
    window.primaryShapeButton.setMaskImage(mask.dataUrl)
  }

  image.src = defaultSvgPath
}


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
      const left = parseFloat(element.style.left) || 0
      const top = parseFloat(element.style.top) || 0
      const maxWidthByViewport = Math.max(48, window.innerWidth - left)
      const maxHeightByViewport = Math.max(48, window.innerHeight - top)
      const maxWidth = Math.min(maxWidthByViewport, maxHeightByViewport * resizeState.aspect)
      const nextWidth = Math.max(48, Math.min(maxWidth, resizeState.width + delta))
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
