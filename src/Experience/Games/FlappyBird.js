import Experience from '../Experience'

let instance

export default class FlappyBird {
    // Constants
    static PIPE_PLACEMENT_INTERVAL = 1500
    static GRAVITY = 0.4
    static JUMP_VELOCITY = -6

    constructor() {
        instance = this
        this.experience = new Experience()

        // Board
        this.board
        this.boardWidth = 1024
        this.boardHeight = 640
        this.context

        // Bird
        this.birdWidth = 32
        this.birdHeight = 24
        this.birdX = this.boardWidth / 8
        this.birdY = this.boardHeight / 2

        // Physics
        this.velocityX = -4 // pipes moving left speed
        this.velocityY = 0 // bird jump speed

        // States
        this.gameOver = false
        this.score = 0
        this.initiated = false

        // Timer
        this.startTime = null
        this.elapsedTime = 0

        // Load images
        this.backgroundImage = new Image()
        this.backgroundImage.src = 'games/flappybird/flappybirdbg.png'

        this.birdImage = new Image()
        this.birdImage.src = 'games/flappybird/flappybird.png'

        this.topPipeImage = new Image()
        this.topPipeImage.src = 'games/flappybird/toppipe.png'

        this.bottomPipeImage = new Image()
        this.bottomPipeImage.src = 'games/flappybird/bottompipe.png'

        // Call the initGame method after all images are loaded
        Promise.all([instance.loadImage(instance.backgroundImage), instance.loadImage(instance.birdImage), instance.loadImage(instance.topPipeImage), instance.loadImage(instance.bottomPipeImage)]).then(() => {
            instance.initGame()
        })
    }

    loadImage(image) {
        return new Promise((resolve, reject) => {
            image.onload = resolve
            image.onerror = reject
        })
    }

    initGame() {
        instance.setBoard()
        instance.setBird()
        instance.setPipes()
        instance.setBox()

        // Display start screen initially
        instance.startScreen()

        document.addEventListener('keydown', instance.startGameOnEnter)
        document.querySelector('body').append(instance.board)
    }

    startScreen() {
        instance.context.clearRect(0, 0, instance.board.width, instance.board.height)

        instance.drawBackground()

        // Draw the start screen
        instance.context.textAlign = 'center'
        instance.context.fillStyle = 'white'
        instance.context.font = '36px sans-serif'
        instance.context.fillText('Flappy Bird', instance.boardWidth / 2, instance.boardHeight / 3)
        instance.context.font = '16px sans-serif'
        instance.context.fillText('Press space to start', instance.boardWidth / 2, instance.boardHeight / 2)
    }

    startGameOnEnter = (e) => {
        if (instance.initiated) return
        if (e.code === 'Space') {
            instance.initiated = true
            instance.startTime = new Date().getTime()

            // Start the game
            requestAnimationFrame(instance.update)
            instance.pipesInterval = setInterval(instance.placePipes, FlappyBird.PIPE_PLACEMENT_INTERVAL) // every 1.5 seconds
            document.addEventListener('keydown', instance.moveBird)
        }
    }

    setBoard() {
        this.board = document.createElement('canvas')
        this.board.setAttribute('id', 'flappyBird')
        this.board.className = 'z-50 fixed  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
        this.board.height = instance.boardHeight
        this.board.width = instance.boardWidth

        this.context = instance.board.getContext('2d') // used for drawing on the board
    }

    setBird() {
        this.bird = {
            x: this.birdX,
            y: this.birdY,
            width: this.birdWidth,
            height: this.birdHeight,
        }
    }

    setPipes() {
        this.pipeArray = []

        this.pipeWidth = 64 // width/height ratio = 384/3072 = 1/8
        this.pipeHeight = 512
        this.pipeX = instance.board.width
        this.pipeY = 0
    }

    setBox() {
        this.boxWidth = 24
        this.boxHeight = 24
        this.boxX = instance.board.width
        this.boxY = 0
    }

