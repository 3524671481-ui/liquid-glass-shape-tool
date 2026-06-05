// Glass Controls System
window.glassControls = {
  edgeIntensity: 0.01,
  rimIntensity: 0.05,
  baseIntensity: 0.01,
  edgeDistance: 0.15,
  rimDistance: 0.8,
  baseDistance: 0.1,
  cornerBoost: 0.02,
  rippleEffect: 0.1,
  blurRadius: 5.0,
  tintOpacity: 0.2,
  warp: false,
  hideButtons: false
}

// Update all glass instances with new parameters
function updateAllGlassInstances() {
  Container.instances.forEach(instance => {
    if (instance.gl_refs && instance.gl_refs.gl) {
      const gl = instance.gl_refs.gl
      gl.useProgram(gl.getParameter(gl.CURRENT_PROGRAM))

      // Update blur radius
      if (instance.gl_refs.blurRadiusLoc) {
        gl.uniform1f(instance.gl_refs.blurRadiusLoc, window.glassControls.blurRadius)
      }

      // Update glass effect parameters
      if (instance.gl_refs.edgeIntensityLoc) {
        gl.uniform1f(instance.gl_refs.edgeIntensityLoc, window.glassControls.edgeIntensity)
      }
      if (instance.gl_refs.rimIntensityLoc) {
        gl.uniform1f(instance.gl_refs.rimIntensityLoc, window.glassControls.rimIntensity)
      }
      if (instance.gl_refs.baseIntensityLoc) {
        gl.uniform1f(instance.gl_refs.baseIntensityLoc, window.glassControls.baseIntensity)
      }
      if (instance.gl_refs.edgeDistanceLoc) {
        gl.uniform1f(instance.gl_refs.edgeDistanceLoc, window.glassControls.edgeDistance)
      }
      if (instance.gl_refs.rimDistanceLoc) {
        gl.uniform1f(instance.gl_refs.rimDistanceLoc, window.glassControls.rimDistance)
      }
      if (instance.gl_refs.baseDistanceLoc) {
        gl.uniform1f(instance.gl_refs.baseDistanceLoc, window.glassControls.baseDistance)
      }
      if (instance.gl_refs.cornerBoostLoc) {
        gl.uniform1f(instance.gl_refs.cornerBoostLoc, window.glassControls.cornerBoost)
      }
      if (instance.gl_refs.rippleEffectLoc) {
        gl.uniform1f(instance.gl_refs.rippleEffectLoc, window.glassControls.rippleEffect)
      }
      if (instance.gl_refs.warpLoc) {
        gl.uniform1f(instance.gl_refs.warpLoc, window.glassControls.warp ? 1.0 : 0.0)
      }
      if (instance.gl_refs.tintOpacityLoc) {
        // Use instance's own tintOpacity, but allow global control to override for demonstration
        const tintOpacity =
          instance === window.controlsContainer ? instance.tintOpacity : window.glassControls.tintOpacity
        gl.uniform1f(instance.gl_refs.tintOpacityLoc, tintOpacity)
      }

      // Force immediate re-render
      if (instance.render) {
        instance.render()
      }
    }
  })
}

// Set up slider event listeners
function setupControlSliders() {
  const sliders = [
    { id: 'edgeIntensity', prop: 'edgeIntensity', valueId: 'edgeValue' },
    { id: 'rimIntensity', prop: 'rimIntensity', valueId: 'rimValue' },
    { id: 'baseIntensity', prop: 'baseIntensity', valueId: 'baseValue' },
    { id: 'edgeDistance', prop: 'edgeDistance', valueId: 'edgeDistValue' },
    { id: 'rimDistance', prop: 'rimDistance', valueId: 'rimDistValue' },
    { id: 'baseDistance', prop: 'baseDistance', valueId: 'baseDistValue' },
    { id: 'cornerBoost', prop: 'cornerBoost', valueId: 'cornerValue' },
    { id: 'rippleEffect', prop: 'rippleEffect', valueId: 'rippleValue' },
    { id: 'blurRadius', prop: 'blurRadius', valueId: 'blurValue' },
    { id: 'tintOpacity', prop: 'tintOpacity', valueId: 'tintValue' }
  ]

  sliders.forEach(({ id, prop, valueId }) => {
    const slider = document.getElementById(id)
    const valueDisplay = document.getElementById(valueId)

    if (slider && valueDisplay) {
      slider.addEventListener('input', e => {
        const value = parseFloat(e.target.value)
        window.glassControls[prop] = value
        valueDisplay.textContent = value.toFixed(3)
        updateAllGlassInstances()
      })
    }
  })

  // Set up warp toggle checkbox
  const warpToggle = document.getElementById('warpToggle')
  if (warpToggle) {
    warpToggle.addEventListener('change', e => {
      window.glassControls.warp = e.target.checked
      updateAllGlassInstances()
    })
  }

  // Set up hide buttons toggle checkbox
  const hideButtonsToggle = document.getElementById('hideButtonsToggle')
  if (hideButtonsToggle) {
    hideButtonsToggle.addEventListener('change', e => {
      window.glassControls.hideButtons = e.target.checked
      toggleButtonsVisibility()
    })
  }

  setupSvgImport()

  // Set up randomize button
  const randomizeButton = document.getElementById('randomizeButton')
  if (randomizeButton) {
    randomizeButton.addEventListener('click', () => {
      randomizeGlassEffects()
    })
  }
}

