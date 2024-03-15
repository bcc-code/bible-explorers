import Experience from '../Experience.js'
import _e from '../Utils/Events.js'

let instance = null

export default class DuckGame {
    constructor() {
        instance = this

        this.experience = new Experience()

        // Base resolution
        this.baseWidth = 800
        this.baseHeight = 600
    }

    toggleGame() {
        this.canvas = document.createElement('canvas')
        this.canvas.className = 'fixed left-0 top-0 z-50'
        this.ctx = this.canvas.getContext('2d')
        this.experience.interface.gameContainer.appendChild(this.canvas)
        this.experience.setAppView('game')

        // Load the background image
        this.bgImage = new Image()
        this.bgImage.src = 'games/duck-game/Dukk_BG.jpg'

        // Load pipe images
        this.pipeTopImage = new Image()
        this.pipeTopImage.src = 'games/duck-game/Dukk_platform.png'
        this.pipeBottomImage = new Image()
        this.pipeBottomImage.src = 'games/duck-game/Dukk_platform.png'
        this.playerImage = new Image()
        this.playerImage.src = 'games/duck-game/Dukk_GLITCH.png'
        this.bibleBoxImage = new Image()
        this.bibleBoxImage.src = 'games/duck-game/Dukk_box.png'

        // Wait for all images to load
        Promise.all([loadImage(this.bgImage), loadImage(this.pipeTopImage), loadImage(this.pipeBottomImage), loadImage(this.playerImage), loadImage(this.bibleBoxImage)]).then(() => {
            // Once the images are loaded, resize the canvas and draw the background
            this.resizeCanvas()
            this.drawBackground()
            this.drawStartScreen()
        })

        // Initialize and bind resize event listener
        window.addEventListener('resize', () => {
            this.resizeCanvas()
            this.drawBackground()
            this.drawStartScreen()
        })

        // Adjusted in resizeCanvas method
        this.resizeCanvas()

        // Initialize the click event listener for starting the game
        this.startGameClickHandler = () => {
            this.startGame()
        }
        this.canvas.addEventListener('click', this.startGameClickHandler)

        // Player instance (will be added when "Start" is clicked)
        this.player = null

        // Pipes array
        this.pipes = []

        // Game over flag
        this.gameOver = false

        // Win game flag
        this.gameWon = false

        // Store the requestAnimationFrame ID
        this.gameLoop = null

        // Flag to indicate whether the game has started
        this.gameStarted = false

        // Timer properties
        this.lastPipeGenerationTime = 0
        this.pipeGenerationInterval = 1500

        // Initialize dirty rectangles array
        this.dirtyRects = [{ x: 0, y: 0, width: this.canvas.width, height: this.canvas.height }]

        // Initialize the timer
        this.timerInterval = null

        // Box instance
        this.bibleBoxSpawned = false
        this.bibleBox = null
        this.lastPipeX = 0

        // Initialize the round count and rounds completed count
        this.roundCount = 0
        this.roundsCompleted = 0

        // Invisible wall instance
        this.invisibleWall = null

        this.bgOffset = 0
        this.bgSpeed = 0.5

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy.bind(this))
    }

    resizeCanvas() {
        // Set canvas dimensions based on browser width
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight

        // Calculate scaling factors
        this.scaleX = this.canvas.width / this.baseWidth
        this.scaleY = this.canvas.height / this.baseHeight
    }

    drawBackground() {
        // Clear only the dirty rectangles
        this.dirtyRects.forEach((rect) => {
            this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height)
        })

        // Clear the dirty rectangles array
        this.dirtyRects = []

        // Calculate the number of repetitions needed to cover the canvas width
        const numRepetitions = Math.ceil(this.canvas.width / this.bgImage.width) + 1

        // Draw the background image for each repetition, maintaining full height
        for (let i = 0; i < numRepetitions; i++) {
            this.ctx.drawImage(this.bgImage, this.bgOffset + i * this.bgImage.width, 0, this.bgImage.width, this.canvas.height)
        }
    }

    drawStartScreen() {
        // Draw start screen message
        this.ctx.fillStyle = 'white'
        this.ctx.textAlign = 'center'
        this.ctx.font = '36px Arial' // Increase font size
        const message = 'Click to start the game'

        // Draw message
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2)
    }

    startGame() {
        // Implement game start logic here
        console.log('Game started!')

        // Reset game over and win game flags
        this.gameOver = false
        this.gameWon = false

        // Reset pipes array
        this.pipes = []

        // Reset game timer
        this.resetTimer()

        // Reset box spawn flag
        this.bibleBoxSpawned = false

        // Reset box instance
        this.bibleBox = null
        this.lastPipeX = 0

        // Reset Invisible wall instance
        this.invisibleWall = null

        // Set gameStarted flag to true
        this.gameStarted = true

        // Remove click event listener
        this.canvas.removeEventListener('click', this.startGameClickHandler)

        // Reset player position and state
        this.player = new Player(this.canvas, this.gameOverCallback.bind(this), this, this.playerImage)
        this.playerHasInteractedWithBox = false

        // Start the timer
        this.startTimer()

        // Start generating pipes
        this.generatePipes()

        // Start the game loop
        this.gameLoop = requestAnimationFrame(this.update.bind(this))
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++
        }, 1000) // Update the timer every second (1000 milliseconds)
    }

    stopTimer() {
        clearInterval(this.timerInterval)
    }

    resetTimer() {
        this.stopTimer()
        this.timer = 0
    }

    generatePipes() {
        // Generate new pipes only if 30 seconds haven't passed
        if (this.bibleBoxSpawned) return

        const pipeGap = this.canvas.height / 3
        const pipeSpeed = 3 * this.scaleX

        const minTopPipeY = this.canvas.height / 6
        const maxTopPipY = this.canvas.height - pipeGap - minTopPipeY

        // Generate new pipes
        const x = this.canvas.width
        const y = Math.random() * (maxTopPipY - minTopPipeY) + minTopPipeY

        this.pipes.push(new Pipe(this.canvas, x, y, pipeGap, pipeSpeed, this.pipeTopImage, this.pipeBottomImage, this))
        this.lastPipeGenerationTime = Date.now()

        this.lastPipeX = x
    }

    update() {
        // Clear only the dirty rectangles
        this.dirtyRects.forEach((rect) => {
            this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height)
        })

        // Clear the dirty rectangles array
        this.dirtyRects = []

        // Redraw the background image
        this.drawBackground()

        // Draw pipes
        this.drawPipes()

        // Draw the invisible wall if it exists and the box has spawned
        if (this.invisibleWall && this.bibleBoxSpawned) {
            this.invisibleWall.move()
            this.invisibleWall.draw(this.ctx)
        }

        // Draw game over or win game screen
        if (this.gameOver) {
            this.drawGameOverScreen()
        } else if (this.gameWon) {
            this.drawWinGameScreen()
        }

        // Draw timer
        this.drawTimer()

        // Request next frame if game is not over
        if (this.gameOver || this.gameWon) return

        // Check for collisions
        this.checkCollisions()

        // Update player
        this.player.update()

        // Update and draw pipes
        this.updatePipes()

        // Generate pipes at regular intervals
        const currentTime = Date.now()

        if (!this.bibleBoxSpawned && currentTime - this.lastPipeGenerationTime > this.pipeGenerationInterval) {
            this.generatePipes()
            this.lastPipeGenerationTime = currentTime
        }

        const timeSinceLastPipe = currentTime - this.lastPipeGenerationTime
        const lastPipeSpeed = this.pipes.length > 0 ? this.pipes[0].speed : 0 // Replace with default speed if no pipes exist
        const distanceFromLastPipe = this.canvas.width - (this.lastPipeX - lastPipeSpeed * timeSinceLastPipe)
        const boxSpawnDistance = this.pipeGenerationInterval * lastPipeSpeed

        // If 30 seconds have passed and the box hasn't spawned yet, create and move the box
        if (!this.bibleBoxSpawned && distanceFromLastPipe >= boxSpawnDistance) {
            const bibleBoxX = this.canvas.width
            const bibleBoxY = this.canvas.height / 2 // or any other y-position you want
            this.bibleBox = new BibleBox(this.canvas, bibleBoxX, bibleBoxY, lastPipeSpeed, this.bibleBoxImage, this)
            this.bibleBoxSpawned = true

            // Create invisible wall instance after the box is created
            const wallX = this.bibleBox.x + this.bibleBox.width // Position the wall just after the box
            const wallSpeed = 3 * this.scaleX
            this.invisibleWall = new InvisibleWall(this.canvas, wallX, wallSpeed) // Adjust speed as needed
        }

        // Move box towards the player if it exists
        if (this.bibleBox) {
            this.bibleBox.move()
            this.bibleBox.draw()
        }

        this.bgOffset -= this.bgSpeed
        if (this.bgOffset < -this.bgImage.width) {
            this.bgOffset += this.bgImage.width
        }

        this.gameLoop = requestAnimationFrame(this.update.bind(this))
    }

    updatePipes() {
        // Move pipes
        this.pipes.forEach((pipe) => {
            pipe.move()
        })

        // Remove pipes that are no longer visible
        this.pipes = this.pipes.filter((pipe) => pipe.isVisible())
    }

    drawPipes() {
        // Draw pipes
        this.pipes.forEach((pipe) => {
            pipe.draw()
        })
    }

    gameOverCallback() {
        // Game over logic
        this.gameOver = true
        console.log('Game over!')

        // Stop timer
        this.stopTimer()

        // Stop generating pipes after 30 seconds
        this.bibleBoxSpawned = true

        // Clear box instance
        this.bibleBox = null

        // Draw game over screen
        this.drawGameOverScreen()

        // Remove player's event listeners to prevent memory leaks or unintended behavior
        this.player.removeEventListeners()

        // Stop the game loop
        cancelAnimationFrame(this.gameLoop)
    }

    winGame() {
        this.gameWon = true
        console.log('You win!')
        this.stopTimer()
        this.bibleBoxSpawned = true
        this.bibleBox = null
        this.roundCount++
        this.roundsCompleted++ // Increment rounds completed count
        this.drawWinGameScreen()
        cancelAnimationFrame(this.gameLoop)

        // Check if rounds completed count equals 5
        if (this.roundsCompleted === 5) {
            // Perform actions for completing 5 rounds
            console.log('Congratulations! You have completed 5 rounds.')
            // You can add your custom actions here
        }
    }

    drawGameOverScreen() {
        // Draw game over screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.fillStyle = 'white'
        this.ctx.font = '36px Arial'
        this.ctx.textAlign = 'center'
        const gameOverText = 'Game Over'
        this.ctx.fillText(gameOverText, this.canvas.width / 2, this.canvas.height / 2)
        this.ctx.font = '20px Arial'
        const gameOverSubText = 'Click to restart'
        this.ctx.fillText(gameOverSubText, this.canvas.width / 2, this.canvas.height / 2 + 40)

        // Add click event listener to restart the game
        this.canvas.addEventListener('click', () => {
            if (this.gameOver) {
                this.startGame()
            }
        })
    }

    drawWinGameScreen() {
        // Draw win game screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.fillStyle = 'white'
        this.ctx.textAlign = 'center'
        this.ctx.font = '36px Arial'
        const winGameText = 'You Win!'
        this.ctx.fillText(winGameText, this.canvas.width / 2, this.canvas.height / 2)
        this.ctx.font = '16px Arial'
        const roundText = `Round: ${this.roundCount}` // Display the round count
        this.ctx.fillText(roundText, this.canvas.width / 2, this.canvas.height / 2 + 20)
        this.ctx.font = '20px Arial'
        const winSubText = 'Click to start new round'
        this.ctx.fillText(winSubText, this.canvas.width / 2, this.canvas.height / 2 + 60)
        // Add click event listener to restart the game
        this.canvas.addEventListener('click', () => {
            if (this.gameWon) {
                this.startGame()
            }
        })
    }

    markDirty(x, y, width, height) {
        this.dirtyRects.push({ x, y, width, height })
    }

    detectCollision(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
    }

    checkCollisions() {
        const player = this.player

        this.pipes.forEach((pipe) => {
            const topPipe = {
                x: pipe.x,
                y: pipe.y - pipe.height,
                width: pipe.width,
                height: pipe.height,
            }
            const bottomPipe = {
                x: pipe.x,
                y: pipe.y + pipe.gapHeight,
                width: pipe.width,
                height: pipe.height,
            }

            // Check collision with top pipe
            if (this.detectCollision(player, topPipe) || this.detectCollision(player, bottomPipe)) {
                this.gameOverCallback()
            }
        })

        // Check collision with box
        if (this.bibleBox && this.detectCollision(player, this.bibleBox)) {
            this.playerHasInteractedWithBox = true
            this.winGame()
        }

        // Check collision with the invisible wall

        if (this.invisibleWall && this.detectCollision(player, this.invisibleWall)) {
            if (!this.playerHasInteractedWithBox) {
                console.log('Missed the box!')
                this.gameOverCallback()
            }
        }
    }

    drawTimer() {
        this.ctx.fillStyle = 'white'
        this.ctx.font = '24px Arial'
        this.ctx.textAlign = 'right'
        this.ctx.fillText(`Time: ${this.timer}s`, this.canvas.width - 10, 30)
    }

    destroy() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // Remove canvas from the DOM
        this.canvas.parentNode.removeChild(this.canvas)

        // Stop timer if running
        if (this.timerInterval) {
            clearInterval(this.timerInterval)
        }

        // Reset game loop
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop)
        }

        // Remove click event listener for starting the game
        this.canvas.removeEventListener('click', this.startGameClickHandler)
        this.experience.setAppView('chapter')

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy.bind(this))
    }
}

