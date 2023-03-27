import Konva from 'konva'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from "../Utils/Events.js"

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
            noOfThoughts: 28,
            levels: 5,
            maxLives: 3,
            path: 'games/heart-defense/',
            heartStates: ['full', '3quarter', 'half', '1quarter', 'empty'],
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
            highestSpeed: 3.2,
            lowestSpeed: 1.2,
            probability: 0.02,
            thoughtVariants: 3,
            pointsToCompleteLevel: 4,
            showSkipAfterNoOfTries: 3,
            thoughts: {
                width: 200,
                height: 200
            },
            heart: {},
            door: {}
        }
    }

    toggleGame() {
        instance.audio = instance.world.audio
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()

        instance.stats = {
            lives: 3,
            points: 0,
            heartClosed: true,
            level: 1,
            fails: 0
        }

        instance.thoughtObjs = []
        instance.spriteAnimations = []

        instance.gameHTML()
        instance.startGame()
    }

    gameHTML() {
        const game = _gl.elementFromHtml(`
            <section class="game heart-defense">
                <div class="container">
                    <div class="game-rounds">
                        <span>${_s.miniGames.round}:</span>
                        <span class="level">${instance.stats.level}</span>
                        <span> / ${instance.config.levels}</span>
                    </div>
                    <button class="btn default" aria-label="skip-button" style="display: none">${_s.miniGames.skip}</button>
                </div>
                <div class="overlay"></div>
                <div id="heart-defense" class="game-canvas"></div>
            </section>
        `)

        document.querySelector('.ui-container').append(game)

        const skipBTN = document.querySelector('[aria-label="skip-button"]')
        skipBTN.addEventListener('click', () => {
            instance.stopExplosionAnimation()
            instance.stopThoughtsAnimation()
            instance.destroy()
            instance.program.nextStep()
        })

        if (instance.debug.developer || instance.debug.onPreviewMode() || instance.stats.fails >= instance.config.showSkipAfterNoOfTries)
            skipBTN.style.display = 'block'
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

        document.querySelector('.game-popup')?.remove()
        document.querySelector('.heart-defense')?.classList.remove('popup-visible')

        instance.experience.gameIsOn = true
        instance.animation.start()
        instance.fadeInOverlay.reverse()
    }

    drawCanvas() {
        instance.stage = new Konva.Stage({
            container: 'heart-defense',
            width: window.innerWidth,
            height: window.innerHeight
        })

        instance.layer = new Konva.Layer()
        instance.stage.add(instance.layer)

        instance.overlay = new Konva.Rect({
            width: instance.stage.width(),
            height: instance.stage.height(),
            fill: '#131a43',
            opacity: 0
        })
        instance.layer.add(instance.overlay)

        instance.fadeInOverlay = new Konva.Tween({
            node: instance.overlay,
            duration: 1,
            easing: Konva.Easings.EaseInOut,
            opacity: 0.5
        })

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

        instance.config.heart.width = instance.stage.width() / 3
        instance.config.heart.height = instance.config.heart.width / 1.1933174224

        for (let i = 0; i < instance.config.heartStates.length; i++) {
            const heartImage = new Image()
            heartImage.onload = () => {
                const heart = new Konva.Image({
                    id: 'heart-' + instance.config.heartStates[i],
                    image: heartImage,
                    width: instance.config.heart.width,
                    height: instance.config.heart.height,
                    offset: {
                        x: instance.config.heart.width / 2,
                        y: instance.config.heart.height / 2
                    },
                    visible: i == instance.config.heartStates.length - 1
                })
                instance.layer.findOne('#heart').add(heart)
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
        instance.layer.on('touchstart click', instance.openCloseDoor)
        instance.layer.add(doorGroup)
        instance.layer.findOne('#door').zIndex(1)

        instance.config.door.width = instance.config.heart.width / 5.2
        instance.config.door.height = instance.config.door.width / 0.48

        for (let i = 0; i < instance.config.doorStates.length; i++) {
            const doorImage = new Image()
            doorImage.onload = () => {
                const door = new Konva.Image({
                    id: 'door-' + instance.config.doorStates[i],
                    image: doorImage,
                    width: instance.config.door.width,
                    height: instance.config.door.height,
                    offset: {
                        x: instance.config.door.width / 2,
                        y: instance.config.door.height / 2
                    },
                    visible: i == 1
                })
                instance.layer.findOne('#door').add(door)
            }
            doorImage.src = instance.config.path + 'door-' + instance.config.doorStates[i] + '.png'
        }
    }

    drawLives() {
        const padding = 31.5, iconWidth = 40, iconHeight = 33, spaceBetween = 5
        const livesGroup = new Konva.Group({
            id: "lives",
            x: padding,
            y: padding
        })
        instance.layer.add(livesGroup)
        instance.layer.findOne('#lives').zIndex(2)

        for (let i = 0; i < instance.config.maxLives; i++) {
            const lostLife = new Image()
            lostLife.onload = () => {
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

        function createThought() {
            if (Math.random() > instance.config.probability) return

            // 6/10 thoughts are bad
            const badThought = Math.random() < 0.6

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
                    remainingFramesToCenter: estFramesToCenter,
                    active: true,
                    rotateDirection: Math.random() < 0.5 ? -1 : 1
                })
            }
            thoughtImage.src = badThought ? instance.getRndBadThoughtSrc() : instance.getRndGoodThoughtSrc()
        }

        function animateThoughts() {
            instance.thoughts.forEach((thought, index) => {
                thought.remainingFramesToCenter--

                if (!thought.active) return

                // Move thought towards the center
                thought.item.move({
                    x: thought.speedX,
                    y: thought.speedY
                })
                // Rotate thought
                thought.item.rotate(thought.rotateDirection / 10)

                if (!instance.isIntersectingRectangleWithRectangle(
                    { x: thought.item.position().x - 5, y: thought.item.position().y - 5 },
                    10, 10,
                    { x: instance.center.x - instance.config.door.width / 4, y: instance.center.y - instance.config.door.height / 4 },
                    instance.config.door.width / 2, instance.config.door.height / 2)
                )
                    return

                // Thought reached the heart

                // Stop the thought from moving
                thought.active = false

                // The heart is open
                if (!instance.stats.heartClosed) {
                    thought.item.destroy()

                    if (thought.badThought) {
                        instance.stats.lives--
                        instance.updateLivesStatus()
                        instance.audio.playSound('heart-defense/lose-life')

                        if (instance.stats.lives == 0) {
                            instance.stopThoughtsAnimation()
                            setTimeout(() => { instance.toggleGameOver() }, 500)
                        }
                    }
                    else {
                        instance.audio.playSound('correct')
                        instance.updateHeartStatus()
                        instance.stats.points++

                        if (instance.stats.points == instance.config.pointsToCompleteLevel) {
                            instance.stopThoughtsAnimation()
                            setTimeout(() => { instance.toggleLevelCompleted() }, 500)
                        }
                    }
                }
                else {
                    instance.audio.playSound('heart-defense/door-crash')
                    instance.playExplosionAnimation(thought.item)
                }

                // Remove the thought from the thoughts array
                instance.thoughts.splice(index, 1)
            })
        }

        function getUpdatedFramesToCenterValue(min, padding) {
            const framesToCenterArr = instance.thoughts
                .map(thought => thought.remainingFramesToCenter)
                .sort(function (a, b) { return a - b })

            // No update
            if (framesToCenterArr.length === 0)
                return min

            // Value is already the closest to center
            if (min + padding < framesToCenterArr[0])
                return min

            // Find value inside array
            for (let i = 1; i < framesToCenterArr.length; i++) {
                if (framesToCenterArr[i] < min + padding) continue

                if (intervalsIntersect(framesToCenterArr[i - 1], min, padding)) {
                    min = framesToCenterArr[i - 1] + padding
                }
                else if (intervalsIntersect(framesToCenterArr[i], min, padding)) {
                    min = framesToCenterArr[i] + padding
                }
                else {
                    return min
                }
            }

            // Value is the farthest from the center
            const highestValue = framesToCenterArr[framesToCenterArr.length - 1]
            return min - padding > highestValue ? min : highestValue + padding
        }

        function intervalsIntersect(a, b, padding) {
            const a_start = a - padding / 2, a_end = a + padding / 2
            const b_start = b - padding / 2, b_end = b + padding / 2

            return a_start < b_end && b_start < a_end
        }
    }

    setSprite(src, animation) {
        const image = new Image()
        image.src = src

        return new Konva.Sprite({
            name: animation,
            x: 0,
            y: 0,
            width: instance.config.explosionWidth,
            height: instance.config.explosionHeight,
            image: image,
            animation: animation,
            animations: instance.config.animations,
            frameRate: 3,
            frameIndex: 0,
            visible: true,
            offset: {
                x: instance.config.explosionWidth / 2,
                y: instance.config.explosionHeight / 2
            }
        })
    }

    playExplosionAnimation(obj) {
        const spriteObj = instance.setSprite(instance.config.explosion, 'explosion')
        instance.layer.add(spriteObj)

        spriteObj.position(obj.position())
        spriteObj.start()

        instance.thoughtObjs.push(obj)
        instance.spriteAnimations.push(spriteObj)

        spriteObj.on('frameIndexChange.konva', function () {
            if (this.frameIndex() == 2) {
                spriteObj.stop()
                obj.destroy()
                instance.layer.find('.explosion')[0].destroy()
                instance.spriteAnimations.shift()
                instance.thoughtObjs.shift()
            }
        })
    }

    stopExplosionAnimation() {
        instance.spriteAnimations.forEach((animation) => animation.stop())
        instance.spriteAnimations = []

        instance.thoughtObjs.forEach((obj) => obj.destroy())
        instance.thoughtObjs = []

        instance.layer.find('.explosion').forEach((explosion) => explosion.destroy())
    }

    stopThoughtsAnimation() {
        instance.animation.stop()
        instance.fadeInOverlay.play()
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
    getRndBadThoughtSrc = () => instance.config.path + 'bad-thought-' + instance.getRoundedRndBetween(1, instance.config.thoughtVariants) + '.png'
    getRndGoodThoughtSrc = () => instance.config.path + 'good-thought-' + instance.getRoundedRndBetween(1, instance.config.thoughtVariants) + '.png'
    getRndBetween = (min, max) => min + Math.random() * (max - min)
    getRoundedRndBetween = (min, max) => Math.round(instance.getRndBetween(min, max))

    isIntersectingRectangleWithRectangle = (rect1, width1, height1, rect2, width2, height2) => {
        return rect2.x < rect1.x + width1 && rect2.x + width2 > rect1.x && rect2.y < rect1.y + height1 && rect2.y + height2 > rect1.y
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
        document.addEventListener('keydown', instance.keyDownHandler)
        window.addEventListener("resize", instance.updateStageDimension)
    }

    keyDownHandler(e) {
        if (e.keyCode == 32)
            instance.openCloseDoor()
    }

    openCloseDoor() {
        instance.stats.heartClosed = !instance.stats.heartClosed
        instance.updateDoorStatus()

        if (!instance.stats.heartClosed)
            instance.stopExplosionAnimation()

        const sound = instance.stats.heartClosed ? 'close' : 'open'
        instance.audio.playSound('heart-defense/door-' + sound)
    }

    updateStageDimension() {
        instance.stage.width(window.innerWidth)
        instance.stage.height(window.innerHeight)
    }

    updateRoundsStatus() {
        document.querySelector('.game-rounds .level').innerText = instance.stats.level
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
        instance.layer.findOne('#heart-' + instance.config.heartStates[index - 1]).show()
    }

    toggleLevelCompleted() {
        const congratsHTML = _gl.elementFromHtml(`
            <div class="game-popup">
                <h1>${_s.miniGames.completed.title}</h1>
                <p>${_s.miniGames.round} ${instance.stats.level} ${_s.miniGames.completed.string}!</p>
                <div class="buttons"></div>
            </div>
        `)

        const nextLevelBTN = _gl.elementFromHtml(`
            <button class="btn default next pulsate">${_s.miniGames.nextRound}</button>
        `)

        congratsHTML.querySelector('.buttons').append(nextLevelBTN)

        document.querySelector('.heart-defense .container').append(congratsHTML)
        document.querySelector('.heart-defense').classList.add('popup-visible')

        instance.stats.level++
        instance.stats.points = 0

        document.removeEventListener('keydown', instance.keyDownHandler)

        // Add event listeners
        if (instance.stats.level <= instance.config.levels) {
            // Next level
            nextLevelBTN.addEventListener('click', () => {
                instance.newLevel()
                instance.startGame()
                instance.updateRoundsStatus()
            })
        }
        else {
            // All levels completed
            nextLevelBTN.innerText = _s.miniGames.anotherRound
            nextLevelBTN.addEventListener('click', () => {
                instance.resetGame()
                instance.startGame()
            })

            instance.experience.navigation.prev.disabled = true
            document.querySelector('.cta').style.display = 'flex'
            document.querySelector('.game-rounds')?.remove()
        }

        instance.audio.playSound('task-completed')
        instance.experience.celebrate({
            particleCount: 100,
            spread: 160
        })

    }

    toggleGameOver() {
        const gameOverHTML = _gl.elementFromHtml(`
            <div class="game-popup">
                <h1>${_s.miniGames.gameOver}</h1>
                <div class="buttons"></div>
            </div>
        `)

        const resetBTN = _gl.elementFromHtml(`
            <button class="btn default">${_s.miniGames.restartRound}</button>
        `)
        gameOverHTML.querySelector('.buttons').append(resetBTN)

        document.querySelector('.heart-defense .container').append(gameOverHTML)
        document.querySelector('.heart-defense').classList.add('popup-visible')

        if (++instance.stats.fails == 3)
            document.querySelector('[aria-label="skip-button"]').style.display = 'block'

        instance.stats.lives = instance.config.maxLives

        document.removeEventListener('keydown', instance.keyDownHandler)

        // Add event listeners
        resetBTN.addEventListener('click', () => {
            instance.newLevel()
            instance.startGame()
        })
    }

    resetGame() {
        document.removeEventListener('keydown', instance.keyDownHandler)
        window.removeEventListener('resize', instance.updateStageDimension)

        instance.layer.destroy()
        instance.experience.gameIsOn = false
    }

    newLevel() {
        document.removeEventListener('keydown', instance.keyDownHandler)
        window.removeEventListener('resize', instance.updateStageDimension)

        instance.layer.destroy()
        instance.experience.gameIsOn = false
    }

    destroy() {
        document.removeEventListener('keydown', instance.keyDownHandler)
        window.removeEventListener('resize', instance.updateStageDimension)

        document.querySelector('.game')?.remove()
        document.querySelector('.cta').style.display = 'flex'

        instance.layer?.destroy()
        instance.experience.gameIsOn = false

    }
}