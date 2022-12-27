import Konva from 'konva'
import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class HeartDefense {

    constructor() {
        instance = this

        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.debug = instance.experience.debug

        const spriteW = 180
        const spriteH = 100

        instance.config = {
            maxThoughts: 8,
            levels: 6,
            maxLives: 3,
            path: 'games/heart-defense/',
            heartStates: ['empty', 'half', 'full'],
            doorStates: ['open', 'closed'],
            explosionWidth: spriteW,
            explosionHeight: spriteH,
            explosion: 'games/explosion.png',
            animations: {
                explosion: [
                    0, 0, spriteW, spriteH,
                    spriteW * 2, 0, spriteW, spriteH,
                    spriteW * 3, 0, spriteW, spriteH,
                ]
            },
            highestSpeed: 1.6,
            lowestSpeed: 0.6,
            probability: 0.02,
            badThoughtsVariants: 4,
            goodThoughtsVariants: 3,
            pointsToCompleteLevel: 2,
            showSkipAfterNoOfTries: 3,
            heart: {
                width: 350,
                height: 350
            },
            thoughts: {
                width: 75,
                height: 75
            }
        }
    }

    toggleGame() {
        instance.audio = instance.world.audio
        instance.program = instance.world.program

        instance.stats = {
            lives: 3,
            points: 0,
            heartClosed: true,
            level: 1,
            fails: 0
        }

        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        } else {
            const wrapper = document.createElement('div')
            wrapper.classList.add('heart-defense_wrapper')

            const canvas = document.createElement('div')
            canvas.setAttribute('id', 'heart-defense_canvas')

            const title = document.createElement('h3')
            title.className = 'modal__heading--minigame'
            title.innerText = 'Heart Defense'

            wrapper.append(canvas)

            instance.modal = new Modal(wrapper.outerHTML, 'heart-defense')
            instance.modal.htmlEl.prepend(title)
            instance.modal.htmlEl.querySelector('.modal__close').style.display = 'none'
            instance.startGame()
        }
    }

    startGame() {
        instance.stats.heartClosed = true
        instance.stats.points = 0
        instance.thoughts = []

        instance.drawCanvas()
        instance.drawHeart()
        instance.drawDoor()
        instance.drawLives()
        instance.setUpAnimation()
        instance.setEventListeners()

        instance.gameIsOn = true
        instance.animation.start()
    }

    drawCanvas() {
        instance.stage = new Konva.Stage({
            container: '#heart-defense_canvas',
            width: window.innerWidth,
            height: window.innerHeight
        })

        instance.layer = new Konva.Layer()
        instance.stage.add(instance.layer)

        instance.center = {
            x: instance.stage.width() / 2,
            y: instance.stage.height() / 2
        }
    }

    drawHeart() {
        instance.heartImage = new Image()
        instance.heartImage.onload = () => {
            if (instance.layer.find('#heart').length) return

            instance.layer.add(new Konva.Image({
                id: 'heart',
                image: instance.heartImage,
                x: instance.center.x,
                y: instance.center.y,
                width: instance.config.heart.width,
                height: instance.config.heart.height,
                offset: {
                    x: instance.config.heart.width / 2,
                    y: instance.config.heart.height / 2
                }
            }))
            instance.layer.findOne('#heart').zIndex(0)

        }
        instance.heartImage.src = instance.config.path + 'heart-' + instance.config.heartStates[instance.stats.points] + '.jpg'
    }

    drawDoor() {
        instance.doorImage = new Image()
        instance.doorImage.onload = () => {
            if (instance.layer.find('#door').length) return

            instance.layer.add(new Konva.Image({
                id: 'door',
                image: instance.doorImage,
                x: instance.center.x,
                y: instance.center.y,
                width: 75,
                height: 150,
                offset: {
                    x: 37.5,
                    y: 75
                }
            }))
            instance.layer.findOne('#door').zIndex(1)
        }
        instance.doorImage.src = instance.config.path + 'door-' + instance.config.doorStates[+instance.stats.heartClosed] + '.jpg'
    }

    drawLives() {
        const padding = 20, iconWidth = 32
        const livesGroup = new Konva.Group({
            id: "lives",
            x: instance.stage.width() - padding - iconWidth * instance.config.maxLives,
            y: padding
        })
        instance.layer.add(livesGroup)

        for (let i=0; i<instance.stats.lives; i++) {
            const lifeImage = new Image()
            lifeImage.onload = () => {
                const life = new Konva.Image({
                    id: 'life'+i,
                    image: lifeImage,
                    x: iconWidth * i,
                    width: iconWidth,
                    height: 32
                })
                instance.layer.findOne('#lives').add(life)
            }
            lifeImage.src = instance.config.path + 'life.jpg'
        }
    }

    setUpAnimation() {
        const thoughtsGroup = new Konva.Group({ id: "thoughts" })
        thoughtsGroup.zIndex(10)
        instance.layer.add(thoughtsGroup)

        instance.animation = new Konva.Animation(frames => {
            if (instance.thoughts.length < instance.config.maxThoughts)
                createThought()

            animateThoughts()
        })

        instance.explosionSprite = setSprite(instance.config.explosion, 'explosion')
        instance.layer.add(instance.explosionSprite)

        function createThought() {
            if (Math.random() < instance.config.probability) {
                const position = instance.getRndPosition()
                const x = position.x
                const y = position.y
                const dX = instance.center.x - x
                const dY = instance.center.y - y
                const norm = Math.sqrt(dX ** 2 + dY ** 2)
                const speed = instance.getRndSpeed()

                // 3/4 thoughts are bad
                const badThought = Math.random() < 0.75

                const thoughtImage = new Image()
                thoughtImage.onload = () => {
                    const thought = new Konva.Image({
                        name: 'thought',
                        image: thoughtImage,
                        x: x,
                        y: y,
                        width: instance.config.thoughts.width,
                        height: instance.config.thoughts.height,
                        offset: {
                            x: instance.config.thoughts.width / 2,
                            y: instance.config.thoughts.height / 2
                        }
                    })

                    instance.layer.findOne('#thoughts').add(thought)
                    instance.thoughts.push({
                        item: thought,
                        speedX: dX / norm * speed,
                        speedY: dY / norm * speed,
                        badThought: badThought
                    })
                }
                thoughtImage.src = badThought ? instance.getRndBadThoughtSrc() : instance.getRndGoodThoughtSrc()
            }
        }

        function animateThoughts() {
            instance.thoughts.forEach((thought, index) => {
                // Update thought position
                thought.item.position({
                    x: thought.item.x() + thought.speedX,
                    y: thought.item.y() + thought.speedY
                })

                if (instance.isIntersectingRectangleWithRectangle(thought.item.position(), 10, 10, instance.center, 10, 10)) {
                    thought.item.destroy()
                    instance.thoughts.splice(index, 1)

                    if (!instance.stats.heartClosed) {
                        if (thought.badThought) {
                            --instance.stats.lives
                                ? instance.toggleLifeLost()
                                : instance.toggleGameOver()
                        }
                        else {
                            instance.audio.playCorrectSound()
                            instance.stats.points++
                            instance.updateHeartStatus()

                            if (instance.stats.points == instance.config.pointsToCompleteLevel)
                                instance.toggleLevelCompleted()
                        }
                    }
                    else {
                        instance.audio.playWrongSound()
                        playAnimation(thought.item, instance.explosionSprite)
                    }
                }
            })
        }

        function setSprite(src, animation) {
            const image = new Image()
            image.src = src
    
            return new Konva.Sprite({
                id: animation,
                x: 0,
                y: 0,
                width: instance.config.explosionWidth,
                height: instance.config.explosionHeight,
                image: image,
                animation: animation,
                animations: instance.config.animations,
                frameRate: 3,
                frameIndex: 0,
                visible: false,
                offset: {
                    x: instance.config.explosionWidth / 2,
                    y: instance.config.explosionHeight / 2
                }
            })
        }

        function playAnimation(obj, spriteObj) {
            spriteObj.position(instance.center)
            const animation = spriteObj
    
            if (animation.isRunning()) {
                animation.stop()
                animation.frameIndex(0)
            }
    
            animation.visible(true)
            animation.start()
    
            animation.on('frameIndexChange.konva', function () {
                if (this.frameIndex() == 2) {
                    animation.stop()
                    animation.visible(false)
                }
            })
        }
    }

    // Helpers

    getRndPosition = () => instance.possiblePositions()[instance.getRoundedRndBetween(0, 3)]
    possiblePositions = () => [
        {
            x: -instance.config.thoughts.width,
            y: instance.getRndBetween(-instance.config.thoughts.height/2, instance.stage.height() + instance.config.thoughts.height/2)
        },
        {
            x: instance.getRndBetween(0, instance.stage.width() - instance.config.thoughts.width/2),
            y: -instance.config.thoughts.height/2
        },
        {
            x: instance.stage.width() + instance.config.thoughts.width/2,
            y: instance.getRndBetween(-instance.config.thoughts.height/2, instance.stage.height() + instance.config.thoughts.height/2)
        },
        {
            x: instance.getRndBetween(0, instance.stage.width() - instance.config.thoughts.width/2),
            y: instance.stage.height() + instance.config.thoughts.height/2
        }
    ]

    getRndSpeed = () => instance.getRndBetween(instance.config.lowestSpeed, instance.config.highestSpeed) * instance.stats.level
    getRndBadThoughtSrc = () => instance.config.path + 'bad-thought' + instance.getRoundedRndBetween(1, instance.config.badThoughtsVariants) + '.jpg'
    getRndGoodThoughtSrc = () => instance.config.path + 'good-thought' + instance.getRoundedRndBetween(1, instance.config.goodThoughtsVariants) + '.jpg'
    getDoorSrc = () => instance.config.path + 'door-' + instance.config.doorStates[+instance.stats.heartClosed] + '.jpg'
    getRndBetween = (min, max) => min + Math.random() * (max - min)
    getRoundedRndBetween = (min, max) => Math.round(instance.getRndBetween(min, max))

    isIntersectingRectangleWithRectangle = (rect1, width1, height1, rect2, width2, height2) => {
        return rect2.x < rect1.x + width1 && rect2.x + width2 > rect1.x && rect2.y < rect1.y + height1 && rect2.y + height2 > rect1.y
    }

    setEventListeners() {
        document.addEventListener('keydown', instance.keyDownHandler)
    }

    keyDownHandler(e) {
        if (!instance.gameIsOn) return

        if (e.keyCode == 32) {
            instance.stats.heartClosed = !instance.stats.heartClosed
            instance.doorImage.src = instance.getDoorSrc()
        }

        if (e.keyCode == 27) {
            instance.animation.isRunning()
                ? instance.animation.stop()
                : instance.animation.start()
        }
    }

    toggleLifeLost() {
        instance.layer.findOne('#life'+instance.stats.lives).destroy()
    }

    updateHeartStatus() {
        instance.heartImage.src = instance.config.path + 'heart-' + instance.config.heartStates[instance.stats.points] + '.jpg'
    }

    toggleLevelCompleted() {
        instance.gameIsOn = false
        instance.stats.level++
        instance.stats.points = 0
        instance.animation.stop()

        let html = `<div class="modal__content congrats congrats__miniGame heart-defense">
            <div class="congrats__container">
                <div class="congrats__title">
                    <h2>${_s.miniGames.levelUp}</h2>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html, 'modal__congrats')

        // Add event listeners

        const modal = document.querySelector('.modal__congrats')

        const next = modal.querySelector('#continue')
        next.style.display = 'block'

        if (instance.stats.level <= instance.config.levels) {
            // Next level
            next.innerText = _s.miniGames.nextRound
            next.addEventListener('click', () => {
                instance.destroy()
                instance.startGame()
            })
        }
        else {
            // All levels completed
            next.innerText = _s.miniGames.continue
            next.addEventListener('click', () => {
                instance.destroy()
                instance.toggleGame()
                instance.program.nextStep()
            })
        }

        const skip = modal.querySelector("#skip")
        skip.innerText = _s.miniGames.skip
        skip.style.display = instance.debug.developer || instance.debug.onQuickLook() || instance.stats.fails >= instance.config.showSkipAfterNoOfTries
            ? 'block'
            : 'none'
        skip.addEventListener('click', () => {
            instance.destroy()
            instance.toggleGame()
            instance.program.nextStep()
        })
    }

    toggleGameOver() {
        instance.animation.stop()
        instance.gameIsOn = false
        instance.stats.fails++
        instance.stats.lives = instance.config.maxLives

        let html = `<div class="modal__content congrats congrats__miniGame heart-defense">
            <div class="congrats__container">
                <div class="congrats__title">
                    <h2>${_s.miniGames.gameOver}</h2>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html, 'modal__congrats')

        // Add event listeners

        const modal = document.querySelector('.modal__congrats')

        const restart = modal.querySelector('#restart')
        restart.style.display = 'block' 
        restart.innerText = _s.miniGames.reset
        restart.addEventListener('click', () => {
            instance.destroy()
            instance.startGame()
        })

        const skip = modal.querySelector("#skip")
        skip.innerText = _s.miniGames.skip
        skip.style.display = instance.debug.developer || instance.debug.onQuickLook() || instance.stats.fails >= instance.config.showSkipAfterNoOfTries
            ? 'block'
            : 'none'

        skip.addEventListener('click', instance.program.nextStep)
    }

    destroy() {
        instance.modal.destroy()
        instance.layer.destroy()
    }
}