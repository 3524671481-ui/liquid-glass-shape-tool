class Button extends Container {
  constructor(options = {}) {
    const text = options.text || ''
    const size = parseInt(options.size) || 80
    const width = parseInt(options.width) || null
    const height = parseInt(options.height) || null
    const onClick = options.onClick || null
    const type = options.type || 'rounded'
    const warp = options.warp !== undefined ? options.warp : false // Center warping disabled by default
    const tintOpacity = options.tintOpacity !== undefined ? options.tintOpacity : 0.2

    // Call parent constructor (border radius will be set in setGeometrySize)
    super({
      borderRadius: size / 2,
      type: type,
      tintOpacity: tintOpacity,
      customPoints: options.customPoints || []
    })

    this.text = text
    this.size = size
    this.customWidth = width
    this.customHeight = height
    this.customPoints = options.customPoints || []
    this.onClick = onClick
    this.type = type
    this.shapeType = Container.getShapeType(this.type)
    this.customPoints = this.type === 'custom' ? this.customPoints : []
    this.warp = warp
    this.parent = null // Will be set if added to container
    this.isNestedGlass = false

    // Add button-specific styling and content
    this.element.classList.add('glass-button')
    this.element.classList.add(`glass-button-${this.type}`)
    this.element.setAttribute('aria-label', options.label || `${this.type} glass shape`)
    this.setupClickHandler()
    this.setGeometrySize()
  }

  setGeometrySize(width = this.customWidth, height = this.customHeight, type = this.type) {
    this.type = type
    this.shapeType = Container.getShapeType(this.type)
    this.element.className = `glass-container glass-button glass-button-${this.type}`

    let nextWidth = parseInt(width) || this.size
    let nextHeight = parseInt(height) || this.size

    if (this.type === 'circle') {
      const circleSize = Math.max(nextWidth, nextHeight)
      nextWidth = circleSize
      nextHeight = circleSize
      this.borderRadius = circleSize / 2
    } else if (this.type === 'pill') {
      this.borderRadius = nextHeight / 2
    } else if (this.type === 'rounded') {
      this.borderRadius = Math.min(nextWidth, nextHeight) * 0.25
    } else if (this.type === 'ellipse') {
      this.borderRadius = Math.min(nextWidth, nextHeight) / 2
    } else {
      this.borderRadius = 0
    }

    this.customWidth = nextWidth
    this.customHeight = nextHeight
    this.element.style.width = nextWidth + 'px'
    this.element.style.height = nextHeight + 'px'
    this.element.style.minWidth = nextWidth + 'px'
    this.element.style.minHeight = nextHeight + 'px'
    this.element.style.maxWidth = nextWidth + 'px'
    this.element.style.maxHeight = nextHeight + 'px'

    // Apply border radius to element
    this.element.style.borderRadius = this.type === 'ellipse' ? '50%' : this.borderRadius + 'px'

    // Update canvas border radius to match
    if (this.canvas) {
      this.canvas.style.borderRadius = this.type === 'ellipse' ? '50%' : this.borderRadius + 'px'
      this.canvas.width = nextWidth
      this.canvas.height = nextHeight
      this.canvas.style.width = nextWidth + 'px'
      this.canvas.style.height = nextHeight + 'px'
    }

    this.width = nextWidth
    this.height = nextHeight

    if (this.gl_refs.gl) {
      this.gl_refs.gl.viewport(0, 0, nextWidth, nextHeight)
      this.gl_refs.gl.uniform2f(this.gl_refs.resolutionLoc, nextWidth, nextHeight)
      this.gl_refs.gl.uniform1f(this.gl_refs.borderRadiusLoc, this.borderRadius)
      if (this.gl_refs.shapeTypeLoc) {
        this.gl_refs.gl.uniform1f(this.gl_refs.shapeTypeLoc, this.shapeType)
      }
      this.updateCustomPathUniforms()
      if (this.render) this.render()
    }
  }

  setCustomPath(points, width = this.customWidth, height = this.customHeight) {
    this.customPoints = points
    this.setGeometrySize(width, height, 'custom')
    this.updateCustomPathUniforms()
  }

  updateCustomPathUniforms() {
    if (!this.gl_refs.gl || !this.gl_refs.customPointsLoc || !this.gl_refs.customPointCountLoc) return

    const maxPoints = 32
    this.gl_refs.gl.uniform1f(this.gl_refs.customPointCountLoc, Math.min(this.customPoints.length, maxPoints))
    this.gl_refs.gl.uniform2fv(this.gl_refs.customPointsLoc, Container.packCustomPoints(this.customPoints))
  }

  setupAsNestedGlass() {
    if (this.parent && !this.isNestedGlass) {
      this.isNestedGlass = true
      // Reinitialize with nested glass shader when parent is ready
      if (this.webglInitialized) {
        this.initWebGL()
      }
    }
  }

  static measureText(text, fontSize) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`
    return ctx.measureText(text)
  }

  createTextElement() {
    this.textElement = document.createElement('div')
    this.textElement.className = 'glass-button-text'
    this.textElement.textContent = this.text
    this.textElement.style.display = 'none'

    this.element.appendChild(this.textElement)
  }

  setupClickHandler() {
    if (this.onClick && this.element) {
      this.element.addEventListener('click', e => {
        e.preventDefault()
        this.onClick(this.text)
      })
    }
  }

  // Override initWebGL to choose between standalone and nested glass
  initWebGL() {
    if (!Container.pageSnapshot || !this.gl) return

    if (this.parent && this.isNestedGlass) {
      // Use nested glass (parent container's texture)
      this.initNestedGlass()
    } else {
      // Use standalone glass (page snapshot)
      super.initWebGL()
    }
  }

  initNestedGlass() {
    if (!this.parent.webglInitialized) {
      // Parent not ready, wait and try again
      setTimeout(() => this.initNestedGlass(), 100)
      return
    }

    // Parent is ready, set up nested glass
    this.setupDynamicNestedShader()
    this.webglInitialized = true
  }

  setupDynamicNestedShader() {
    const gl = this.gl

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texcoord;
      varying vec2 v_texcoord;

      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texcoord = a_texcoord;
      }
    `

    const fsSource = `
      precision mediump float;
      uniform sampler2D u_image;
      uniform vec2 u_resolution;
      uniform vec2 u_textureSize;
      uniform float u_blurRadius;
      uniform float u_borderRadius;
      uniform float u_shapeType;
      uniform float u_customPointCount;
      uniform vec2 u_customPoints[32];
      uniform vec2 u_buttonPosition;
      uniform vec2 u_containerPosition;
      uniform vec2 u_containerSize;
      uniform float u_warp;
      uniform float u_edgeIntensity;
      uniform float u_rimIntensity;
      uniform float u_baseIntensity;
      uniform float u_edgeDistance;
      uniform float u_rimDistance;
      uniform float u_baseDistance;
      uniform float u_cornerBoost;
      uniform float u_rippleEffect;
      uniform float u_tintOpacity;
      varying vec2 v_texcoord;

      // Function to calculate distance from rounded rectangle edge
      float roundedRectDistance(vec2 coord, vec2 size, float radius) {
        vec2 center = size * 0.5;
        vec2 pixelCoord = coord * size;
        vec2 toCorner = abs(pixelCoord - center) - (center - radius);
        float outsideCorner = length(max(toCorner, 0.0));
        float insideCorner = min(max(toCorner.x, toCorner.y), 0.0);
        return (outsideCorner + insideCorner - radius);
      }
      
      // Function to calculate distance from circle edge (negative inside, positive outside)
      float circleDistance(vec2 coord, vec2 size, float radius) {
        vec2 center = vec2(0.5, 0.5);
        vec2 pixelCoord = coord * size;
        vec2 centerPixel = center * size;
        float distFromCenter = length(pixelCoord - centerPixel);
        return distFromCenter - radius;
      }
      
      // Check if this is a pill (border radius is approximately 50% of height AND width > height)
      bool isPill(vec2 size, float radius) {
        float heightRatioDiff = abs(radius - size.y * 0.5);
        bool radiusMatchesHeight = heightRatioDiff < 2.0;
        bool isWiderThanTall = size.x > size.y + 4.0; // Must be significantly wider
        return radiusMatchesHeight && isWiderThanTall;
      }
      
      // Check if this is a circle (border radius is approximately 50% of smaller dimension AND roughly square)
      bool isCircle(vec2 size, float radius) {
        float minDim = min(size.x, size.y);
        bool radiusMatchesMinDim = abs(radius - minDim * 0.5) < 1.0;
        bool isRoughlySquare = abs(size.x - size.y) < 4.0; // Width and height are similar
        return radiusMatchesMinDim && isRoughlySquare;
      }
      
      // Function to calculate distance from pill edge (capsule shape)
      float pillDistance(vec2 coord, vec2 size, float radius) {
        vec2 center = size * 0.5;
        vec2 pixelCoord = coord * size;
        
        // Proper capsule: line segment with radius
        // The capsule axis runs horizontally from (radius, center.y) to (size.x - radius, center.y)
        vec2 capsuleStart = vec2(radius, center.y);
        vec2 capsuleEnd = vec2(size.x - radius, center.y);
        
        // Project point onto the capsule axis (line segment)
        vec2 capsuleAxis = capsuleEnd - capsuleStart;
        float capsuleLength = length(capsuleAxis);
        
        if (capsuleLength > 0.0) {
          vec2 toPoint = pixelCoord - capsuleStart;
          float t = clamp(dot(toPoint, capsuleAxis) / dot(capsuleAxis, capsuleAxis), 0.0, 1.0);
          vec2 closestPointOnAxis = capsuleStart + t * capsuleAxis;
          return length(pixelCoord - closestPointOnAxis) - radius;
        } else {
          // Degenerate case: just a circle
          return length(pixelCoord - center) - radius;
        }
      }

      float ellipseDistance(vec2 coord, vec2 size) {
        vec2 p = (coord - 0.5) * 2.0;
        return (length(p) - 1.0) * min(size.x, size.y) * 0.5;
      }

      float diamondDistance(vec2 coord, vec2 size) {
        vec2 p = (coord - 0.5) * 2.0;
        p.x *= size.x / min(size.x, size.y);
        p.y *= size.y / min(size.x, size.y);
        return (abs(p.x) + abs(p.y) - 1.0) * min(size.x, size.y) * 0.5;
      }

      float cross2d(vec2 a, vec2 b) {
        return a.x * b.y - a.y * b.x;
      }

      float segmentDistance(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
      }

      float triangleDistance(vec2 coord, vec2 size) {
        vec2 p = (coord * size - size * 0.5) / (min(size.x, size.y) * 0.5);
        vec2 a = vec2(0.0, -0.9);
        vec2 b = vec2(0.86, 0.68);
        vec2 c = vec2(-0.86, 0.68);
        float d = min(segmentDistance(p, a, b), min(segmentDistance(p, b, c), segmentDistance(p, c, a)));
        bool inside = cross2d(b - a, p - a) >= 0.0 && cross2d(c - b, p - b) >= 0.0 && cross2d(a - c, p - c) >= 0.0;
        return (inside ? -d : d) * min(size.x, size.y) * 0.5;
      }

      float customPathDistance(vec2 coord, vec2 size) {
        float minDistance = 10000.0;
        bool inside = false;

        for (int i = 0; i < 32; i++) {
          if (float(i) >= u_customPointCount) break;

          vec2 a = u_customPoints[i];
          vec2 b = u_customPoints[0];
          if (float(i) + 1.0 < u_customPointCount) {
            b = u_customPoints[i + 1];
          }

          minDistance = min(minDistance, segmentDistance(coord, a, b));

          bool crossesY = (a.y > coord.y) != (b.y > coord.y);
          float crossingX = (b.x - a.x) * (coord.y - a.y) / (b.y - a.y + 0.0001) + a.x;
          if (crossesY && coord.x < crossingX) {
            inside = !inside;
          }
        }

        return (inside ? -minDistance : minDistance) * min(size.x, size.y);
      }

      float regularPolygonDistance(vec2 coord, vec2 size, float sides, float rotation) {
        vec2 p = (coord * size - size * 0.5) / (min(size.x, size.y) * 0.5);
        float angle = atan(p.y, p.x) + rotation;
        float sector = 6.28318530718 / sides;
        float polygonRadius = cos(floor(0.5 + angle / sector) * sector - angle) * length(p);
        return (polygonRadius - 0.92) * min(size.x, size.y) * 0.5;
      }

      float shapeDistance(vec2 coord, vec2 size, float radius, float shapeType) {
        if (shapeType < 0.5) {
          return roundedRectDistance(coord, size, radius);
        } else if (shapeType < 1.5) {
          return circleDistance(coord, size, min(size.x, size.y) * 0.5);
        } else if (shapeType < 2.5) {
          return pillDistance(coord, size, size.y * 0.5);
        } else if (shapeType < 3.5) {
          return ellipseDistance(coord, size);
        } else if (shapeType < 4.5) {
          return diamondDistance(coord, size);
        } else if (shapeType < 5.5) {
          return triangleDistance(coord, size);
        } else if (shapeType < 6.5) {
          return regularPolygonDistance(coord, size, 6.0, 0.52359877559);
        } else if (shapeType > 7.5) {
          return customPathDistance(coord, size);
        }
        return regularPolygonDistance(coord, size, 8.0, 0.39269908169);
      }

      void main() {
        vec2 coord = v_texcoord;
        
        // Calculate button position within container space
        vec2 buttonSize = u_resolution;
        vec2 containerSize = u_containerSize;
        
        // Convert screen positions to container-relative coordinates
        // Container position is center, convert to top-left
        vec2 containerTopLeft = u_containerPosition - containerSize * 0.5;
        vec2 buttonTopLeft = u_buttonPosition - buttonSize * 0.5;
        
        // Get button's position relative to container's top-left
        vec2 buttonRelativePos = buttonTopLeft - containerTopLeft;
        
        // Current pixel position within the button (0 to buttonSize)
        vec2 buttonPixel = coord * buttonSize;
        
        // Absolute pixel position in container space
        vec2 containerPixel = buttonRelativePos + buttonPixel;
        
        // Convert to texture coordinates (0 to 1)
        vec2 baseTextureCoord = containerPixel / containerSize;
        
        // BUTTON'S SOPHISTICATED GLASS EFFECTS on top of container's glass
        float distFromEdgeShape;
        vec2 shapeNormal; // Normal vector pointing away from shape surface
        
        if (u_shapeType > 1.5 && u_shapeType < 2.5) {
          distFromEdgeShape = -pillDistance(coord, u_resolution, u_borderRadius);
          
          // Calculate normal for pill shape
          vec2 center = vec2(0.5, 0.5);
          vec2 pixelCoord = coord * u_resolution;
          vec2 capsuleStart = vec2(u_borderRadius, center.y * u_resolution.y);
          vec2 capsuleEnd = vec2(u_resolution.x - u_borderRadius, center.y * u_resolution.y);
          vec2 capsuleAxis = capsuleEnd - capsuleStart;
          float capsuleLength = length(capsuleAxis);
          
          if (capsuleLength > 0.0) {
            vec2 toPoint = pixelCoord - capsuleStart;
            float t = clamp(dot(toPoint, capsuleAxis) / dot(capsuleAxis, capsuleAxis), 0.0, 1.0);
            vec2 closestPointOnAxis = capsuleStart + t * capsuleAxis;
            vec2 normalDir = pixelCoord - closestPointOnAxis;
            shapeNormal = length(normalDir) > 0.0 ? normalize(normalDir) : vec2(0.0, 1.0);
          } else {
            shapeNormal = normalize(coord - center);
          }
        } else if (u_shapeType > 0.5 && u_shapeType < 1.5) {
          distFromEdgeShape = -circleDistance(coord, u_resolution, min(u_resolution.x, u_resolution.y) * 0.5);
          vec2 center = vec2(0.5, 0.5);
          shapeNormal = normalize(coord - center);
        } else {
          distFromEdgeShape = -shapeDistance(coord, u_resolution, u_borderRadius, u_shapeType);
          vec2 center = vec2(0.5, 0.5);
          shapeNormal = normalize(coord - center);
        }
        distFromEdgeShape = max(distFromEdgeShape, 0.0);
        
        float distFromLeft = coord.x;
        float distFromRight = 1.0 - coord.x;
        float distFromTop = coord.y;
        float distFromBottom = 1.0 - coord.y;
        float distFromEdge = distFromEdgeShape / min(u_resolution.x, u_resolution.y);
        
        // MULTI-LAYER BUTTON GLASS REFRACTION using shape-aware normal
        float normalizedDistance = distFromEdge * min(u_resolution.x, u_resolution.y);
        float baseIntensity = 1.0 - exp(-normalizedDistance * u_baseDistance);
        float edgeIntensity = exp(-normalizedDistance * u_edgeDistance);
        float rimIntensity = exp(-normalizedDistance * u_rimDistance);
        
        // Apply center warping only if warp is enabled, keep edge and rim effects always
        float baseComponent = u_warp > 0.5 ? baseIntensity * u_baseIntensity : 0.0;
        float totalIntensity = baseComponent + edgeIntensity * u_edgeIntensity + rimIntensity * u_rimIntensity;
        
        vec2 baseRefraction = shapeNormal * totalIntensity;
        
        // Corner enhancement for buttons
        float cornerProximityX = min(distFromLeft, distFromRight);
        float cornerProximityY = min(distFromTop, distFromBottom);
        float cornerDistance = max(cornerProximityX, cornerProximityY);
        float cornerNormalized = cornerDistance * min(u_resolution.x, u_resolution.y);
        
        float cornerBoost = exp(-cornerNormalized * 0.3) * u_cornerBoost;
        vec2 cornerRefraction = shapeNormal * cornerBoost;
        
        // Button ripple texture
        vec2 perpendicular = vec2(-shapeNormal.y, shapeNormal.x);
        float rippleEffect = sin(distFromEdge * 30.0) * u_rippleEffect * rimIntensity;
        vec2 textureRefraction = perpendicular * rippleEffect;
        
        vec2 totalRefraction = baseRefraction + cornerRefraction + textureRefraction;
        vec2 textureCoord = baseTextureCoord + totalRefraction;
        
        // HIGH-QUALITY BUTTON BLUR on container texture
        vec4 color = vec4(0.0);
        vec2 texelSize = 1.0 / containerSize;
        float sigma = u_blurRadius / 3.0; // More substantial blur
        vec2 blurStep = texelSize * sigma;
        
        float totalWeight = 0.0;
        
        // 9x9 blur for buttons (more samples for quality)
        for(float i = -4.0; i <= 4.0; i += 1.0) {
          for(float j = -4.0; j <= 4.0; j += 1.0) {
            float distance = length(vec2(i, j));
            if(distance > 4.0) continue;
            
            float weight = exp(-(distance * distance) / (2.0 * sigma * sigma));
            
            vec2 offset = vec2(i, j) * blurStep;
            color += texture2D(u_image, textureCoord + offset) * weight;
            totalWeight += weight;
          }
        }
        
        color /= totalWeight;
        
        // BUTTON'S OWN GRADIENT LAYERS (same sophistication as container)
        float gradientPosition = coord.y;
        
        // Primary button gradient
        vec3 topTint = vec3(1.0, 1.0, 1.0);
        vec3 bottomTint = vec3(0.7, 0.7, 0.7);
        vec3 gradientTint = mix(topTint, bottomTint, gradientPosition);
        vec3 tintedColor = mix(color.rgb, gradientTint, u_tintOpacity * 0.7);
        color = vec4(tintedColor, color.a);
        
        // SECOND BUTTON GRADIENT - sampling from container's texture for variation
        vec2 viewportCenter = u_buttonPosition;
        float topY = max(0.0, (viewportCenter.y - buttonSize.y * 0.4) / containerSize.y);
        float midY = viewportCenter.y / containerSize.y;
        float bottomY = min(1.0, (viewportCenter.y + buttonSize.y * 0.4) / containerSize.y);
        
        vec3 topColor = texture2D(u_image, vec2(0.5, topY)).rgb;
        vec3 midColor = texture2D(u_image, vec2(0.5, midY)).rgb;
        vec3 bottomColor = texture2D(u_image, vec2(0.5, bottomY)).rgb;
        
        vec3 sampledGradient;
        if (gradientPosition < 0.1) {
          sampledGradient = topColor;
        } else if (gradientPosition > 0.9) {
          sampledGradient = bottomColor;
        } else {
          float transitionPos = (gradientPosition - 0.1) / 0.8;
          if (transitionPos < 0.5) {
            float t = transitionPos * 2.0;
            sampledGradient = mix(topColor, midColor, t);
          } else {
            float t = (transitionPos - 0.5) * 2.0;
            sampledGradient = mix(midColor, bottomColor, t);
          }
        }
        
        vec3 secondTinted = mix(color.rgb, sampledGradient, u_tintOpacity * 0.4);
        
        // Button highlighting/shadow system
        vec3 buttonTopTint = vec3(1.08, 1.08, 1.08);    
        vec3 buttonBottomTint = vec3(0.92, 0.92, 0.92); 
        vec3 buttonGradient = mix(buttonTopTint, buttonBottomTint, gradientPosition);
        vec3 finalTinted = secondTinted * buttonGradient;
        
        // Shape mask (rounded rectangle, circle, or pill)
        float maskDistance;
        maskDistance = shapeDistance(coord, u_resolution, u_borderRadius, u_shapeType);
        float mask = 1.0 - smoothstep(-1.0, 1.0, maskDistance);
        
        gl_FragColor = vec4(finalTinted * mask, mask);
      }
    `

    const program = this.createProgram(gl, vsSource, fsSource)
    if (!program) return

    gl.useProgram(program)

    // Set up geometry (same as parent)
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)

    const texcoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]), gl.STATIC_DRAW)

    // Get locations
    const positionLoc = gl.getAttribLocation(program, 'a_position')
    const texcoordLoc = gl.getAttribLocation(program, 'a_texcoord')
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution')
    const textureSizeLoc = gl.getUniformLocation(program, 'u_textureSize')
    const blurRadiusLoc = gl.getUniformLocation(program, 'u_blurRadius')
    const borderRadiusLoc = gl.getUniformLocation(program, 'u_borderRadius')
    const shapeTypeLoc = gl.getUniformLocation(program, 'u_shapeType')
    const customPointCountLoc = gl.getUniformLocation(program, 'u_customPointCount')
    const customPointsLoc = gl.getUniformLocation(program, 'u_customPoints')
    const buttonPositionLoc = gl.getUniformLocation(program, 'u_buttonPosition')
    const containerPositionLoc = gl.getUniformLocation(program, 'u_containerPosition')
    const containerSizeLoc = gl.getUniformLocation(program, 'u_containerSize')
    const warpLoc = gl.getUniformLocation(program, 'u_warp')
    const edgeIntensityLoc = gl.getUniformLocation(program, 'u_edgeIntensity')
    const rimIntensityLoc = gl.getUniformLocation(program, 'u_rimIntensity')
    const baseIntensityLoc = gl.getUniformLocation(program, 'u_baseIntensity')
    const edgeDistanceLoc = gl.getUniformLocation(program, 'u_edgeDistance')
    const rimDistanceLoc = gl.getUniformLocation(program, 'u_rimDistance')
    const baseDistanceLoc = gl.getUniformLocation(program, 'u_baseDistance')
    const cornerBoostLoc = gl.getUniformLocation(program, 'u_cornerBoost')
    const rippleEffectLoc = gl.getUniformLocation(program, 'u_rippleEffect')
    const tintOpacityLoc = gl.getUniformLocation(program, 'u_tintOpacity')
    const imageLoc = gl.getUniformLocation(program, 'u_image')

    // Create texture that will be updated dynamically from container canvas
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Initialize with parent container's current canvas size
    const containerCanvas = this.parent.canvas
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      containerCanvas.width,
      containerCanvas.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // Store references
    this.gl_refs = {
      gl,
      texture,
      textureSizeLoc,
      positionLoc,
      texcoordLoc,
      resolutionLoc,
      blurRadiusLoc,
      borderRadiusLoc,
      shapeTypeLoc,
      customPointCountLoc,
      customPointsLoc,
      buttonPositionLoc,
      containerPositionLoc,
      containerSizeLoc,
      warpLoc,
      edgeIntensityLoc,
      rimIntensityLoc,
      baseIntensityLoc,
      edgeDistanceLoc,
      rimDistanceLoc,
      baseDistanceLoc,
      cornerBoostLoc,
      rippleEffectLoc,
      tintOpacityLoc,
      imageLoc,
      positionBuffer,
      texcoordBuffer
    }

    // Set up viewport and attributes
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
    gl.enableVertexAttribArray(texcoordLoc)
    gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0)

    // Set uniforms
    gl.uniform2f(resolutionLoc, this.canvas.width, this.canvas.height)
    gl.uniform2f(textureSizeLoc, containerCanvas.width, containerCanvas.height)
    gl.uniform1f(blurRadiusLoc, window.glassControls?.blurRadius || 2.0) // Controlled blur for sharpness
    gl.uniform1f(borderRadiusLoc, this.borderRadius)
    gl.uniform1f(shapeTypeLoc, this.shapeType)
    gl.uniform1f(customPointCountLoc, Math.min(this.customPoints.length, 32))
    gl.uniform2fv(customPointsLoc, Container.packCustomPoints(this.customPoints))
    gl.uniform1f(warpLoc, this.warp ? 1.0 : 0.0)
    gl.uniform1f(edgeIntensityLoc, window.glassControls?.edgeIntensity || 0.01)
    gl.uniform1f(rimIntensityLoc, window.glassControls?.rimIntensity || 0.05)
    gl.uniform1f(baseIntensityLoc, window.glassControls?.baseIntensity || 0.01)
    gl.uniform1f(edgeDistanceLoc, window.glassControls?.edgeDistance || 0.15)
    gl.uniform1f(rimDistanceLoc, window.glassControls?.rimDistance || 0.8)
    gl.uniform1f(baseDistanceLoc, window.glassControls?.baseDistance || 0.1)
    gl.uniform1f(cornerBoostLoc, window.glassControls?.cornerBoost || 0.02)
    gl.uniform1f(rippleEffectLoc, window.glassControls?.rippleEffect || 0.1)
    gl.uniform1f(tintOpacityLoc, this.tintOpacity)

    // Set positions
    const buttonPosition = this.getPosition()
    const containerPosition = this.parent.getPosition()
    gl.uniform2f(buttonPositionLoc, buttonPosition.x, buttonPosition.y)
    gl.uniform2f(containerPositionLoc, containerPosition.x, containerPosition.y)
    gl.uniform2f(containerSizeLoc, this.parent.width, this.parent.height)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(imageLoc, 0)

    // Start rendering
    this.startNestedRenderLoop()
  }

  startNestedRenderLoop() {
    const render = () => {
      if (!this.gl_refs.gl || !this.parent) return

      const gl = this.gl_refs.gl

      // UPDATE TEXTURE FROM PARENT CONTAINER'S CURRENT RENDERED OUTPUT
      const containerCanvas = this.parent.canvas
      gl.bindTexture(gl.TEXTURE_2D, this.gl_refs.texture)
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, containerCanvas)

      gl.clear(gl.COLOR_BUFFER_BIT)

      // Update button and container positions (in case layout changed)
      const buttonPosition = this.getPosition()
      const containerPosition = this.parent.getPosition()
      gl.uniform2f(this.gl_refs.buttonPositionLoc, buttonPosition.x, buttonPosition.y)
      gl.uniform2f(this.gl_refs.containerPositionLoc, containerPosition.x, containerPosition.y)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    // Render every frame to keep sampling parent's live output
    const animationLoop = () => {
      render()
      requestAnimationFrame(animationLoop)
    }

    animationLoop()

    // Store render function for external calls
    this.render = render
  }
}
