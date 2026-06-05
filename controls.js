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

  const shapeWidth = document.getElementById('shapeWidth')
  const shapeHeight = document.getElementById('shapeHeight')
  const shapeWidthValue = document.getElementById('shapeWidthValue')
  const shapeHeightValue = document.getElementById('shapeHeightValue')

  function updatePrimaryShapeGeometry() {
    if (!window.primaryShapeButton) return

    const width = shapeWidth ? parseInt(shapeWidth.value) : window.primaryShapeButton.width
    const height = shapeHeight ? parseInt(shapeHeight.value) : window.primaryShapeButton.height

    if (shapeWidthValue) shapeWidthValue.textContent = width
    if (shapeHeightValue) shapeHeightValue.textContent = height

    window.primaryShapeButton.setCustomPath(window.customPathPoints || window.primaryShapeButton.customPoints, width, height)
  }

  if (shapeWidth) {
    shapeWidth.addEventListener('input', updatePrimaryShapeGeometry)
  }

  if (shapeHeight) {
    shapeHeight.addEventListener('input', updatePrimaryShapeGeometry)
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
      const svgText = await file.text()
      const points = extractSvgPathPoints(svgText)

      if (points.length < 3) {
        throw new Error('没有找到可用的闭合图形')
      }

      window.customPathPoints = points
      updateImportedSvgButton(points)

      if (status) {
        status.textContent = `已导入：${file.name}，提取 ${points.length} 个轮廓点。`
      }
    } catch (error) {
      if (status) {
        status.textContent = `导入失败：${error.message}`
      }
      console.error('SVG import failed:', error)
    }
  })
}

function extractSvgPathPoints(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('SVG 文件格式无效')
  }

  const svg = doc.querySelector('svg')
  if (!svg) {
    throw new Error('文件中没有 SVG 根节点')
  }

  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-10000px'
  host.style.top = '-10000px'
  host.style.width = '0'
  host.style.height = '0'
  host.style.overflow = 'hidden'
  host.appendChild(svg)
  document.body.appendChild(host)

  try {
    const elements = [...svg.querySelectorAll('path, polygon, polyline, circle, ellipse, rect')]
    const drawable = elements
      .map(element => ({ element, length: getSvgElementLength(element) }))
      .filter(item => item.length > 0)
      .sort((a, b) => b.length - a.length)[0]

    if (!drawable) {
      throw new Error('只支持 path、polygon、polyline、circle、ellipse、rect 图形')
    }

    return normalizeSvgPoints(sampleSvgElement(drawable.element, drawable.length))
  } finally {
    document.body.removeChild(host)
  }
}

function getSvgElementLength(element) {
  if (typeof element.getTotalLength === 'function') {
    try {
      return element.getTotalLength()
    } catch (error) {
      return 0
    }
  }

  return 0
}

function sampleSvgElement(element, length) {
  const maxPoints = 32
  const points = []

  for (let i = 0; i < maxPoints; i++) {
    const point = element.getPointAtLength((length * i) / maxPoints)
    points.push({ x: point.x, y: point.y })
  }

  return points
}

function normalizeSvgPoints(points) {
  const minX = Math.min(...points.map(point => point.x))
  const maxX = Math.max(...points.map(point => point.x))
  const minY = Math.min(...points.map(point => point.y))
  const maxY = Math.max(...points.map(point => point.y))
  const width = Math.max(maxX - minX, 1)
  const height = Math.max(maxY - minY, 1)
  const padding = 0.06

  return points.map(point => ({
    x: padding + ((point.x - minX) / width) * (1 - padding * 2),
    y: padding + ((point.y - minY) / height) * (1 - padding * 2)
  }))
}

function updateImportedSvgButton(points) {
  if (!window.primaryShapeButton) return

  const shapeWidth = document.getElementById('shapeWidth')
  const shapeHeight = document.getElementById('shapeHeight')
  const width = shapeWidth ? parseInt(shapeWidth.value) : window.primaryShapeButton.width
  const height = shapeHeight ? parseInt(shapeHeight.value) : window.primaryShapeButton.height

  window.primaryShapeButton.setCustomPath(points, width, height)
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
      const isVisible = controlsContainer.classList.contains('mobile-visible')

      if (isVisible) {
        // Hide controls
        controlsContainer.classList.remove('mobile-visible')
        toggleButton.classList.remove('active')
        toggleButton.setAttribute('aria-expanded', 'false')
      } else {
        // Show controls
        controlsContainer.classList.add('mobile-visible')
        toggleButton.classList.add('active')
        toggleButton.setAttribute('aria-expanded', 'true')
      }
    })

    // Close controls when clicking outside on mobile
    document.addEventListener('click', event => {
      // Only on mobile screens
      if (window.innerWidth <= 768) {
        const isVisible = controlsContainer.classList.contains('mobile-visible')
        const clickedInsideControls = controlsContainer.contains(event.target)
        const clickedToggleButton = toggleButton.contains(event.target)

        if (isVisible && !clickedInsideControls && !clickedToggleButton) {
          controlsContainer.classList.remove('mobile-visible')
          toggleButton.classList.remove('active')
          toggleButton.setAttribute('aria-expanded', 'false')
        }
      }
    })

    // Initialize toggle button accessibility
    toggleButton.setAttribute('aria-expanded', 'false')
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
