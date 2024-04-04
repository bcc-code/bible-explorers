import Experience from '../Experience.js'
import _e from '../Utils/Events.js'

let instance = null

export default class DuckGame {
    constructor() {
        instance = this

        this.experience = new Experience()

        // Base resolution
        this.baseWidth = 1440
        this.baseHeight = 900
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

        instance.keydownHandler = (event) => {
            if (!this.gameStarted || this.gameOver || this.gameWon) {
                this.startGame()

                document.removeEventListener('keydown', instance.keydownHandler)
            }
        }
        document.addEventListener('keydown', instance.keydownHandler)

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

        this.useGravity = false

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    resizeCanvas() {
        // Set canvas dimensions based on browser width
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight

        // Calculate scaling factors
        this.scaleX = this.canvas.width / this.baseWidth
        this.scaleY = this.canvas.height / this.baseHeight

        // Calculate aspect ratio and adjustment factor
        const currentAspectRatio = this.canvas.width / this.canvas.height
        const baseAspectRatio = this.baseWidth / this.baseHeight
        this.aspectAdjustmentFactor = Math.min(1, baseAspectRatio / currentAspectRatio)
    }

    startGame() {
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

        // Reset player position and state
        this.player = new Player(this.canvas, this.gameOverCallback.bind(this), this, this.playerImage)
        this.playerHasInteractedWithBox = false

        // Start the timer
        this.startTimer()

        // Start generating pipes
        this.pipesGeneratedCount = 0
        this.pipesToWinRound = 10
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
        if (this.pipesGeneratedCount >= this.pipesToWinRound) {
            return // Do not generate more pipes if the target has been reached
        }

        const basePipeSpeed = 4 // Base speed at 800x600 resolution
        const pipeSpeed = basePipeSpeed * (this.canvas.width / this.baseWidth) * this.aspectAdjustmentFactor
        const pipeGap = this.canvas.height / 3
        const minTopPipeY = this.canvas.height / 6
        const maxTopPipeY = this.canvas.height - pipeGap - minTopPipeY
        const x = this.canvas.width

        const yIncrement = 50
        let y = Math.random() * (maxTopPipeY - minTopPipeY) + minTopPipeY
        y = Math.floor(y / yIncrement) * yIncrement

        this.pipes.push(new Pipe(this.canvas, x, y, pipeGap, pipeSpeed, this.pipeTopImage, this.pipeBottomImage, this))
        this.lastPipeX = x

        this.pipesGeneratedCount++
    }

    generatePipesIfNeeded() {
        // Ensure we haven't already generated the target number of pipes
        if (this.pipesGeneratedCount >= this.pipesToWinRound) {
            return
        }

        // Calculate the distance from the last pipe (if any exist)
        let distanceFromLastPipe = this.canvas.width // Default to full width if no pipes exist
        if (this.pipes.length > 0) {
            const lastPipe = this.pipes[this.pipes.length - 1]
            distanceFromLastPipe = this.canvas.width - lastPipe.x
        }

        // Define a minimum distance before generating a new pipe
        const originalMinDistance = (this.canvas.width / 6) * this.aspectAdjustmentFactor
        const minDistance = originalMinDistance * (this.canvas.width / this.baseWidth) * this.aspectAdjustmentFactor

        // Check if it's time to generate a new pipe
        if (distanceFromLastPipe >= minDistance) {
            this.generatePipes()
        }
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
        this.generatePipesIfNeeded()

        // Check if it's time to spawn the bible box and invisible wall
        if (!this.bibleBoxSpawned && this.pipesGeneratedCount >= this.pipesToWinRound && this.pipes.length > 0) {
            const lastPipe = this.pipes[this.pipes.length - 1]
            const distanceBetweenPipes = 200 * this.scaleX // Adjust based on your game's design
            const bibleBoxX = lastPipe.x + lastPipe.width + distanceBetweenPipes // Spawn after the last pipe at the same distance as between pipes
            const bibleBoxY = this.canvas.height / 2 // Center vertically or adjust based on your game's design
            this.bibleBox = new BibleBox(this.canvas, bibleBoxX, bibleBoxY, lastPipe.speed, this.bibleBoxImage, this)
            this.bibleBoxSpawned = true

            // Create invisible wall at the same X position as the bible box for consistency
            const invisibleWallX = bibleBoxX + 100 * this.scaleX
            this.invisibleWall = new InvisibleWall(this.canvas, invisibleWallX, lastPipe.speed)
        }

        // Then, in your update method or a separate method, handle the movement and drawing of the bible box
        if (this.bibleBoxSpawned && this.bibleBox) {
            this.bibleBox.move()
            this.bibleBox.draw()
        }

        if (this.invisibleWall && this.bibleBoxSpawned) {
            this.invisibleWall.move()
            this.invisibleWall.draw(this.ctx)
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

        this.stopTimer()
        this.bibleBoxSpawned = true
        this.bibleBox = null
        this.roundCount++
        this.roundsCompleted++
        this.drawWinGameScreen()

        cancelAnimationFrame(this.gameLoop)

        if (this.roundsCompleted === 5) {
            // Perform actions for completing 5 rounds
        }
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
        const message = 'Press any key to start'
        this.ctx.fillStyle = 'white'
        this.ctx.textAlign = 'center'
        this.ctx.font = '36px Arial'
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2)
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
        const gameOverSubText = 'Press any key to restart'
        this.ctx.fillText(gameOverSubText, this.canvas.width / 2, this.canvas.height / 2 + 40)

        document.addEventListener('keydown', instance.keydownHandler)
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
        const winSubText = 'Press any key to continue'
        this.ctx.fillText(winSubText, this.canvas.width / 2, this.canvas.height / 2 + 60)

        document.addEventListener('keydown', instance.keydownHandler)
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
            if (this.detectCollision(player.boundingBox, topPipe) || this.detectCollision(player.boundingBox, bottomPipe)) {
                this.gameOverCallback()
            }
        })