    moveBird = (e) => {
        // jump
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            instance.velocityY = FlappyBird.JUMP_VELOCITY
        } else {
            return
        }

        // reset game
        if (instance.gameOver) {
            instance.bird.y = instance.birdY
            instance.pipeArray = []
            instance.score = 0
            instance.gameOver = false

            // Reset the timer for a new round
            instance.startTime = new Date().getTime()
        }
    }

    placePipes() {
        if (instance.gameOver) return

        let randomPipeY = instance.pipeY - instance.pipeHeight / 4 - Math.random() * (instance.pipeHeight / 2)
        let openingSpace = instance.board.height / 4

        instance.placePipe({
            img: instance.topPipeImage,
            x: instance.pipeX,
            y: randomPipeY,
            width: instance.pipeWidth,
            height: instance.pipeHeight,
        })

        instance.placePipe({
            img: instance.bottomPipeImage,
            x: instance.pipeX,
            y: randomPipeY + instance.pipeHeight + openingSpace,
            width: instance.pipeWidth,
            height: instance.pipeHeight,
        })
    }

    placePipe(pipe) {
        instance.pipeArray.push(pipe)
    }

    // Improved collision detection by checking specific edges
    detectCollision(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
    }

    drawBackground() {
        const pattern = instance.context.createPattern(instance.backgroundImage, 'repeat')
        instance.context.fillStyle = pattern
        instance.context.fillRect(0, 0, instance.board.width, instance.board.height)
    }

    drawBird() {
        instance.context.drawImage(instance.birdImage, instance.bird.x, instance.bird.y, instance.bird.width, instance.bird.height)
    }

    drawPipes() {
        for (let i = 0; i < instance.pipeArray.length; i++) {
            let pipe = instance.pipeArray[i]
            pipe.x += instance.velocityX
            instance.context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height)

            if (!pipe.passed && instance.bird.x > pipe.x + pipe.width) {
                instance.score += 0.5
                pipe.passed = true
            }

            // Improved collision detection
            if (instance.detectCollision(instance.bird, pipe)) {
                instance.gameOver = true
                console.log('end')
            }
        }
    }

    drawScore() {
        instance.context.textAlign = 'center'
        instance.context.fillStyle = 'white'
        instance.context.font = '48px sans-serif'
        instance.context.fillText(instance.score, instance.boardWidth / 2, 45)
    }

    drawGameOverScreen() {
        instance.context.fillText('Game over', instance.boardWidth / 2, instance.boardHeight / 2)
        instance.context.font = '16px sans-serif'
        instance.context.fillText('Press space to start again', instance.boardWidth / 2, instance.boardHeight / 2 + 40)
    }

    drawTimer() {
        instance.context.textAlign = 'left'
        instance.context.fillStyle = 'white'
        instance.context.font = '24px sans-serif'
        instance.context.fillText(`${instance.elapsedTime}s`, 20, 40)
    }

    clearCanvas() {
        instance.context.clearRect(0, 0, instance.board.width, instance.board.height)
    }

    update() {
        requestAnimationFrame(instance.update)

        if (instance.gameOver) return

        // Calculate elapsed time
        let currentTime = new Date().getTime()
        const totalElapsedSeconds = Math.floor((currentTime - instance.startTime) / 1000) //in seconds
        instance.elapsedTime = totalElapsedSeconds % 60

        instance.clearCanvas()

        instance.velocityY += FlappyBird.GRAVITY
        instance.bird.y = Math.max(instance.bird.y + instance.velocityY, 0)

        instance.drawBackground()
        instance.drawBird()
        instance.drawPipes()
        instance.drawScore()

        if (instance.bird.y > instance.board.height) {
            instance.gameOver = true
        }

        // Clear pipes outside of the screen for memory leak
        while (instance.pipeArray.length > 0 && instance.pipeArray[0].x < -instance.pipeWidth) {
            instance.pipeArray.shift()
        }

        if (instance.gameOver) {
            instance.drawGameOverScreen()
        }

        instance.drawTimer()
    }
}