// Function to randomize glass effect values for creative exploration
function randomizeGlassEffects() {
  // Generate random values within creative ranges (avoiding extremes)
  const randomValues = {
    edgeIntensity: 0.005 + Math.random() * 0.025, // 0.005 to 0.03
    rimIntensity: 0.02 + Math.random() * 0.13, // 0.02 to 0.15
    baseIntensity: 0.005 + Math.random() * 0.025, // 0.005 to 0.03
    edgeDistance: 0.1 + Math.random() * 0.3, // 0.1 to 0.4
    rimDistance: 0.3 + Math.random() * 1.2, // 0.3 to 1.5
    baseDistance: 0.08 + Math.random() * 0.17, // 0.08 to 0.25
    cornerBoost: 0.01 + Math.random() * 0.05, // 0.01 to 0.06
    rippleEffect: 0.05 + Math.random() * 0.25, // 0.05 to 0.3
    blurRadius: 2 + Math.random() * 10, // 2 to 12
    tintOpacity: 0.1 + Math.random() * 0.7, // 0.1 to 0.8
    warp: Math.random() < 0.3 // 30% chance
  }

  // Update global controls
  Object.assign(window.glassControls, randomValues)

  // Update all sliders and their display values
  Object.entries(randomValues).forEach(([key, value]) => {
    if (key === 'warp') {
      const checkbox = document.getElementById('warpToggle')
      if (checkbox) {
        checkbox.checked = value
      }
    } else {
      // Find corresponding slider and value display
      const sliderConfig = [
        { prop: 'edgeIntensity', id: 'edgeIntensity', valueId: 'edgeValue' },
        { prop: 'rimIntensity', id: 'rimIntensity', valueId: 'rimValue' },
        { prop: 'baseIntensity', id: 'baseIntensity', valueId: 'baseValue' },
        { prop: 'edgeDistance', id: 'edgeDistance', valueId: 'edgeDistValue' },
        { prop: 'rimDistance', id: 'rimDistance', valueId: 'rimDistValue' },
        { prop: 'baseDistance', id: 'baseDistance', valueId: 'baseDistValue' },
        { prop: 'cornerBoost', id: 'cornerBoost', valueId: 'cornerValue' },
        { prop: 'rippleEffect', id: 'rippleEffect', valueId: 'rippleValue' },
        { prop: 'blurRadius', id: 'blurRadius', valueId: 'blurValue' },
        { prop: 'tintOpacity', id: 'tintOpacity', valueId: 'tintValue' }
      ].find(config => config.prop === key)

      if (sliderConfig) {
        const slider = document.getElementById(sliderConfig.id)
        const valueDisplay = document.getElementById(sliderConfig.valueId)

        if (slider) {
          slider.value = value
        }
        if (valueDisplay) {
          valueDisplay.textContent = value.toFixed(3)
        }
      }
    }
  })

  // Apply the randomized values to all glass instances
  updateAllGlassInstances()

  console.log('🎲 Glass effects randomized!', randomValues)
}

// Function to toggle visibility of all glass buttons/containers
function toggleButtonsVisibility() {
  const demoLayout = document.getElementById('demo-layout')
  if (demoLayout) {
    demoLayout.style.display = window.glassControls.hideButtons ? 'none' : 'flex'
  }
}

function setupSvgImport() {
  const fileInput = document.getElementById('svgFileInput')
  const status = document.getElementById('svgImportStatus')

  if (!fileInput) return

  fileInput.addEventListener('change', async event => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const svgText = await readFileAsText(file)
      const maskDataUrl = await rasterizeSvgToMask(svgText)
      updateImportedSvgButton(maskDataUrl)

      if (status) {
        status.textContent = `已导入：${file.name}，正在使用 SVG 原始形状作为按钮遮罩。`
      }
    } catch (error) {
      if (status) {
        status.textContent = `导入失败：${error.message}`
      }
      console.error('SVG import failed:', error)
    }
  })
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('无法读取 SVG 文件'))
    reader.readAsText(file)
  })
}

function rasterizeSvgToMask(svgText) {
  return new Promise((resolve, reject) => {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
    if (doc.querySelector('parsererror') || !doc.querySelector('svg')) {
      reject(new Error('SVG 文件格式无效'))
      return
    }

    const svg = doc.querySelector('svg')
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const image = new Image()
    const svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' })
    const objectUrl = URL.createObjectURL(svgBlob)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const canvas = document.createElement('canvas')
      const size = 768
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(image, 0, 0, size, size)

      removeSolidSvgBackground(ctx, size, size)
      encodeMaskDistanceField(ctx, size, size)
      resolve(canvas.toDataURL('image/png'))
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('SVG 图像无法渲染'))
    }

    image.src = objectUrl
  })
}

