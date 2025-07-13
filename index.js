const { shuffle, DEFAULT_WORDS = [], POINTS = {} } = window

const inputArea = document.getElementById('input-area')
inputArea.value = DEFAULT_WORDS.join('\n')

const preserveOrderCountInput = document.getElementById('preserve-order-count')

const getPointsForLetter = letter => POINTS[letter] || ''

const getWordsFromInput = () =>
  String(inputArea.value)
    .split('\n')
    .map(str => str.trim())
    .filter(Boolean)

let grid = []
let words = [...getWordsFromInput()]
let width = 0
let height = 0

// Calculate grid dimensions based on total letter count
const calculateGridSize = wordList => {
  const totalLetters = wordList.reduce((sum, word) => sum + word.length, 0)
  const size = Math.ceil(Math.sqrt(totalLetters * 2)) // More generous sizing
  return Math.max(size, 10) // Minimum size of 10x10
}

// Create helper functions for moving between 2d and 1d coordinates
const getIndex = (x, y) => y * width + x
const getCoords = index => ({
  x: index % width,
  y: Math.floor(index / width),
})

// Check if coordinates are within bounds
const isInBounds = (x, y) => x >= 0 && x < width && y >= 0 && y < height

// Safely get grid value with bounds checking
const getGridValue = (x, y) => {
  if (!isInBounds(x, y)) return undefined
  return grid[getIndex(x, y)]
}

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
  // Get words from input
  words = [...getWordsFromInput()].map(word => word.toUpperCase())

  if (words.length === 0) {
    throw new Error('Please enter at least one word')
  }

  // Calculate grid size
  width = height = calculateGridSize(words)

  // Create an empty grid
  grid = new Array(width * height).fill(undefined)

  // Remove the first word as the starting word
  const startingWord = words.shift()

  const preserveOrderCount = parseInt(preserveOrderCountInput.value || 0, 10)
  const nextWords = words.splice(0, preserveOrderCount)

  // Sort the rest of the words by length (longer words first)
  words.sort((a, b) => b.length - a.length)

  // Put preserved order words back at the beginning
  words.splice(0, 0, ...nextWords)

  // Place the starting word in the center
  const midPoint = Math.floor((width - startingWord.length) / 2)
  const startY = Math.floor(height / 2)

  startingWord.split('').forEach((letter, letterIndex) => {
    const x = midPoint + letterIndex
    if (isInBounds(x, startY)) {
      grid[getIndex(x, startY)] = letter
    }
  })
}

// Perform a single iteration for the next word in the words list
function placeWord() {
  if (words.length === 0) return false

  // Get the next word of the words list
  const word = words.shift()

  // Log which word we're trying to place
  console.log(`Attempting to place: "${word}"`)

  // Find all the intersections between each letter in the word and the existing words on the grid
  const intersections = findIntersections(word)

  // Shuffle the intersections for variety
  shuffle(intersections)

  // For each intersection, check for horizontal and vertical collisions
  for (const intersection of intersections) {
    // Try vertical placement
    if (tryPlaceWordVertical(word, intersection)) {
      return true
    }

    // Try horizontal placement
    if (tryPlaceWordHorizontal(word, intersection)) {
      return true
    }
  }

  // If we got here, the word didn't fit, put it back at the end
  words.push(word)
  return false
}

function tryPlaceWordVertical(word, intersection) {
  const cells = word.split('').map((letter, i) => {
    const x = intersection.x
    const y = intersection.y - intersection.letterIndex + i
    const gridElement = getGridValue(x, y)

    // Check validity
    const isInvalid =
      !isInBounds(x, y) ||
      (gridElement !== undefined && gridElement !== letter) ||
      (i === 0 && getGridValue(x, y - 1) !== undefined) ||
      (i === word.length - 1 && getGridValue(x, y + 1) !== undefined) ||
      (y !== intersection.y &&
        (getGridValue(x - 1, y) !== undefined ||
          getGridValue(x + 1, y) !== undefined))

    return { x, y, letter, isValid: !isInvalid }
  })

  if (cells.every(cell => cell.isValid)) {
    cells.forEach(({ x, y, letter }) => {
      grid[getIndex(x, y)] = letter
    })
    return true
  }
  return false
}

