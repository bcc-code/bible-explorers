class Bird {
    constructor(canvas) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.x = 50
        this.y = canvas.height / 2
        this.radius = 15
        this.color = 'red'
        this.velocityY = 0
        this.gravity = 0.4
        this.jumpStrength = -6
    }

    flap() {
        // Check if the bird is already at the top of the canvas
        if (this.y - this.radius > 0) {
            this.velocityY = this.jumpStrength
        }
    }

    update() {
        // Update bird's position based on velocity and gravity
        this.velocityY += this.gravity
        this.y += this.velocityY

        // Keep bird within canvas bounds
        if (this.y + this.radius >= this.canvas.height) {
            this.y = this.canvas.height - this.radius
            this.velocityY = 0
        }
    }

    draw() {
        // Draw the bird
        this.ctx.beginPath()
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        this.ctx.fillStyle = this.color
        this.ctx.fill()
        this.ctx.closePath()
    }
}

class Pipe {
    constructor(canvas, x) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.x = x
        this.width = 64 // Adjust pipe width as needed
        this.color = 'green' // Adjust pipe color as needed
        this.speed = 2 // Adjust pipe speed as needed
        this.gap = 150 // Adjust gap between pipes as needed
        this.upperHeight = Math.random() * (canvas.height - this.gap - 100) + 50 // Adjust upper pipe height randomly
        this.lowerHeight = canvas.height - this.upperHeight - this.gap // Calculate lower pipe height
        this.passed = false // Flag to track if bird has passed the pipe
    }

    update() {
        // Move the pipe to the left
        this.x -= this.speed

        // If the pipe moves off-screen, remove it from the array
        return this.x + this.width < 0
    }

    draw() {
        // Draw upper pipe
        this.ctx.fillStyle = this.color
        this.ctx.fillRect(this.x, 0, this.width, this.upperHeight)

        // Draw lower pipe
        this.ctx.fillRect(this.x, this.canvas.height - this.lowerHeight, this.width, this.lowerHeight)
    }
}

export class Game {
    constructor() {
        this.canvas = document.createElement('canvas')
        this.canvas.className = 'absolute top-0 left-0 z-50'
        this.ctx = this.canvas.getContext('2d')
        document.querySelector('#app').appendChild(this.canvas)

        // Initialize game objects
        this.bird = new Bird(this.canvas)
        this.pipes = []

        // Initialize score
        this.score = 0

        // Initialize flag to track game over state
        this.gameOver = false

        // Initialize elapsed time
        this.elapsedTime = 0

        // Record the start time
        this.startTime = 0

        // Initialize game state
        this.isGameStarted = false

        // Add event listener to start the game
        document.addEventListener('keydown', (event) => {
            // If game is over, allow player to restart by pressing spacebar
            if (this.gameOver && event.code === 'Space') {
                this.restartGame()
            }
            // If game is not over and game hasn't started, start the game on spacebar press
            else if (!this.isGameStarted && event.code === 'Space') {
                this.startGame()
            }
            // If game is running, allow player to control the bird by pressing spacebar
            else if (this.isGameStarted && !this.gameOver && event.code === 'Space') {
                this.bird.flap()
            }
        })

        // Initialize and bind resize event listener
        window.addEventListener('resize', () => {
            this.resizeCanvas()
        })

        // Resize canvas initially
        this.resizeCanvas()
    }

    resizeCanvas() {
        // Set canvas dimensions based on browser width
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight

        // Adjust initial positions and sizes of game objects
        this.bird.y = this.canvas.height / 2
        this.pipes.forEach((pipe) => {
            pipe.canvas = this.canvas
            pipe.upperHeight = Math.random() * (this.canvas.height - pipe.gap - 100) + 50
            pipe.lowerHeight = this.canvas.height - pipe.upperHeight - pipe.gap
        })

        // Render the game after resizing
        this.render()
    }

    addInitialPipes() {
        // Add some initial pipes to start the game
        for (let i = 1; i <= 3; i++) {
            const x = this.canvas.width + i * 300 // Adjust spacing between pipes as needed
            this.pipes.push(new Pipe(this.canvas, x))
        }
    }

