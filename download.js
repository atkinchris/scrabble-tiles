function downloadURI(uri, name) {
  const link = document.createElement('a')
  link.download = name
  link.href = uri
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  delete link
}

function downloadSVG() {
  const svg = document.querySelector('#board svg')
  const svgAsXML = new XMLSerializer().serializeToString(svg)
  const dataUrl = 'data:image/svg+xml,' + encodeURIComponent(svgAsXML)
  downloadURI(dataUrl, 'scrabble-tiles.svg')
}

function downloadSVGasPNG() {
  const svg = document.querySelector('#board svg')
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const loader = new Image()

  loader.width = canvas.width = svg.width.baseVal.value * 4
  loader.height = canvas.height = svg.height.baseVal.value * 4

  loader.onload = function () {
    context.rect(0, 0, loader.width, loader.height)
    context.drawImage(loader, 0, 0, loader.width, loader.height)
    downloadURI(canvas.toDataURL(), 'scrabble-tiles.png')
  }

  const svgAsXML = new XMLSerializer().serializeToString(svg)
  loader.src = 'data:image/svg+xml,' + encodeURIComponent(svgAsXML)
}

document.getElementById('download-button').onclick = downloadSVG
