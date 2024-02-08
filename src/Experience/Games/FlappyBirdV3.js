class Player {
    constructor(canvas, gameOverCallback, game) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.width = 32
        this.height = 24
        this.x = 50
        this.y = canvas.height / 2
        this.velocityY = 0
        this.gravity = 0.4
        this.jumpStrength = -6
        this.spacePressed = false
        this.gameOverCallback = gameOverCallback // Callback function for game over
        this.game = game // Reference to the game instance

        // Add event listeners for keydown and keyup
        document.addEventListener('keydown', this.handleKeyDown.bind(this))
        document.addEventListener('keyup', this.handleKeyUp.bind(this))
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
        this.ctx.fillStyle = 'yellow'
        this.ctx.fillRect(this.x, this.y, this.width, this.height)

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
}

class Pipe {
    constructor(canvas, x, y, gapHeight, speed, pipeTopImage, pipeBottomImage, game) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.x = x
        this.y = y
        this.gapHeight = gapHeight
        this.width = 64
        this.height = 512
        this.speed = speed
        this.pipeTopImage = pipeTopImage
        this.pipeBottomImage = pipeBottomImage
        this.game = game // Reference to the game instance
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

class FlappyBird {
    constructor() {
        this.canvas = document.createElement('canvas')
        this.canvas.className = 'fixed left-0 top-0 z-50'
        this.ctx = this.canvas.getContext('2d')
        document.querySelector('#app').appendChild(this.canvas)

        // Load the background image
        this.bgImage = new Image()
        this.bgImage.src = 'games/flappybird/flappybirdbg.png'

        // Load pipe images
        this.pipeTopImage = new Image()
        this.pipeTopImage.src = 'games/flappybird/toppipe.png'
        this.pipeBottomImage = new Image()
        this.pipeBottomImage.src = 'games/flappybird/bottompipe.png'

        // Wait for all images to load
        Promise.all([loadImage(this.bgImage), loadImage(this.pipeTopImage), loadImage(this.pipeBottomImage)]).then(() => {
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

        // Store the requestAnimationFrame ID
        this.gameLoop = null

        // Flag to indicate whether the game has started
        this.gameStarted = false

        // Store the pipe generation timeout ID
        this.pipeGenerationTimeout = null

        // Initialize dirty rectangles array
        this.dirtyRects = [{ x: 0, y: 0, width: this.canvas.width, height: this.canvas.height }]
    }

    resizeCanvas() {
        // Set canvas dimensions based on browser width
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
    }

    drawBackground() {
        // Clear only the dirty rectangles
        this.dirtyRects.forEach((rect) => {
            this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height)
        })

        // Clear the dirty rectangles array
        this.dirtyRects = []

        // Draw the background image repeatedly on the X-axis
        const imgWidth = this.bgImage.width

        // Calculate the number of repetitions needed to cover the canvas width
        const numRepetitions = Math.ceil(this.canvas.width / imgWidth)

        // Draw the background image for each repetition, maintaining full height
        for (let i = 0; i < numRepetitions; i++) {
            this.ctx.drawImage(this.bgImage, i * imgWidth, 0, imgWidth, this.canvas.height)
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

        // Reset game over flag
        this.gameOver = false

        // Reset pipes array
        this.pipes = []

        // Set gameStarted flag to true
        this.gameStarted = true

        // Remove click event listener
        this.canvas.removeEventListener('click', this.startGameClickHandler)

        // Reset player position and state
        this.player = new Player(this.canvas, this.gameOverCallback.bind(this), this)

        // Cancel any existing pipe generation timeout
        if (this.pipeGenerationTimeout) {
            clearTimeout(this.pipeGenerationTimeout)
        }

        // Start generating pipes
        this.generatePipes()

        // Start the game loop
        this.gameLoop = requestAnimationFrame(this.update.bind(this))
    }

    generatePipes() {
        const pipeGap = 150 // Gap between top and bottom pipes
        const minPipeHeight = 100 // Minimum height of pipes
        const maxPipeHeight = this.canvas.height - minPipeHeight - pipeGap // Maximum height of pipes
        const pipeSpeed = 3 // Speed of pipes

        // Generate new pipes
        const x = this.canvas.width
        const y = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight
        this.pipes.push(new Pipe(this.canvas, x, y, pipeGap, pipeSpeed, this.pipeTopImage, this.pipeBottomImage, this))

        // Schedule next pipe generation
        this.pipeGenerationTimeout = setTimeout(this.generatePipes.bind(this), 2000) // Change this value to adjust pipe generation interval
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

        // Update game state if game is not over
        if (!this.gameOver) {
            // Update player
            this.player.update()

            // Update and draw pipes
            this.updatePipes()
        }

        // Draw game over screen
        if (this.gameOver) {
            this.drawGameOverScreen()
        }

        // Request next frame if game is not over
        if (!this.gameOver) {
            this.gameLoop = requestAnimationFrame(this.update.bind(this))
        }
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

        // Draw game over screen
        this.drawGameOverScreen()
        // Stop the game loop
        cancelAnimationFrame(this.gameLoop)
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

        // Add click event listener to restart the game
        this.canvas.addEventListener('click', () => {
            if (this.gameOver) {
                this.startGame()
            }
        })
    }

    markDirty(x, y, width, height) {
        this.dirtyRects.push({ x, y, width, height })
    }
}

function loadImage(image) {
    return new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
    })
}

export default FlappyBird