class Player {
    constructor(canvas, gameOverCallback, game, playerImage) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.x = 50 * game.scaleX
        this.y = canvas.height / 2
        this.velocityY = 0
        this.gravity = 0.4 * game.scaleY
        this.jumpStrength = -6 * game.scaleY
        this.spacePressed = false
        this.gameOverCallback = gameOverCallback // Callback function for game over
        this.game = game // Reference to the game instance
        this.playerImage = playerImage

        const originalWidth = 111
        const originalHeight = 152
        const aspectRatio = originalHeight / originalWidth

        this.width = 32 * game.scaleX
        this.height = this.width * aspectRatio

        // Storing bound functions for later removal
        this.boundHandleKeyDown = this.handleKeyDown.bind(this)
        this.boundHandleKeyUp = this.handleKeyUp.bind(this)

        // Adding event listeners
        document.addEventListener('keydown', this.boundHandleKeyDown)
        document.addEventListener('keyup', this.boundHandleKeyUp)
    }

    draw() {
        // Mark the previous player position as dirty
        this.game.markDirty(this.x, this.y, this.width, this.height)

        // Apply gravity
        this.velocityY += this.gravity
        this.y += this.velocityY

        // Ensure the player stays within the canvas bounds
        if (this.y < 0) {
            this.y = 0 // Prevent player from going above the top edge
            this.velocityY = 0 // Stop upward velocity
            this.gameOverCallback() // Notify game over
        } else if (this.y + this.height > this.canvas.height) {
            this.y = this.canvas.height - this.height // Prevent player from going below the bottom edge
            this.velocityY = 0 // Stop downward velocity
            this.gameOverCallback() // Notify game over
        }

        // Draw the player
        this.ctx.drawImage(this.playerImage, this.x, this.y, this.width, this.height)

        // Mark the current player position as dirty
        this.game.markDirty(this.x, this.y, this.width, this.height)
    }

    jump() {
        this.velocityY = this.jumpStrength // Jump
    }

    handleKeyDown(event) {
        if (event.key === ' ') {
            this.spacePressed = true
        }
    }

    handleKeyUp(event) {
        if (event.key === ' ') {
            this.spacePressed = false
        }
    }

    update() {
        if (this.spacePressed) {
            this.jump()
        }
        this.draw()
    }

    // Call this method when you need to clean up (e.g., player is destroyed, game over, etc.)
    removeEventListeners() {
        document.removeEventListener('keydown', this.boundHandleKeyDown)
        document.removeEventListener('keyup', this.boundHandleKeyUp)
    }
}

