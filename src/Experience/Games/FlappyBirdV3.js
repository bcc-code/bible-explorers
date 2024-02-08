class Player {
    constructor(canvas, gameOverCallback) {
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

        // Add event listeners for keydown and keyup
        document.addEventListener('keydown', this.handleKeyDown.bind(this))
        document.addEventListener('keyup', this.handleKeyUp.bind(this))
    }

    draw() {
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

class FlappyBird {
    constructor() {
        this.canvas = document.createElement('canvas')
        this.canvas.className = 'fixed left-0 top-0 z-50'
        this.ctx = this.canvas.getContext('2d')
        document.querySelector('#app').appendChild(this.canvas)

        // Load the background image
        this.bgImage = new Image()
        this.bgImage.src = 'games/flappybird/flappybirdbg.png'

        // Wait for the background image to load
        loadImage(this.bgImage).then(() => {
            // Once the image is loaded, resize the canvas and draw the background
            this.resizeCanvas()
            this.drawBackground()
            this.drawMenu()
        })

        // Initialize and bind resize event listener
        window.addEventListener('resize', () => {
            this.resizeCanvas()
            this.drawBackground()
            this.drawMenu()
        })

        // Listen for mouse clicks on the canvas
        this.canvas.addEventListener('click', (event) => {
            const mouseX = event.clientX - this.canvas.getBoundingClientRect().left
            const mouseY = event.clientY - this.canvas.getBoundingClientRect().top
            this.handleClick(mouseX, mouseY)
        })

        // Player instance (will be added when "Start" is clicked)
        this.player = null

        // Game over flag
        this.gameOver = false

        // Store the requestAnimationFrame ID
        this.gameLoop = null

        // Flag to indicate whether the game has started
        this.gameStarted = false
    }

    resizeCanvas() {
        // Set canvas dimensions based on browser width
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
    }

    drawBackground() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // Draw the background image repeatedly on the X-axis
        const imgWidth = this.bgImage.width

        // Calculate the number of repetitions needed to cover the canvas width
        const numRepetitions = Math.ceil(this.canvas.width / imgWidth)

        // Draw the background image for each repetition, maintaining full height
        for (let i = 0; i < numRepetitions; i++) {
            this.ctx.drawImage(this.bgImage, i * imgWidth, 0, imgWidth, this.canvas.height)
        }
    }

    drawMenu() {
        // Draw menu options
        this.ctx.fillStyle = 'white'
        this.ctx.font = '36px Arial' // Increase font size
        const startText = 'Start'
        const exitText = 'Exit'

        // Calculate the position to center the menu vertically and horizontally
        const centerX = this.canvas.width / 2
        const centerY = this.canvas.height / 2

        // Calculate the width of each text to center them properly
        const startTextWidth = this.ctx.measureText(startText).width
        const exitTextWidth = this.ctx.measureText(exitText).width

        // Draw "Start" text
        this.ctx.fillText(startText, centerX - startTextWidth / 2, centerY - 20)

        // Draw "Exit" text
        this.ctx.fillText(exitText, centerX - exitTextWidth / 2, centerY + 20)
    }

    handleClick(mouseX, mouseY) {
        if (!this.gameStarted) {
            // Check if the mouse click is within any menu option only if the game has not started
            const centerX = this.canvas.width / 2
            const centerY = this.canvas.height / 2
            const startTextWidth = this.ctx.measureText('Start').width
            const exitTextWidth = this.ctx.measureText('Exit').width

            const startTextX = centerX - startTextWidth / 2
            const startTextY = centerY - 20

            const exitTextX = centerX - exitTextWidth / 2
            const exitTextY = centerY + 20

            if (mouseX > startTextX && mouseX < startTextX + startTextWidth && mouseY > startTextY - 30 && mouseY < startTextY) {
                // Start option clicked
                this.startGame()
            } else if (mouseX > exitTextX && mouseX < exitTextX + exitTextWidth && mouseY > exitTextY - 30 && mouseY < exitTextY) {
                // Exit option clicked
                this.exitGame()
            }
        }
    }

    startGame() {
        // Implement game start logic here
        console.log('Game started!')

        // Set gameStarted flag to true
        this.gameStarted = true

        // Remove click event listener
        this.canvas.removeEventListener('click', this.handleClick)

        // Create player instance
        this.player = new Player(this.canvas, this.gameOverCallback.bind(this))

        // Start the game loop
        this.gameLoop = requestAnimationFrame(this.update.bind(this))
    }

    update() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // Redraw the background image
        this.drawBackground()

        // Update game state if game is not over
        if (!this.gameOver) {
            this.player.update()
        }

        // Request next frame if game is not over
        if (!this.gameOver) {
            this.gameLoop = requestAnimationFrame(this.update.bind(this))
        }
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
        const gameOverText = 'Game Over'
        const centerX = this.canvas.width / 2
        const centerY = this.canvas.height / 2
        const gameOverTextWidth = this.ctx.measureText(gameOverText).width
        this.ctx.fillText(gameOverText, centerX - gameOverTextWidth / 2, centerY)
    }

    exitGame() {
        // Implement game exit logic here
        console.log('Game exited!')
    }
}

function loadImage(image) {
    return new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
    })
}

export default FlappyBird
