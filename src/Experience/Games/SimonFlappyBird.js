import Experience from '../Experience'
import _gl from '../Utils/Globals'

let instance

export default class FlappyBird {
    constructor() {
        instance = this
        this.experience = new Experience()
        this.init()
    }

    init() {
        instance.setBoard()
        instance.setBird()
        instance.setPipes()
        instance.setPhysics()
    }

    startGame() {
        instance.destroy()
        instance.gameOver = false
        instance.score = 0

        document.querySelector('body').append(instance.board)
        requestAnimationFrame(instance.update)

        instance.pipesInterval = setInterval(instance.placePipes, 1500) //every 1.5 seconds

        instance.moveBird = (e) => {
            // jump
            if (e.code == 'Space' || e.code == 'ArrowUp') {
                instance.velocityY = -6
            }

            // reset game
            if (instance.gameOver) {
                instance.bird.y = instance.birdY
                instance.pipeArray = []
                instance.score = 0
                instance.gameOver = false
            }
        }

        document.addEventListener('keydown', instance.moveBird)
    }

    setBoard() {
        instance.boardWidth = 360
        instance.boardHeight = 640

        instance.board = document.createElement('canvas')
        instance.board.setAttribute('id', 'flappyBird')
        instance.board.style.backgroundImage = 'url("games/flappybird/flappybirdbg.png")'
        instance.board.className = 'z-50 fixed bottom-16 right-4'
        instance.board.height = instance.boardHeight
        instance.board.width = instance.boardWidth

        instance.context = instance.board.getContext('2d') //used for drawind on the board
    }

    setBird() {
        instance.birdWidth = 32
        instance.birdHeight = 24
        instance.birdX = instance.boardWidth / 8
        instance.birdY = instance.boardHeight / 2

        instance.bird = {
            x: instance.birdX,
            y: instance.birdY,
            width: instance.birdWidth,
            height: instance.birdHeight,
        }

        instance.birdImage = new Image()
        instance.birdImage.src = 'games/flappybird/flappybird.png'
        instance.birdImage.onload = function () {
            instance.context.drawImage(instance.birdImage, instance.bird.x, instance.bird.y, instance.bird.width, instance.bird.height)
        }
    }

    setPipes() {
        instance.pipeArray = []

        instance.pipeWidth = 64 //width/height ratio = 384/3072 = 1/8
        instance.pipeHeight = 512
        instance.pipeX = instance.board.width
        instance.pipeY = 0

        instance.topPipeImage = new Image()
        instance.topPipeImage.src = 'games/flappybird/toppipe.png'

        instance.bottomPipeImage = new Image()
        instance.bottomPipeImage.src = 'games/flappybird/bottompipe.png'
    }

    placePipes() {
        console.log('placePices')
        if (instance.gameOver) return

        let randomPipeY = instance.pipeY - instance.pipeHeight / 4 - Math.random() * (instance.pipeHeight / 2)
        let openingSpace = instance.board.height / 4

        instance.topPipe = {
            img: instance.topPipeImage,
            x: instance.pipeX,
            y: randomPipeY,
            width: instance.pipeWidth,
            height: instance.pipeHeight,
            passed: false,
        }

        instance.pipeArray.push(instance.topPipe)

        instance.bottomPipe = {
            img: instance.bottomPipeImage,
            x: instance.pipeX,
            y: randomPipeY + instance.pipeHeight + openingSpace,
            width: instance.pipeWidth,
            height: instance.pipeHeight,
            passed: false,
        }

        instance.pipeArray.push(instance.bottomPipe)
    }

    setPhysics() {
        instance.velocityX = -2 //pipes moving left speed
        instance.velocityY = 0 //bird jump speed
        instance.gravity = 0.4
    }

    detectCollision(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
    }

    update() {
        requestAnimationFrame(instance.update)

        if (instance.gameOver) return

        instance.context.clearRect(0, 0, instance.board.width, instance.board.height)

        // Bird
        instance.velocityY += instance.gravity
        instance.bird.y = Math.max(instance.bird.y + instance.velocityY, 0) // appply gravity to current bird Y, limit the bird Y to the top of canvas
        instance.context.drawImage(instance.birdImage, instance.bird.x, instance.bird.y, instance.bird.width, instance.bird.height)

        if (instance.bird.y > instance.board.height) {
            instance.gameOver = true
        }

        // Pipes
        for (let i = 0; i < instance.pipeArray.length; i++) {
            let pipe = instance.pipeArray[i]

            pipe.x += instance.velocityX
            instance.context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height)

            if (!pipe.passed && instance.bird.x > pipe.x + pipe.width) {
                instance.score += 0.5 // 0.5 beacuse there are 2 pipes - 1 for each set of pipes
                pipe.passed = true
            }

            if (instance.detectCollision(instance.bird, pipe)) {
                instance.gameOver = true
            }
        }

        // Clear pipes outside of the screen for memory leak
        while (instance.pipeArray.length > 0 && instance.pipeArray[0].x < -instance.pipeWidth) {
            instance.pipeArray.shift()
        }

        // Draw the score
        instance.context.textAlign = 'center'
        instance.context.fillStyle = 'white'
        instance.context.font = '48px sans-serif'
        instance.context.fillText(instance.score, instance.boardWidth / 2, 45)

        // Draw the game over
        if (instance.gameOver) {
            instance.context.fillText('Game over', instance.boardWidth / 2, instance.boardHeight / 2)

            instance.context.font = '16px sans-serif'
            instance.context.fillText('Press space to start again', instance.boardWidth / 2, instance.boardHeight / 2 + 40)
        }
    }

    destroy() {
        document.querySelector('#flappyBird')?.remove()
        document.removeEventListener('keydown', instance.moveBird)

        clearInterval(instance.pipesInterval)
    }
}