    update() {
        // Update game objects
        if (!this.gameOver) {
            this.bird.update()

            // Update pipes
            for (let i = this.pipes.length - 1; i >= 0; i--) {
                const pipe = this.pipes[i]
                if (pipe.update()) {
                    this.pipes.splice(i, 1)
                }

                // Check for collision with bird
                if (this.checkCollision(pipe)) {
                    console.log('Collision detected!')
                    this.gameOver = true
                }

                // Check if bird has passed the pipe
                if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
                    pipe.passed = true
                    this.score++ // Increment score
                }
            }

            // Check if it's time to add a new pipe
            const lastPipe = this.pipes[this.pipes.length - 1]
            const minPipeSpacing = 300 // Adjust minimum spacing between pipes as needed
            if (lastPipe && this.canvas.width - lastPipe.x > minPipeSpacing) {
                const x = this.canvas.width // Position the new pipe off-screen to the right
                this.pipes.push(new Pipe(this.canvas, x))
            }

            // Check for game over condition (bird hits ground)
            if (this.bird.y + this.bird.radius >= this.canvas.height) {
                console.log('Game over!')
                this.gameOver = true
            }
        }

        // Update elapsed time if game is running
        if (this.isGameStarted && !this.gameOver) {
            const currentTime = Date.now()
            this.elapsedTime = Math.floor((currentTime - this.startTime) / 1000) // Convert milliseconds to seconds
        }
    }

    render() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // Draw background image repeatedly on x-axis
        const backgroundImage = new Image()
        backgroundImage.src = 'games/flappybird/flappybirdbg.png'
        const bgWidth = backgroundImage.width
        const bgHeight = backgroundImage.height
        let x = 0
        while (x < this.canvas.width) {
            this.ctx.drawImage(backgroundImage, x, 0, bgWidth, bgHeight)
            x += bgWidth
        }

        // Render game objects if game is running
        if (this.isGameStarted) {
            this.bird.draw()
            this.pipes.forEach((pipe) => pipe.draw())

            // Render score
            this.ctx.font = '24px Arial'
            this.ctx.textAlign = 'left'
            this.ctx.fillStyle = 'white'
            this.ctx.fillText(`Score: ${this.score}`, 20, 30)

            // Render elapsed time
            this.ctx.fillText(`Time: ${this.elapsedTime} seconds`, 20, 60)

            // Render game over text if game is over
            if (this.gameOver) {
                this.ctx.font = '48px Arial'
                this.ctx.textAlign = 'center'
                this.ctx.fillStyle = 'red'
                this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2)
                this.ctx.font = '24px Arial'
                this.ctx.fillText('Press Space to Restart', this.canvas.width / 2, this.canvas.height / 2 + 40)
            }
        } else {
            // Render start screen
            this.ctx.font = '36px Arial'
            this.ctx.textAlign = 'center'
            this.ctx.fillStyle = 'white'
            this.ctx.fillText('Press Space to Start', this.canvas.width / 2, this.canvas.height / 2)
        }
    }

    gameLoop() {
        this.update()
        this.render()
        this.animationFrame = requestAnimationFrame(() => this.gameLoop())
    }

    checkCollision(pipe) {
        // Check collision between bird and pipe
        const birdRight = this.bird.x + this.bird.radius
        const birdBottom = this.bird.y + this.bird.radius
        const pipeLeft = pipe.x
        const pipeRight = pipe.x + pipe.width
        const upperPipeBottom = pipe.upperHeight
        const lowerPipeTop = this.canvas.height - pipe.lowerHeight + this.bird.radius

        // Check if bird intersects with pipe horizontally
        if (birdRight > pipeLeft && this.bird.x < pipeRight) {
            // Check if bird intersects with upper pipe segment
            if (this.bird.y - this.bird.radius < upperPipeBottom) {
                return true
            }
            // Check if bird intersects with lower pipe segment
            if (birdBottom + this.bird.radius > lowerPipeTop) {
                return true
            }
        }
        return false
    }

    restartGame() {
        // Reset game variables
        this.score = 0
        this.gameOver = false
        this.bird = new Bird(this.canvas)
        this.pipes = []
        this.startTime = Date.now() // Record the start time

        // Stop the current game loop
        cancelAnimationFrame(this.animationFrame)

        // Add initial pipes
        this.addInitialPipes()

        // Start a new game loop
        this.gameLoop()
    }

    startGame() {
        // Start the game
        this.isGameStarted = true
        this.startTime = Date.now() // Record the start time
        this.gameLoop()
    }
}
