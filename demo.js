const helloRow = document.querySelector('#hello-row')

const defaultCustomPath = [
  { x: 0.25, y: 0.08 },
  { x: 0.75, y: 0.08 },
  { x: 0.94, y: 0.36 },
  { x: 0.82, y: 0.88 },
  { x: 0.22, y: 0.88 },
  { x: 0.06, y: 0.42 }
]

window.shapeButtons = []

const primaryShape = new Button({
  type: 'custom',
  width: 180,
  height: 140,
  customPoints: defaultCustomPath,
  label: 'Imported SVG glass button',
  tintOpacity: 0.22
})

window.shapeButtons.push(primaryShape)
window.primaryShapeButton = primaryShape
window.customPathPoints = defaultCustomPath
helloRow.appendChild(primaryShape.element)

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
          element.classList.contains('glass-button-text')
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
