const fs = require('fs')
const shuffle = require('knuth-shuffle').knuthShuffle

const rawWords = require('./words.json')

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
  rawWords.reduce((sum, word) => sum + word.length, 0) / 3
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

  // Shuffle the intersections
  shuffle(intersections)

  // For each intersection, check for horizontal and vertical collisions
  for (const intersection of intersections) {
    // Find all the cells if the word is used vertically
    const columnCells = word.split('').map((letter, i) => {
      const x = intersection.x
      const y = intersection.y - intersection.letterIndex + i
      const gridElement = grid[getIndex(x, y)]

      // It is an invalid cell if...
      const isInvalid =
        // the grid element is not empty, and it's not the same as the target letter
        (gridElement !== undefined && gridElement !== letter) ||
        // it's the first character in the word, and the cell above is not empty
        (i === 0 && grid[getIndex(x, y - 1)] !== undefined) ||
        // it's the last character in the word, and the cell below is not empty
        (i === word.length - 1 && grid[getIndex(x, y + 1)] !== undefined) ||
        // it's not the intersecting cell, and the cell to the left is not empty
        (y !== intersection.y && grid[getIndex(x - 1, y)] !== undefined) ||
        // it's not the intersecting cell, and the cell to the right is not empty
        (y !== intersection.y && grid[getIndex(x + 1, y)] !== undefined)

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

      // It is an invalid cell if...
      const isInvalid =
        // the grid element is not empty, and it's not the same as the target letter
        (gridElement && gridElement !== letter) ||
        // it's the first character in the word, and the cell to the left is not empty
        (i === 0 && grid[getIndex(x - 1, y)] !== undefined) ||
        // it's the last character in the word, and the cell to the right is not empty
        (i === word.length - 1 && grid[getIndex(x + 1, y)] !== undefined) ||
        // it's not the intersecting cell, and the cell above is not empty
        (x !== intersection.x && grid[getIndex(x, y - 1)] !== undefined) ||
        // it's not the intersecting cell, and the cell below is not empty
        (x !== intersection.x && grid[getIndex(x, y + 1)] !== undefined)

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
  const tileSize = 16
  let svg = `
    <svg
    xmlns="http://www.w3.org/2000/svg"
    viewbox="0 0 ${width * tileSize} ${width * tileSize}"
    >
    <style>
      .cell__text {
        font-size: ${tileSize - 2}px;
        fill: white;
      }
    </style>`

  grid.forEach((letter, index) => {
    if (!letter) return
    const { x, y } = getCoords(index)
    svg += `
      <svg
        x="${x * tileSize}"
        y="${y * tileSize}"
        width="${tileSize}"
        height="${tileSize}"
        >
        <rect x="0" y="0" width="100%" height="100%" />
        <text
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
          class="cell__text"
        >
          ${letter}
        </text>
      </svg>
    `
  })

  svg += '</svg>'

  fs.writeFileSync('./output.svg', svg)
}

writeGridToSVG()