function tryPlaceWordHorizontal(word, intersection) {
  const cells = word.split('').map((letter, i) => {
    const x = intersection.x - intersection.letterIndex + i
    const y = intersection.y
    const gridElement = getGridValue(x, y)

    // Check validity
    const isInvalid =
      !isInBounds(x, y) ||
      (gridElement !== undefined && gridElement !== letter) ||
      (i === 0 && getGridValue(x - 1, y) !== undefined) ||
      (i === word.length - 1 && getGridValue(x + 1, y) !== undefined) ||
      (x !== intersection.x &&
        (getGridValue(x, y - 1) !== undefined ||
          getGridValue(x, y + 1) !== undefined))

    return { x, y, letter, isValid: !isInvalid }
  })

  if (cells.every(cell => cell.isValid)) {
    cells.forEach(({ x, y, letter }) => {
      grid[getIndex(x, y)] = letter
    })
    return true
  }
  return false
}

// Function to write the grid to SVG
function writeGridToSVG() {
  const tileSize = 32
  const boardElement = document.getElementById('board')

  const cells = grid.reduce((out, letter, index) => {
    if (letter !== undefined) {
      out.push({
        ...getCoords(index),
        letter,
      })
    }
    return out
  }, [])

  if (cells.length === 0) {
    boardElement.innerHTML =
      '<p style="color: #999; text-align: center;">No words placed yet.</p>'
    document.getElementById('download-button').disabled = true
    boardElement.classList.remove('has-content')
    return
  }

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
            fill="#07031a"
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
            fill="#07031a"
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

  boardElement.innerHTML = svg
  boardElement.classList.add('has-content')
  document.getElementById('download-button').disabled = false
}

function generate() {
  console.log('Starting generation...')

  try {
    // Reset the grid and words
    reset()

    // Clear any previous error messages
    const boardElement = document.getElementById('board')

    // Iterate until all words are placed or limit is reached
    let iterationLimit = words.length * 5 // Increased limit
    let attemptedWords = new Set() // Track words that have been attempted
    let lastWordCount = words.length

    const run = () => {
      // Check if we've exhausted iterations
      if (iterationLimit <= 0) {
        boardElement.innerHTML =
          '<p style="color: red; text-align: center;">Unable to place all words. Try with fewer words or shorter words.</p>'
        console.warn('Iteration limit reached. Remaining words:', words)
        return
      }

      // Check if we're stuck (no progress for a full cycle)
      if (
        words.length === lastWordCount &&
        attemptedWords.size >= words.length
      ) {
        boardElement.innerHTML =
          '<p style="color: orange; text-align: center;">Some words could not be placed. Try regenerating or adjusting the word list.</p>'
        console.warn('Generation stuck. Remaining words:', words)
        return
      }

      if (words.length !== lastWordCount) {
        lastWordCount = words.length
        attemptedWords.clear()
      }

      // Try to place a word
      if (words.length > 0) {
        const currentWord = words[0]
        const placed = placeWord()

        if (!placed) {
          attemptedWords.add(currentWord)
        }

        // Write the board to the DOM for animation effect
        writeGridToSVG()

        // Continue if there are still words to place
        if (words.length > 0) {
          requestAnimationFrame(run)
          iterationLimit -= 1
        } else {
          console.log('Finished successfully!')
        }
      }
    }

    run()
  } catch (error) {
    document.getElementById(
      'board'
    ).innerHTML = `<p style="color: red; text-align: center;">Error: ${error.message}</p>`
    console.error('Generation error:', error)
  }
}

// Initialize the interface
function initializeInterface() {
  // Set default words in textarea
  inputArea.value = DEFAULT_WORDS.join('\n')

  // Add input validation
  inputArea.addEventListener('input', () => {
    const words = getWordsFromInput()
    const generateButton = document.getElementById('generate-button')
    generateButton.disabled = words.length === 0
  })

  // Set up event listeners
  document.getElementById('generate-button').onclick = generate

  // Initial board display
  const boardElement = document.getElementById('board')
  boardElement.innerHTML =
    '<p style="color: #999; text-align: center;">Enter words below and click Generate to create your Scrabble board!</p>'
}

// Initialize when the page loads
initializeInterface()

// Remove the automatic generation on page load
// generate()
