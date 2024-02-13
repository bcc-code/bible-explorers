class Player {
    constructor(canvas, gameOverCallback, game) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.width = 64
        this.height = 48
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
        this.width = 96
        this.height = 768
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

class Box {
    constructor(canvas, x, y, width, height, speed) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.speed = speed
    }

    draw() {
        this.ctx.fillStyle = 'red' // Change color as needed
        this.ctx.fillRect(this.x, this.y, this.width, this.height)
    }

    move() {
        this.x -= this.speed
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

        // Win game flag
        this.gameWon = false

        // Store the requestAnimationFrame ID
        this.gameLoop = null

        // Flag to indicate whether the game has started
        this.gameStarted = false

        // Timer properties
        this.timer = 0
        this.lastPipeGenerationTime = 0
        this.pipeGenerationInterval = 2000 // Interval between pipe generations (in milliseconds)

        // Initialize dirty rectangles array
        this.dirtyRects = [{ x: 0, y: 0, width: this.canvas.width, height: this.canvas.height }]

        // Initialize the timer
        this.timerInterval = null

        // Flag to track if 30 seconds have passed
        this.boxSpawned = false

        // Box instance
        this.box = null

        // Initialize the round count and rounds completed count
        this.roundCount = 0
        this.roundsCompleted = 0
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

        // Reset game over and win game flags
        this.gameOver = false
        this.gameWon = false

        // Reset pipes array
        this.pipes = []

        // Reset game timer
        this.resetTimer()

        // Reset box spawn flag
        this.boxSpawned = false

        // Reset box instance
        this.box = null

        // Set gameStarted flag to true
        this.gameStarted = true

        // Remove click event listener
        this.canvas.removeEventListener('click', this.startGameClickHandler)

        // Reset player position and state
        this.player = new Player(this.canvas, this.gameOverCallback.bind(this), this)

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
        if (!this.boxSpawned) {
            const pipeGap = 256 // Gap between top and bottom pipes
            const minPipeHeight = 64 // Minimum height of pipes
            const maxPipeHeight = this.canvas.height - minPipeHeight - pipeGap // Maximum height of pipes
            const pipeSpeed = 3 // Speed of pipes

            // Generate new pipes
            const x = this.canvas.width
            const y = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight
            this.pipes.push(new Pipe(this.canvas, x, y, pipeGap, pipeSpeed, this.pipeTopImage, this.pipeBottomImage, this))

            // Update the last pipe generation time
            this.lastPipeGenerationTime = Date.now()
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
        if (!this.gameOver && !this.gameWon) {
            // Check for collisions
            this.checkCollisions()

            // Update player
            this.player.update()

            // Update and draw pipes
            this.updatePipes()

            // Generate pipes at regular intervals
            const currentTime = Date.now()
            if (!this.boxSpawned && currentTime - this.lastPipeGenerationTime > this.pipeGenerationInterval) {
                this.generatePipes()
                this.lastPipeGenerationTime = currentTime
            }

            // If 30 seconds have passed and the box hasn't spawned yet, create and move the box
            if (this.timer >= 30 && !this.boxSpawned && !this.box) {
                const boxX = this.canvas.width
                const boxY = this.player.y + this.player.height / 2 // Place box in the middle of player's height
                const boxWidth = 64 // Adjust dimensions as needed
                const boxHeight = 64
                const boxSpeed = 3 // Same speed as pipes
                this.box = new Box(this.canvas, boxX, boxY, boxWidth, boxHeight, boxSpeed)
                this.boxSpawned = true
            }

            // Move box towards the player if it exists
            if (this.box) {
                this.box.move()
                this.box.draw()
            }

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

        // Stop timer
        this.stopTimer()

        // Stop generating pipes after 30 seconds
        this.boxSpawned = true

        // Clear box instance
        this.box = null

        // Draw game over screen
        this.drawGameOverScreen()

        // Stop the game loop
        cancelAnimationFrame(this.gameLoop)
    }

    winGame() {
        this.gameWon = true
        console.log('You win!')
        this.stopTimer()
        this.boxSpawned = true
        this.box = null
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
        this.ctx.font = '20px Arial'
        const winGameText = 'You Win!'
        this.ctx.font = '36px Arial'
        this.ctx.fillText(winGameText, this.canvas.width / 2, this.canvas.height / 2 - 20)
        const roundText = `Round: ${this.roundCount}` // Display the round count\
        this.ctx.fillText(roundText, this.canvas.width / 2, this.canvas.height / 2 + 20) // Position the round count text
        this.ctx.font = '16px Arial'
        const winSubText = 'Click to start new round'
        this.ctx.fillText(winSubText, this.canvas.width / 2, this.canvas.height / 2 + 80) // Position the round count text
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
        if (this.box && this.detectCollision(player, this.box)) {
            this.winGame()
        }
    }

    drawTimer() {
        this.ctx.fillStyle = 'white'
        this.ctx.font = '24px Arial'
        this.ctx.textAlign = 'right'
        this.ctx.fillText(`Time: ${this.timer}s`, this.canvas.width - 10, 30)
    }

    remove() {
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

        // Clear any other resources as needed
    }
}

function loadImage(image) {
    return new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
    })
}

export default FlappyBird