        // Check collision with box
        if (this.bibleBox && this.detectCollision(player.boundingBox, this.bibleBox)) {
            this.playerHasInteractedWithBox = true
            this.winGame()
        }

        // Check collision with the invisible wall

        if (this.invisibleWall && this.detectCollision(player.boundingBox, this.invisibleWall)) {
            if (!this.playerHasInteractedWithBox) {
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
        instance.ctx.clearRect(0, 0, instance.canvas.width, instance.canvas.height)

        // Stop timer if running
        if (instance.timerInterval) {
            clearInterval(instance.timerInterval)
        }

        // Remove canvas from the DOM
        instance.canvas.parentNode.removeChild(instance.canvas)

        // Reset game loop
        if (instance.gameLoop) {
            cancelAnimationFrame(instance.gameLoop)
        }

        instance.experience.setAppView('chapter')

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}

class Player {
    constructor(canvas, gameOverCallback, game, playerImage) {
        const baseGravity = 0.8
        const baseJumpStrength = -10

        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.x = 50 * game.scaleX
        this.y = canvas.height / 2
        this.velocityY = 0
        this.gravity = baseGravity * (canvas.height / game.baseHeight) * game.aspectAdjustmentFactor
        this.jumpStrength = baseJumpStrength * (canvas.height / game.baseHeight) * game.aspectAdjustmentFactor
        this.spacePressed = false
        this.gameOverCallback = gameOverCallback // Callback function for game over
        this.game = game // Reference to the game instance
        this.playerImage = playerImage

        const originalWidth = 111
        const originalHeight = 152
        const aspectRatio = originalHeight / originalWidth

        this.width = 64 * game.scaleX
        this.height = this.width * aspectRatio

        // Define the bounding box
        this.boundingBox = {
            x: this.x,
            y: this.y + this.height - this.width,
            width: this.width,
            height: this.width,
        }

        // Storing bound functions for later removal
        this.boundHandleKeyDown = this.handleKeyDown.bind(this)
        this.boundHandleKeyUp = this.handleKeyUp.bind(this)

        // Adding event listeners
        document.addEventListener('keydown', this.boundHandleKeyDown)
        document.addEventListener('keyup', this.boundHandleKeyUp)
    }

    updateBoundingBox() {
        // Update bounding box position
        this.boundingBox.x = this.x
        this.boundingBox.y = this.y + this.height - this.width
    }

    draw() {
        // Mark the previous player position as dirty
        this.game.markDirty(this.x, this.y, this.width, this.height)

        // Apply gravity
        if (this.game.useGravity) {
            this.velocityY += this.gravity
            this.y += this.velocityY
        }

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

        // Draw bounding box (for debug purposes)
        // this.ctx.strokeStyle = 'red' // Set the stroke color to red
        // this.ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height)

        // Draw the player
        this.ctx.drawImage(this.playerImage, this.x, this.y, this.width, this.height)

        // Mark the current player position as dirty
        this.game.markDirty(this.x, this.y, this.width, this.height)
    }

    jump() {
        this.velocityY = this.jumpStrength // Jump
    }

    handleKeyDown(event) {
        switch (event.key) {
            case ' ':
                this.spacePressed = true
                break
            case 'ArrowUp':
                this.upPressed = true
                break
            case 'ArrowDown':
                this.downPressed = true
                break
        }
    }

    handleKeyUp(event) {
        switch (event.key) {
            case ' ':
                this.spacePressed = false
                break
            case 'ArrowUp':
                this.upPressed = false
                break
            case 'ArrowDown':
                this.downPressed = false
                break
        }
    }

    update() {
        if (this.game.useGravity) {
            if (this.spacePressed) {
                this.jump()
            }
        } else {
            const movementAdjustment = 8 * this.game.scaleY * this.game.aspectAdjustmentFactor
            if (this.upPressed) {
                this.y -= movementAdjustment
            } else if (this.downPressed) {
                this.y += movementAdjustment
            }
        }

        this.draw()
        this.updateBoundingBox()
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

        this.width = 80 * game.scaleX
        this.height = this.width * aspectRatio
    }

    draw() {
        // Draw bounding box (for debug purposes)
        // this.ctx.strokeStyle = 'red' // Set the stroke color to blue
        // this.ctx.lineWidth = 2 // Set the line width for the rectangle

        // Mark the previous pipe position as dirty
        this.game.markDirty(this.x, this.y - this.height, this.width, this.height)
        this.game.markDirty(this.x, this.y + this.gapHeight, this.width, this.height)

        // Draw bounding box for top pipe
        this.ctx.strokeRect(this.x, this.y - this.height, this.width, this.height)

        // Draw bounding box for bottom pipe
        this.ctx.strokeRect(this.x, this.y + this.gapHeight, this.width, this.height)

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

        this.width = 96 * game.scaleX
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
        // only for debug
        // Draw the wall
        // ctx.fillStyle = 'red' // Set color to transparent
        // ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}

function loadImage(image) {
    return new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
    })
}
