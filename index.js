const { shuffle, DEFAULT_WORDS = [], POINTS = {} } = window

const inputArea = document.getElementById('input-area')
inputArea.defaultValue = DEFAULT_WORDS.join('\n')

const preserveOrderCountInput = document.getElementById('preserve-order-count')

const getPointsForLetter = letter => POINTS[letter] || ''

const getWordsFromInput = () =>
  String(inputArea.value)
    .split('\n')
    .map(str => str.trim())
    .filter(Boolean)

let grid = []
let words = [...getWordsFromInput()]

// Set the width to be the number of all the letters in all words, scaled
const width = Math.floor(words.reduce((sum, word) => sum + word.length, 0) / 3)

// Create helper functions for moving between 2d and 1d coordinates
const getIndex = (x, y) => y * width + x
const getCoords = index => ({
  x: index % width,
  y: Math.floor(index / width),
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

function reset() {
  // Create an empty array to hold the grid
  grid = []

  // Convert all words to uppercase, like Scrabble tiles
  words = [...getWordsFromInput()].map(word => word.toUpperCase())

  // Remove the first word in the list, as the starting word in the middle
  const startingWord = words.shift()

  const preserveOrderCount = parseInt(preserveOrderCountInput.value || 0, 10)
  console.log(preserveOrderCount)
  const nextWords = words.splice(0, preserveOrderCount)

  // Sort the rest of the words by length
  words.sort((a, b) => b.length - a.length)

  words.splice(0, 0, ...nextWords)

  // Write the starting word to the center of the grid
  const midPoint = Math.floor((width - startingWord.length) / 2)
  startingWord.split('').forEach((letter, letterIndex) => {
    grid[getIndex(midPoint + letterIndex, midPoint)] = letter
  })
}

// Perform a single iteration for the next word in the words list
function placeWord() {
  // Get the next word of the words list
  const word = words.shift()

  // Log which word we're trying to place
  console.log(`Attempting to place: "${word}"`)

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

// Function to write the grid to SVG
function writeGridToSVG() {
  const tileSize = 32

  const cells = grid.reduce((out, letter, index) => {
    if (letter !== undefined) {
      out.push({
        ...getCoords(index),
        letter,
      })
    }

    return out
  }, [])

  const minX = Math.min(...cells.map(cell => cell.x))
  const maxX = Math.max(...cells.map(cell => cell.x))
  const minY = Math.min(...cells.map(cell => cell.y))
  const maxY = Math.max(...cells.map(cell => cell.y))

  let svg = `
    <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${[
      minX * tileSize,
      minY * tileSize,
      (maxX - minX + 1) * tileSize,
      (maxY - minY + 1) * tileSize,
    ].join(' ')}">
    <style>
      .cell__text {
        font-size: ${tileSize - 2}px;
        fill: white;
      }
    </style>`

  cells.forEach(({ x, y, letter }) => {
    svg += `
      <svg
        x="${x * tileSize}"
        y="${y * tileSize}"
        width="${tileSize}"
        height="${tileSize}"
        >
        <g>
          <rect
            x="10%"
            y="10%"
            width="90%"
            height="90%"
            fill="#4f8a8b"
            opacity="0.3"
            rx="7%"
            ry="7%"
          />
          <rect
            x="5%"
            y="5%"
            width="90%"
            height="90%"
            fill="#ffcb74"
            rx="7%"
            ry="7%"
          />
          <text
            x="50%"
            y="50%"
            dominant-baseline="middle"
            text-anchor="middle"
            fill="07031a"
            font-size="75%"
            font-weight="bold"
            font-family="sans-serif"
            class="letter"
          >
            ${letter}
          </text>
          <text
            x="70%"
            y="70%"
            dominant-baseline="middle"
            text-anchor="middle"
            fill="07031b"
            font-size="40%"
            font-weight="bold"
            font-family="sans-serif"
            class="points"
          >
            ${getPointsForLetter(letter)}
          </text>
        </g>
      </svg>
    `
  })

  svg += '</svg>'

  document.getElementById('board').innerHTML = svg
}

function generate() {
  // Log that we're starting a generation
  console.log('Starting generation...')

  // Reset the grid and words
  reset()

  // Iterate until all the words are placed, or the limit is reached
  let iterationLimit = words.length * 3

  const run = () => {
    // we've exhausted our iterations, throw and escape
    if (iterationLimit <= 0) {
      document.getElementById('board').innerText =
        'Iteration limit reached, please try again'
      throw Error('Iteration limit reached')
    }

    // Place the next word
    placeWord()
    // Write the board to the DOM
    // We could do this once it's finished, but this gives a nice animated effect
    writeGridToSVG()

    // While there's still words to place, do another run
    if (words.length > 0) {
      requestAnimationFrame(run)
      iterationLimit -= 1
    } else {
      console.log('Finished!')
    }
  }

  run()
}

generate()

document.getElementById('generate-button').onclick = generate
