# 🎲 Scrabble Tiles Generator

A self-contained web application that generates a Scrabble-style crossword board from a list of names or words. Perfect for creating personalized gifts, family boards, or word puzzles.

## ✨ Features

- **Interactive word placement**: Automatically arranges words in a crossword-style layout
- **Scrabble-style tiles**: Each letter displays its Scrabble point value
- **Blank tiles for spaces**: Words with spaces (like "Mr Smith") show blank tiles for spaces
- **Customizable word order**: Option to preserve the order of certain words
- **SVG download**: Export your board as a scalable vector graphic
- **Responsive design**: Works on desktop and mobile devices
- **Real-time generation**: Watch the board build as words are placed

## 🚀 Usage

1. Open `index.html` in your web browser
2. Enter words or names in the text area (one per line)
   - Use spaces in names like "Mr Smith" or "New York" for blank tiles
3. Optionally set how many words after the first should remain in order
4. Click "Generate Board" to create your Scrabble tiles layout
5. Click "Download SVG" to save your board

**Pro Tip**: Use the sample buttons to try different word types, including "Try Words with Spaces" to see blank tiles in action!

## 🛠️ How It Works

The algorithm:

1. Places the first word horizontally in the center of the grid
2. For each subsequent word, finds intersection points with existing letters
3. Attempts to place words both horizontally and vertically
4. Uses collision detection to ensure words don't overlap improperly
5. Employs shuffling for variety in word placement

## 🎯 Tips for Best Results

- Start with a good "anchor" word (the first word) that has common letters
- Mix long and short words for better layout variety
- Words with repeated letters often work well as anchor words
- If generation fails, try reordering words or using shorter words

## 🔧 Technical Details

- Pure JavaScript (ES6+) with no external dependencies
- SVG-based rendering for crisp, scalable output
- Fisher-Yates shuffle algorithm for randomization
- Responsive CSS Grid and Flexbox layout
- Modular code structure for easy maintenance

## 📁 Files

- `index.html` - Main application interface
- `index.js` - Core word placement algorithm and UI logic
- `words.js` - Default word list
- `points.js` - Scrabble letter point values
- `knuth-shuffle.js` - Randomization utility
- `download.js` - SVG export functionality

## 🐛 Troubleshooting

- **"Unable to place all words"**: Try using fewer words or shorter words
- **Words appear cramped**: The algorithm automatically calculates grid size, but very long words may need manual adjustment
- **Generation is slow**: Complex word lists may take longer to process

## 🎨 Customization

You can easily customize:

- Letter tile colors by modifying the SVG `fill` attributes in `writeGridToSVG()`
- Default word list in `words.js`
- Grid sizing algorithm in `calculateGridSize()`
- Scrabble point values in `points.js`

---

_Created as a personalized gift generator - perfect for family names, friend groups, or any special word collection!_
