const fs = require('fs')
const rawWords = require('./words.json')
const { start } = require('repl')

// Convert all words to uppercase, like Scrabble tiles
const words = rawWords.map(word => word.toUpperCase())

// Remove the first word in the list, as the starting word in the middle
const startingWord = words.shift()

// Sort the rest of the words by length
words.sort((a, b) => b.length - a.length)

// Create an empty array to hold the grid
const grid = []

// Set the width to be the number of all the letters in all words, scaled
const width = Math.floor(
  rawWords.reduce((sum, word) => sum + word.length, 0) * 0.25
)

// Create helper functions for moving between 2d and 1d coordinates
const getIndex = (x, y) => y * width + x
const getCoords = index => ({
  x: index % width,
  y: Math.floor(index / width),
})

// Write the starting word to the center of the grid
const midPoint = Math.floor((width - startingWord.length) / 2)
startingWord.split('').forEach((letter, letterIndex) => {
  grid[getIndex(midPoint + letterIndex, midPoint)] = letter
})

// Get all indexes of a letter in the grid
const getAllOccurances = letter =>
  grid.reduce((indexes, gridLetter, gridIndex) => {
    if (gridLetter === letter) indexes.push(gridIndex)
    return indexes
  }, [])

// Find all intersections of a each letter in a word in the grid
const findIntersections = word =>
  word.split('').reduce((out, letter, letterIndex) => {
    const indexes = getAllOccurances(letter)
    return out.concat(
      indexes.map(gridIndex => ({ ...getCoords(gridIndex), letterIndex }))
    )
  }, [])

// Perform a single iteration for the next word in the words list
const iterate = () => {
  // Get the next word of the words list
  const word = words.shift()

  // Find all the intersections between each letter in the word and the existing words on the grid
  const intersections = findIntersections(word)

  // For each intersection, check for horizontal and vertical collisions
  for (const intersection of intersections) {
    // Find all the cells if the word is used vertically
    const columnCells = word.split('').map((letter, i) => {
      const x = intersection.x
      const y = intersection.y - intersection.letterIndex + i
      const gridElement = grid[getIndex(x, y)]
      const isInvalid = (gridElement && gridElement !== letter) || false

      return {
        x,
        y,
        letter,
        isValid: !isInvalid,
      }
    })

    // if every cell in the row is valid, write the letters to the grid, and return
    if (columnCells.every(cell => cell.isValid)) {
      columnCells.forEach(({ x, y, letter }) => {
        grid[getIndex(x, y)] = letter
      })
      return
    }

    // Find all the cells if the word is used horizontally
    const rowCells = word.split('').map((letter, i) => {
      const x = intersection.x - intersection.letterIndex + i
      const y = intersection.y
      const gridElement = grid[getIndex(x, y)]
      const isInvalid =
        (gridElement && gridElement !== letter) ||
        (i === 0 && grid[getIndex(x - 1, y)] !== undefined)

      return {
        x,
        y,
        letter,
        isValid: !isInvalid,
      }
    })

    // if every cell in the column is valid, write the letters to the grid, and return
    if (rowCells.every(cell => cell.isValid)) {
      rowCells.forEach(({ x, y, letter }) => {
        grid[getIndex(x, y)] = letter
      })
      return
    }
  }

  // If we got here, the word didn't fit into the grid at the moment, put it back into the word list
  words.push(word)
}

// Iterate until all the words are placed, or the limit is reached
let iterationLimit = 1000
while (words.length > 0) {
  iterate()
  iterationLimit -= 1

  if (iterationLimit <= 0) {
    throw Error('Iteration limit reached')
  }
}

// Function to write the grid to SVG
const writeGridToSVG = () => {
  const tileSize = 10
  let svg = `<svg viewbox="0 0 ${width * tileSize} ${width * tileSize}">`

  grid.forEach((letter, index) => {
    if (!letter) return
    const { x, y } = getCoords(index)
    svg += `
      <g transform="translate(${x * tileSize}, ${y * tileSize})">
        <rect x="0" y="0" width="${tileSize}" height="${tileSize}" />
        <text
          x="0"
          y="${tileSize / 2}"
          alignment-baseline="center"
          class="cell__text"
        >
          ${letter}
        </text>
      </g>
    `
  })

  svg += '</svg>'

  const style = Object.entries({
    'font-size': '8px',
    fill: 'white',
  })
    .map(([key, value]) => `${key}:${value};`)
    .join(' ')

  fs.writeFileSync(
    './index.html',
    `<!DOCTYPE html><html><style>.cell__text{${style}}</style><body>${svg}</body></html>`
  )
}

writeGridToSVG()
