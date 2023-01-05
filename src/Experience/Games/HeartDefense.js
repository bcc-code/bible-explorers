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
            noOfThoughts: 8,
            levels: 6,
            maxLives: 3,
            path: 'games/heart-defense/',
            heartStates: ['full', 'half', 'empty'],
            doorStates: ['open', 'closed'],
            livesStates: ['active', 'lost'],
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
            thoughtVariants: 3,
            pointsToCompleteLevel: 2,
            showSkipAfterNoOfTries: 3,
            thoughts: {
                width: 85,
                height: 83
            }
        }
    }

    toggleGame() {
        instance.audio = instance.world.audio
        instance.program = instance.world.program
        instance.currentStepData = instance.program.getCurrentStepData()

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
            instance.modalHtml()
            instance.startGame()
        }
    }

    modalHtml() {
        const wrapper = document.createElement('div')
        wrapper.classList.add('heart-defense_wrapper')

        const canvas = document.createElement('div')
        canvas.setAttribute('id', 'heart-defense_canvas')

        const gameRounds = document.createElement('div')
        gameRounds.setAttribute('id', 'heart-defense_rounds')
        gameRounds.innerHTML =
            `<p>${_s.miniGames.round}:</p>
            <span class="level">${instance.stats.level}</span>
            <span>${instance.config.levels}</span>`

        wrapper.append(canvas, gameRounds)

        instance.modal = new Modal(wrapper.outerHTML, 'heart-defense')

        const title = document.querySelector('.modal__heading--minigame')
        title.innerHTML = `<h3>${instance.currentStepData.details.title}</h3>
            <p>${instance.currentStepData.details.prompts[0].prompt}</p>`

        const close = document.querySelector('.modal__close')
        close.style.display = 'none'
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

        instance.experience.gameIsOn = true
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
        const heartGroup = new Konva.Group({
            id: "heart",
            x: instance.center.x,
            y: instance.center.y
        })
        instance.layer.add(heartGroup)
        instance.layer.findOne('#heart').zIndex(0)

        for (let i = 0; i < instance.config.heartStates.length; i++) {
            const heartImage = new Image()
            heartImage.onload = () => {
                const heart = new Konva.Image({
                    id: 'heart-' + instance.config.heartStates[i],
                    image: heartImage,
                    width: 450,
                    height: 377,
                    offset: {
                        x: 450 / 2,
                        y: 377 / 2
                    }
                })
                instance.layer.findOne('#heart').add(heart)
                instance.layer.findOne('#heart-' + instance.config.heartStates[i]).zIndex(i)
            }
            heartImage.src = instance.config.path + 'heart-' + instance.config.heartStates[i] + '.png'
        }
    }

    drawDoor() {
        const doorGroup = new Konva.Group({
            id: "door",
            x: instance.center.x,
            y: instance.center.y
        })
        instance.layer.add(doorGroup)
        instance.layer.findOne('#door').zIndex(1)

        for (let i = 0; i < instance.config.doorStates.length; i++) {
            const doorImage = new Image()
            doorImage.onload = () => {
                const door = new Konva.Image({
                    id: 'door-' + instance.config.doorStates[i],
                    image: doorImage,
                    width: 75,
                    height: 157,
                    offset: {
                        x: 75 / 2,
                        y: 157 / 2
                    },
                    visible: i == 1
                })
                instance.layer.findOne('#door').add(door)
                instance.layer.findOne('#door-' + instance.config.doorStates[i]).zIndex(i)
            }
            doorImage.src = instance.config.path + 'door-' + instance.config.doorStates[i] + '.png'
        }
    }

    drawLives() {
        const padding = 50, iconWidth = 40, iconHeight = 33, spaceBetween = 5
        const livesGroup = new Konva.Group({
            id: "lives",
            x: instance.stage.width() - padding - iconWidth * instance.config.maxLives - spaceBetween * instance.config.maxLives,
            y: padding
        })
        instance.layer.add(livesGroup)
        instance.layer.findOne('#lives').zIndex(2)

        for (let i = 0; i < instance.config.maxLives; i++) {
            const lostLife = new Image()
            lostLife.onload = function () {
                const life = new Konva.Image({
                    id: 'life-' + instance.config.livesStates[1] + i,
                    image: lostLife,
                    x: iconWidth * i + spaceBetween * i,
                    width: iconWidth,
                    height: iconHeight,
                    visible: instance.stats.lives <= i
                })
                instance.layer.findOne('#lives').add(life)
            }
            lostLife.src = instance.config.path + 'life-' + instance.config.livesStates[1] + '.png'

            const activeLife = new Image()
            activeLife.onload = () => {
                const life = new Konva.Image({
                    id: 'life-' + instance.config.livesStates[0] + i,
                    image: activeLife,
                    x: iconWidth * i + spaceBetween * i,
                    width: iconWidth,
                    height: iconHeight,
                    visible: instance.stats.lives > i
                })
                instance.layer.findOne('#lives').add(life)
            }
            activeLife.src = instance.config.path + 'life-' + instance.config.livesStates[0] + '.png'
        }
    }

    setUpAnimation() {
        const thoughtsGroup = new Konva.Group({ id: "thoughts" })
        instance.layer.add(thoughtsGroup)
        instance.layer.findOne('#thoughts').zIndex(3)

        instance.animation = new Konva.Animation(frame => {
            if (instance.thoughts.length < instance.getNoOfThoughts())
                createThought()

            animateThoughts()
        })

        instance.explosionSprite = setSprite(instance.config.explosion, 'explosion')
        instance.layer.add(instance.explosionSprite)

        function createThought() {
            if (Math.random() > instance.config.probability) return

            // 8/10 thoughts are bad
            const badThought = Math.random() < 0.8

            const thoughtImage = new Image()
            thoughtImage.onload = () => {
                const framesBetweenEachThought = 75
                const position = instance.getRndPosition()
                let x = position.x
                let y = position.y
                let dX = instance.center.x - x
                let dY = instance.center.y - y
                let norm = Math.sqrt(dX ** 2 + dY ** 2)
                const speed = instance.getRndSpeed()
                const distancePerFrame = {
                    x: dX / norm * speed,
                    y: dY / norm * speed
                }
                let estFramesToCenter = dX / distancePerFrame.x

                // Adjust distance if necessary
                const diffFrames = getUpdatedFramesToCenterValue(estFramesToCenter, framesBetweenEachThought) - estFramesToCenter

                // Updated values
                x -= diffFrames * distancePerFrame.x
                y -= diffFrames * distancePerFrame.y
                dX = instance.center.x - x
                dY = instance.center.y - y
                estFramesToCenter = dX / distancePerFrame.x

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
                    speedX: distancePerFrame.x,
                    speedY: distancePerFrame.y,
                    badThought: badThought,
                    remainingFramesToCenter: estFramesToCenter
                })
            }
            thoughtImage.src = badThought ? instance.getRndBadThoughtSrc() : instance.getRndGoodThoughtSrc()
        }

        function animateThoughts() {
            instance.thoughts.forEach((thought, index) => {
                // Move thought towards the center
                thought.item.move({
                    x: thought.speedX,
                    y: thought.speedY
                })
                thought.remainingFramesToCenter--

                if (!instance.isIntersectingRectangleWithRectangle(thought.item.position(), 10, 10, instance.center, 10, 10))
                    return

                thought.item.destroy()
                instance.thoughts.splice(index, 1)

                if (!instance.stats.heartClosed) {
                    if (thought.badThought) {
                        instance.stats.lives--
                        instance.updateLivesStatus()

                        if (instance.stats.lives == 0) {
                            instance.animation.stop()
                            setTimeout(() => { instance.toggleGameOver() }, 500)
                        }
                    }
                    else {
                        instance.audio.playCorrectSound()
                        instance.updateHeartStatus()
                        instance.stats.points++

                        if (instance.stats.points == instance.config.pointsToCompleteLevel) {
                            instance.animation.stop()
                            setTimeout(() => { instance.toggleLevelCompleted() }, 500)
                        }
                    }
                }
                else {
                    instance.audio.playWrongSound()
                    playAnimation(thought.item, instance.explosionSprite)
                }
            })
        }

        function getUpdatedFramesToCenterValue(min, padding) {
            const framesToCenterArr = instance.thoughts
                .map(thought => thought.remainingFramesToCenter)
                .sort(function(a, b) { return a-b })

            // No update
            if (framesToCenterArr.length === 0)
                return min

            // Value is already the closest to center
            if (min + padding < framesToCenterArr[0])
                return min

            // Find value inside array
            for (let i=1; i < framesToCenterArr.length; i++) {
                if (framesToCenterArr[i] < min + padding) continue
            
                if (intervalsIntersect(framesToCenterArr[i-1], min, padding)) {
                    min = framesToCenterArr[i-1] + padding
                }
                else if (intervalsIntersect(framesToCenterArr[i], min, padding)) {
                    min = framesToCenterArr[i] + padding
                }
                else {
                    return min
                }
            }

            // Value is the farthest from the center
            const highestValue = framesToCenterArr[framesToCenterArr.length-1]
            return min - padding > highestValue ? min : highestValue + padding
        }

        function intervalsIntersect(a, b, padding) {
            const a_start = a-padding/2, a_end = a+padding/2
            const b_start = b-padding/2, b_end = b+padding/2
            
            return a_start < b_end && b_start < a_end
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
            x: -instance.config.thoughts.width / 2,
            y: instance.getRndBetween(-instance.config.thoughts.height / 2, instance.stage.height() + instance.config.thoughts.height / 2)
        },
        {
            x: instance.getRndBetween(0, instance.stage.width() - instance.config.thoughts.width / 2),
            y: -instance.config.thoughts.height / 2
        },
        {
            x: instance.stage.width() + instance.config.thoughts.width / 2,
            y: instance.getRndBetween(-instance.config.thoughts.height / 2, instance.stage.height() + instance.config.thoughts.height / 2)
        },
        {
            x: instance.getRndBetween(0, instance.stage.width() - instance.config.thoughts.width / 2),
            y: instance.stage.height() + instance.config.thoughts.height / 2
        }
    ]

    getNoOfThoughts = () => instance.config.noOfThoughts * Math.min(instance.stats.level, instance.config.levels)
    getRndSpeed = () => instance.getRndBetween(instance.config.lowestSpeed, instance.config.highestSpeed) * Math.min(instance.stats.level, instance.config.levels)
    getRndBadThoughtSrc = () => instance.config.path + 'bad-thought' + instance.getRoundedRndBetween(1, instance.config.thoughtVariants) + '.png'
    getRndGoodThoughtSrc = () => instance.config.path + 'good-thought' + instance.getRoundedRndBetween(1, instance.config.thoughtVariants) + '.png'
    getRndBetween = (min, max) => min + Math.random() * (max - min)
    getRoundedRndBetween = (min, max) => Math.round(instance.getRndBetween(min, max))

    isIntersectingRectangleWithRectangle = (rect1, width1, height1, rect2, width2, height2) => {
        return rect2.x < rect1.x + width1 && rect2.x + width2 > rect1.x && rect2.y < rect1.y + height1 && rect2.y + height2 > rect1.y
    }

    setEventListeners() {
        document.addEventListener('keydown', instance.keyDownHandler)
        window.addEventListener("resize", () => {
            instance.stage.width(window.innerWidth)
            instance.stage.height(window.innerHeight)
        })
    }

    keyDownHandler(e) {
        if (instance.experience.gameIsOn == false) return

        if (e.keyCode == 32) {
            instance.stats.heartClosed = !instance.stats.heartClosed
            instance.updateDoorStatus()
        }
    }

    updateRoundsStatus() {
        document.querySelector('#heart-defense_rounds .level').innerText = instance.stats.level
    }

    updateDoorStatus() {
        instance.layer.findOne('#door-' + instance.config.doorStates[0]).visible(!instance.stats.heartClosed)
        instance.layer.findOne('#door-' + instance.config.doorStates[1]).visible(instance.stats.heartClosed)
    }

    updateLivesStatus() {
        instance.layer.findOne('#life-active' + instance.stats.lives).hide()
        instance.layer.findOne('#life-lost' + instance.stats.lives).show()
    }

    updateHeartStatus() {
        const index = instance.config.pointsToCompleteLevel - instance.stats.points
        instance.layer.findOne('#heart-' + instance.config.heartStates[index]).hide()
    }

    toggleLevelCompleted() {
        let html = `<div class="modal__content congrats congrats__miniGame heart-defense">
            <div class="congrats__container">
                <div class="congrats__title">
                    <i class="icon icon-star-solid"></i>
                    <i class="icon icon-star-solid"></i>
                    <h2>${_s.miniGames.completed.title}</h2>
                    <i class="icon icon-star-solid"></i>
                    <i class="icon icon-star-solid"></i>
                </div>
                <div class="congrats__chapter-completed">${_s.miniGames.level} ${instance.stats.level} ${_s.miniGames.completed.string}!</div>
            </div>
        </div>`

        instance.stats.level++
        instance.stats.points = 0

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
                instance.updateRoundsStatus()
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

            const anotherRound = modal.querySelector('#restart')
            anotherRound.style.display = 'block'
            anotherRound.innerText = _s.miniGames.anotherRound
            anotherRound.addEventListener('click', () => {
                instance.destroy()
                instance.startGame()
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
        let html = `<div class="modal__content congrats congrats__miniGame heart-defense">
            <div class="congrats__container">
                <div class="congrats__title">
                    <h2>${_s.miniGames.gameOver}</h2>
                </div>
            </div>
        </div>`

        instance.stats.fails++
        instance.stats.lives = instance.config.maxLives
        instance.stats.level = 1

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
        instance.experience.gameIsOn = false
    }
}