class Pipe {
    constructor(canvas, x, y, gapHeight, speed, pipeTopImage, pipeBottomImage, game) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.x = x
        this.y = y
        this.gapHeight = gapHeight
        this.speed = speed
        this.pipeTopImage = pipeTopImage
        this.pipeBottomImage = pipeBottomImage
        this.game = game // Reference to the game instance

        const originalWidth = 186
        const originalHeight = 2000
        const aspectRatio = originalHeight / originalWidth

        this.width = 64 * game.scaleX
        this.height = this.width * aspectRatio
    }

    draw() {
        // Mark the previous pipe position as dirty
        this.game.markDirty(this.x, this.y - this.height, this.width, this.height)
        this.game.markDirty(this.x, this.y + this.gapHeight, this.width, this.height)

        // Draw top pipe
        this.ctx.drawImage(this.pipeTopImage, this.x, this.y - this.height, this.width, this.height)
        // Draw bottom pipe
        this.ctx.drawImage(this.pipeBottomImage, this.x, this.y + this.gapHeight, this.width, this.height)

        // Mark the current pipe position as dirty
        this.game.markDirty(this.x, this.y - this.height, this.width, this.height)
        this.game.markDirty(this.x, this.y + this.gapHeight, this.width, this.height)
    }

    move() {
        this.x -= this.speed
    }

    isVisible() {
        return this.x + this.width > 0
    }
}

class BibleBox {
    constructor(canvas, x, y, speed, bibleBoxImage, game) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.x = x
        this.y = y
        this.game = game
        this.bibleBoxImage = bibleBoxImage

        this.speed = speed // Same speed as pipes

        const originalWidth = 1639
        const originalHeight = 1088
        const aspectRatio = originalHeight / originalWidth

        this.width = 64 * game.scaleX
        this.height = this.width * aspectRatio
    }

    draw() {
        this.ctx.drawImage(this.bibleBoxImage, this.x, this.y, this.width, this.height)
    }

    move() {
        this.x -= this.speed
    }
}

class InvisibleWall {
    constructor(canvas, x, speed) {
        this.canvas = canvas
        this.x = x
        this.y = 0
        this.width = 10 // Adjust width as needed
        this.height = canvas.height // Same height as the canvas
        this.speed = speed // Speed of the wall
    }

    move() {
        // Move the wall towards the player
        this.x -= this.speed
    }

    draw(ctx) {
        // Draw the wall
        // ctx.fillStyle = 'transparent' // Set color to transparent
        // ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}

function loadImage(image) {
    return new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
    })
}