function encodeMaskDistanceField(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const source = imageData.data
  const pixelCount = width * height
  const inside = new Uint8Array(pixelCount)
  const distance = new Float32Array(pixelCount)
  const maxDistance = 96
  const diagonalCost = Math.SQRT2

  for (let i = 0; i < pixelCount; i++) {
    const alpha = source[i * 4 + 3]
    inside[i] = alpha > 24 ? 1 : 0
    distance[i] = inside[i] ? maxDistance : 0
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x
      if (!inside[index]) continue

      let value = distance[index]
      if (x > 0) value = Math.min(value, distance[index - 1] + 1)
      if (y > 0) value = Math.min(value, distance[index - width] + 1)
      if (x > 0 && y > 0) value = Math.min(value, distance[index - width - 1] + diagonalCost)
      if (x < width - 1 && y > 0) value = Math.min(value, distance[index - width + 1] + diagonalCost)
      distance[index] = value
    }
  }

  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const index = y * width + x
      if (!inside[index]) continue

      let value = distance[index]
      if (x < width - 1) value = Math.min(value, distance[index + 1] + 1)
      if (y < height - 1) value = Math.min(value, distance[index + width] + 1)
      if (x < width - 1 && y < height - 1) value = Math.min(value, distance[index + width + 1] + diagonalCost)
      if (x > 0 && y < height - 1) value = Math.min(value, distance[index + width - 1] + diagonalCost)
      distance[index] = value
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x
      const offset = index * 4
      const alpha = source[offset + 3]

      if (!inside[index]) {
        source[offset] = 128
        source[offset + 1] = 128
        source[offset + 2] = 0
        source[offset + 3] = 0
        continue
      }

      const left = distance[y * width + Math.max(0, x - 1)]
      const right = distance[y * width + Math.min(width - 1, x + 1)]
      const top = distance[Math.max(0, y - 1) * width + x]
      const bottom = distance[Math.min(height - 1, y + 1) * width + x]
      const normalX = left - right
      const normalY = top - bottom
      const normalLength = Math.hypot(normalX, normalY) || 1

      source[offset] = Math.round(((normalX / normalLength) * 0.5 + 0.5) * 255)
      source[offset + 1] = Math.round(((normalY / normalLength) * 0.5 + 0.5) * 255)
      source[offset + 2] = Math.round((Math.min(distance[index], maxDistance) / maxDistance) * 255)
      source[offset + 3] = alpha
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

function removeSolidSvgBackground(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const cornerIndexes = [0, width - 1, (height - 1) * width, height * width - 1].map(index => index * 4)
  const corners = cornerIndexes.map(index => ({
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3]
  }))
  const background = corners.find(color => color.a > 240)

  if (!background) return

  let matchingCorners = 0
  corners.forEach(color => {
    const distance =
      Math.abs(color.r - background.r) + Math.abs(color.g - background.g) + Math.abs(color.b - background.b)
    if (color.a > 240 && distance < 18) matchingCorners += 1
  })

  if (matchingCorners < 3) return

  for (let i = 0; i < data.length; i += 4) {
    const distance =
      Math.abs(data[i] - background.r) + Math.abs(data[i + 1] - background.g) + Math.abs(data[i + 2] - background.b)
    if (data[i + 3] > 240 && distance < 18) {
      data[i + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

function updateImportedSvgButton(dataUrl) {
  if (!window.primaryShapeButton) return

  window.primaryShapeButton.setGeometrySize(window.primaryShapeButton.width, window.primaryShapeButton.height, 'custom')
  window.primaryShapeButton.setMaskImage(dataUrl)
}

// Create glass container for controls panel
function initializeControlsContainer() {
  window.controlsContainer = new Container({
    borderRadius: 12,
    type: 'rounded',
    tintOpacity: 0.7
  })

  // Get the existing controls wrapper and move existing content behind the glass
  const controlsWrapper = document.getElementById('glass-controls-container')
  const controlsContent = document.getElementById('controls-content')

  // Remove controls content from wrapper temporarily
  controlsWrapper.removeChild(controlsContent)

  // Add glass container to wrapper
  controlsWrapper.appendChild(window.controlsContainer.element)

  // Add controls content back on top of glass
  window.controlsContainer.element.appendChild(controlsContent)

  // Force the container to update its size based on CSS
  setTimeout(() => {
    window.controlsContainer.updateSizeFromDOM()
  }, 100)
}

// Mobile controls toggle functionality
function setupMobileToggle() {
  const toggleButton = document.getElementById('mobile-controls-toggle')
  const controlsContainer = document.getElementById('glass-controls-container')

  if (toggleButton && controlsContainer) {
    toggleButton.addEventListener('click', () => {
      const isCollapsed = controlsContainer.classList.toggle('collapsed')
      toggleButton.classList.toggle('active', !isCollapsed)
      toggleButton.setAttribute('aria-expanded', String(!isCollapsed))
    })

    // Initialize toggle button accessibility
    toggleButton.classList.add('active')
    toggleButton.setAttribute('aria-expanded', 'true')
  }
}

// Initialize controls system
function initializeControls() {
  initializeControlsContainer()
  setupControlSliders()
  setupMobileToggle()
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeControls)
} else {
  initializeControls()
}
