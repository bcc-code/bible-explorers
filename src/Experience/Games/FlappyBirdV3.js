class Player {
    constructor(canvas) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.width = 32
        this.height = 24
        this.x = 50
        this.y = canvas.height / 2
        this.velocityY = 0
        this.gravity = 0.4
        this.jumpStrength = -6
        // You should load the image of the player bird here
        // this.image = new Image();
        // this.image.src = 'path/to/playerImage.png';
    }

    draw() {
        // Draw the bird
        this.ctx.fillStyle = 'yellow' // Change color or use image
        this.ctx.fillRect(this.x, this.y, this.width, this.height)
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
        // Check if the mouse click is within any menu option
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

    startGame() {
        // Implement game start logic here
        console.log('Game started!')

        // Create player instance
        this.player = new Player(this.canvas)
        // Redraw the canvas with the player
        this.drawBackground()
        this.drawPlayer()
    }

    drawPlayer() {
        // Draw the player
        this.player.draw()
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
