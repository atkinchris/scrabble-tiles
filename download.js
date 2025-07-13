function downloadURI(uri, name) {
  const link = document.createElement('a')
  link.download = name
  link.href = uri
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function downloadSVG() {
  const svg = document.querySelector('#board svg')
  if (!svg) {
    alert('Please generate a board first!')
    return
  }

  const svgAsXML = new XMLSerializer().serializeToString(svg)
  const dataUrl = 'data:image/svg+xml,' + encodeURIComponent(svgAsXML)
  downloadURI(dataUrl, 'scrabble-tiles.svg')
}

function downloadSVGasPNG() {
  const svg = document.querySelector('#board svg')
  if (!svg) {
    alert('Please generate a board first!')
    return
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const loader = new Image()

  // Get the SVG dimensions
  const rect = svg.getBoundingClientRect()
  const scale = 4 // High resolution multiplier

  canvas.width = rect.width * scale
  canvas.height = rect.height * scale

  loader.onload = function () {
    // Fill with white background
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Draw the SVG
    context.drawImage(loader, 0, 0, canvas.width, canvas.height)
    downloadURI(canvas.toDataURL('image/png'), 'scrabble-tiles.png')
  }

  const svgAsXML = new XMLSerializer().serializeToString(svg)
  loader.src = 'data:image/svg+xml,' + encodeURIComponent(svgAsXML)
}

// Set up the download button
document.getElementById('download-button').onclick = downloadSVG
