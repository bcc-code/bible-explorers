class Player {
    constructor(canvas, ctx) {
        this.canvas = canvas
        this.ctx = ctx
        this.width = 40 // Width of the player
        this.height = 30 // Height of the player
        this.x = 50 // Initial x position
        this.y = this.canvas.height / 2 - this.height / 2 // Initial y position
        this.gravity = 0.5 // Gravity value
        this.jumpStrength = 10 // Strength of the jump
        this.velocity = 0 // Initial velocity
    }

    draw() {
        this.ctx.fillStyle = 'yellow'
        this.ctx.fillRect(this.x, this.y, this.width, this.height)
    }

    jump() {
        this.velocity = -this.jumpStrength
    }

    update() {
        this.velocity += this.gravity
        this.y += this.velocity

        // Keep the player within the canvas bounds
        if (this.y < 0) {
            this.y = 0
            this.velocity = 0
        } else if (this.y + this.height > this.canvas.height) {
            this.y = this.canvas.height - this.height
            this.velocity = 0
        }
    }
}

class Pipe {
    constructor(canvas, ctx, x) {
        this.canvas = canvas
        this.ctx = ctx
        this.x = x // Initial x position
        this.width = 50 // Width of the pipe
        this.gap = 150 // Gap between upper and lower pipe
        this.minHeight = 50 // Minimum height of the pipe
        this.maxHeight = this.canvas.height - this.gap - this.minHeight // Maximum height of the pipe
        this.upperHeight = Math.floor(Math.random() * (this.maxHeight - this.minHeight + 1)) + this.minHeight // Random height for upper pipe
        this.lowerHeight = this.canvas.height - this.upperHeight - this.gap // Height of the lower pipe
        this.speed = 2 // Speed at which the pipes move
    }

    draw() {
        // Draw upper pipe
        this.ctx.fillStyle = '#00ff00' // Green color
        this.ctx.fillRect(this.x, 0, this.width, this.upperHeight)

        // Draw lower pipe
        this.ctx.fillRect(this.x, this.canvas.height - this.lowerHeight, this.width, this.lowerHeight)
    }

    update() {
        this.x -= this.speed // Move the pipe towards the left
    }

    isOffScreen() {
        return this.x + this.width < 0 // Check if the pipe is completely off-screen
    }
}

class Game {
    constructor() {
        this.canvas = document.createElement('canvas')
        this.canvas.className = 'fixed left-0 top-0 z-50'
        this.ctx = this.canvas.getContext('2d')
        this.resizeCanvas()
        window.addEventListener('resize', () => this.resizeCanvas())
        document.body.appendChild(this.canvas)
        this.init()
        this.setupEventListeners()
        this.score = 0
        this.roundTime = 30 // Time for each round in seconds
        this.round = 1
        this.pipes = []
        this.pipeInterval = setInterval(() => this.spawnPipe(), 1500) // Interval for spawning pipes
        this.startTime = Date.now()
        this.gameLoop()
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
    }

    init() {
        this.player = new Player(this.canvas, this.ctx)
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                this.player.jump()
            }
        })
    }

    drawScore() {
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = '20px Arial'
        this.ctx.fillText(`Score: ${this.score}`, 20, 40)
    }

    drawRound() {
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = '20px Arial'
        this.ctx.fillText(`Round: ${this.round}`, 20, this.canvas.height - 20)
    }

    spawnPipe() {
        const x = this.canvas.width
        const pipe = new Pipe(this.canvas, this.ctx, x)
        this.pipes.push(pipe)
    }

    updatePipes() {
        this.pipes.forEach((pipe, index) => {
            pipe.update()
            if (pipe.isOffScreen()) {
                this.pipes.splice(index, 1)
                this.score++
            }
        })
    }

    drawPipes() {
        this.pipes.forEach((pipe) => pipe.draw())
    }

    gameLoop() {
        const currentTime = Date.now()
        const elapsedTime = (currentTime - this.startTime) / 1000 // Convert to seconds
        if (elapsedTime >= this.roundTime) {
            clearInterval(this.pipeInterval) // Stop spawning pipes
            this.startTime = Date.now() // Reset start time for the next round
            this.round++
            this.pipeInterval = setInterval(() => this.spawnPipe(), 1500) // Restart pipe spawning for the next round
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.player.update()
        this.drawScore()
        this.drawRound()
        this.drawPipes()
        this.updatePipes()

        requestAnimationFrame(() => this.gameLoop())
    }
}

export default Game
