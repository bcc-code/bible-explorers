import Experience from '../Experience.js'
import Konva from 'konva'
import _s from '../Utils/Strings.js'
import _e from '../Utils/Events.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class SortingGame {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.offline = this.world.offline
        this.audio = this.world.audio
        this.sizes = this.experience.sizes
        this.debug = this.experience.debug

        instance = this
    }

    toggleSortingGame() {
        this.generateHTML()
        this.setEventListeners()
        this.initCanvas()
        this.initCanvasLayers()

        instance.resize()
        window.addEventListener('resize', instance.resize)

    }

    generateHTML() {
        instance.program = instance.world.program
        instance.currentStepData = instance.program.getCurrentStepData()

        const game = _gl.elementFromHtml(`
            <div class="game sort-game">
                <div class="container">
                    <button class="btn default" aria-label="skip-button" style="display: none">${_s.miniGames.skip}</button>
                </div>
                <div class="overlay"></div>
                <div class="game-canvas" id="sort-game"></div>
            <div>
        `)
        document.querySelector('.ui-container').append(game)

        const skipBTN = document.querySelector('[aria-label="skip-button"]')
        skipBTN.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })

        if (instance.debug.developer || instance.debug.onPreviewMode())
            skipBTN.style.display = 'flex'

    }

    initCanvas() {
        const width = document.querySelector('.game-canvas').offsetWidth
        const height = document.querySelector('.game-canvas').offsetHeight

        this.stage = new Konva.Stage({
            container: 'sort-game',
            width: width,
            height: height
        })

        this.data = {
            colors: {
                orange: "#fbaf4e",
                orangeOultine: "#d27235",
                pink: "#f65b98",
                pinkOutline: "#b42c64",
                correct: "#00ff00",
                wrong: "#ff0000"
            },
            box: {
                x: 32,
                y: instance.stage.height() / 2 - 300,
                width: 320,
                height: 600,
                strokeWidth: 6,
                cornerRadius: 10,
                buttonSrc: {
                    wrong: "games/dislike.svg",
                    correct: "games/like.svg"
                }
            },
            icon: {
                width: 120,
                height: 120
            },
            button: {
                srcContinue: {
                    default: 'svgs/button_long_goTo.svg',
                    hover: 'svgs/button_long_goTo_hover.svg'
                },
                srcDefault: {
                    default: 'svgs/button_long.svg',
                    hover: 'svgs/button_long_hover.svg'
                },
                fontSize: 24,
                fontFamily: 'Berlin Sans FB',
                align: 'center',
                textFill: 'white',
                icon: {
                    width: 72,
                    height: 60
                }
            },
            counter: {
                correct: 0,
                wrong: 0
            },
            icons: []
        }

        this.animations = {
            // x, y, width, height (8 frames)
            button: [
                0, 0, 240, 134,
                240 * 2, 0, 240, 134,
                240 * 3, 0, 240, 134,
                240 * 4, 0, 240, 134,
                240 * 5, 0, 240, 134,
                240 * 6, 0, 240, 134,
                240 * 7, 0, 240, 134,
                240 * 8, 0, 240, 134,
            ]
        }

        this.program = this.world.program
        const gameData = this.program.getCurrentStepData().sorting.sort(() => Math.random() - 0.5)

        this.data.noOfIcons = gameData.length
        this.data.icons = gameData

    }

    initCanvasLayers() {
        this.layer = new Konva.Layer()

        this.leftBox = this.createBox(
            this.data.box.x,
            this.data.box.y,
            this.data.box.width,
            this.data.box.height,
            this.data.colors.pink,
            this.data.colors.pinkOutline,
            this.data.box.strokeWidth,
            this.data.box.cornerRadius,
            "wrong",
            this.data.box.buttonSrc.wrong
        )
        this.rightBox = this.createBox(
            this.stage.width() - this.data.box.width - this.data.box.x,
            this.data.box.y,
            this.data.box.width,
            this.data.box.height,
            this.data.colors.orange,
            this.data.colors.orangeOultine,
            this.data.box.strokeWidth,
            this.data.box.cornerRadius,
            "correct",
            this.data.box.buttonSrc.correct
        )

        this.layer.add(this.leftBox, this.rightBox)
        this.stage.add(this.layer)

        this.boxes = this.layer.children.filter(item => item.attrs.name === "box")
        this.container = []
        this.grids = []
        this.buttons = []
        this.cells = {
            'correct': [],
            'wrong': []
        }
        this.icons = []

        this.boxes.forEach(el => {
            this.grids.push(el.children.filter(item => item.attrs.name === "grid")[0])
            this.container.push(el.children.filter(item => item.attrs.name === "container")[0])
            this.buttons.push(el.children.filter(item => item.attrs.name === "button")[0])
        })

        this.grids.forEach(grid => {
            grid.children.forEach(el => {
                this.cells[grid.id()].push(el)
            })
        })

        instance.data.icons.forEach(async (data) => {
            instance.offline.fetchChapterAsset(data, "icon", instance.createIcon)
        })
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    setEventListenersForIcon(icon) {
        icon.on('mouseover', () => {
            if (icon.draggable()) {
                icon.children[0].opacity(0.95)
                document.body.style.cursor = 'pointer'
            }
        })
        icon.on('mouseout', () => {
            if (icon.draggable()) {
                icon.children[0].opacity(1)
                document.body.style.cursor = 'default'
            }
        })
        icon.on('dragmove', () => {
            const maxX = icon.getParent().x()
            const maxY = icon.getParent().y()

            const minX = maxX - instance.stage.width() + icon.width()
            const minY = maxY - instance.stage.height() + icon.height()

            icon.x(Math.min(Math.max(icon.x(), -maxX), -minX))
            icon.y(Math.min(Math.max(icon.y(), -maxY), -minY))

        })
        icon.on('dragstart', () => {
            instance.draggedIconPosition = icon.position()
            icon.zIndex(9)
        })
        icon.on('dragend', () => {
            const category = icon.name().replace('icon_', '')
            const box = instance.boxes.find(b => b.id() == category)
            let selectedBox = category
            let feedback = null


            if (!instance.intersected(icon, instance.leftBox)
                && !instance.intersected(icon, instance.rightBox)) {
                return
            }

            if (instance.movedToCorrectBox(icon)) {
                feedback = 'correct'
                const cell = instance.cells[category][instance.data.counter[category]++]

                icon.to({
                    x: box.x() + cell.x() + cell.width() / 2 - icon.width() / 2,
                    y: box.y() + cell.y() + cell.height() / 2 - icon.height() / 2,
                    duration: 0.5
                })

                icon.draggable(false)
                instance.audio.playSound('correct')

                if (instance.gameIsFinished()) {
                    setTimeout(instance.toggleGameComplete, 1000)
                }
            }
            else {
                feedback = 'wrong'
                selectedBox = box.id() == 'correct' ? 'wrong' : 'correct'

                icon.to({
                    x: instance.draggedIconPosition.x,
                    y: instance.draggedIconPosition.y,
                    duration: 0.5
                })

                instance.audio.playSound('wrong')
            }

            instance.sortingFeedback(selectedBox, feedback)
        })
    }

    gameIsFinished() {
        let totalCount = 0
        Object.values(instance.data.counter).forEach(c => totalCount += c);
        return totalCount == instance.data.icons.length
    }

    toggleGameComplete() {
        window.removeEventListener('resize', instance.resize)

        const congratsHTML = _gl.elementFromHtml(`
            <div class="game-popup">
                <h1>${_s.miniGames.completed.title}</h1>
                <p>${_s.miniGames.completed.message}</p>
                <div class="buttons"></div>
            </div>
        `)

        const continueBtn = _gl.elementFromHtml(`
            <button class="btn default next pulsate">${_s.miniGames.continue}</button>
        `)

        continueBtn.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })

        congratsHTML.querySelector('.buttons').append(continueBtn)

        document.querySelector('.sort-game .container').append(congratsHTML)
        document.querySelector('.sort-game').classList.add('popup-visible')

        instance.audio.playSound('task-completed')
        instance.experience.celebrate({
            particleCount: 100,
            spread: 160
        })
    }

    createBox(x, y, w, h, fill, stroke, strokeWidth, radius, id, buttonSrc) {
        this.box = new Konva.Group({
            x: x,
            y: y,
            width: w,
            height: h,
            name: 'box',
            id: id
        })
        this.box.add(new Konva.Rect({
            width: w,
            height: h,
            fill: fill,
            cornerRadius: radius,
            name: 'container'
        }))

        const padding = 30

        this.grid = new Konva.Group({
            width: w - padding * 2,
            height: this.box.height() * 3 / 4 - padding * 2,
            name: 'grid',
            id: id
        })

        this.box.add(this.grid)

        let posX = 30
        let posY = 30

        for (let i = 0; i < 6; i++) {
            const cell = this.createCell(posX, posY, this.grid.width(), fill, stroke, strokeWidth, i + 1)
            this.grid.add(cell)

            if (i % 2 === 0) {
                posX += cell.width()
            } else {
                posX -= cell.width()
                posY += cell.height()
            }

            if (i === 0) {
                cell.attrs.cornerRadius = [radius / 2, 0, 0, 0]
            } else if (i === 1) {
                cell.attrs.cornerRadius = [0, radius / 2, 0, 0]
            } else if (i === 4) {
                cell.attrs.cornerRadius = [0, 0, 0, radius / 2]
            } else if (i === 5) {
                cell.attrs.cornerRadius = [0, 0, radius / 2, 0]
            }
        }

        const button = new Konva.Group({
            width: this.box.width() - padding * 2,
            height: this.box.height() / 4 - padding,
            x: padding,
            y: this.box.height() * 3 / 4,
            name: 'button',
            id: id
        })

        button.add(new Konva.Rect({
            width: button.width(),
            height: button.height(),
            fill: "blue",
            stroke: "white",
            strokeWidth: strokeWidth,
            cornerRadius: radius / 2,
            name: "buttonBg"
        }))

        Konva.Image.fromURL(buttonSrc, (imageNode) => {
            button.add(imageNode)

            imageNode.setAttrs({
                x: button.width() / 2,
                y: button.height() / 2,
                width: this.data.button.icon.width,
                height: this.data.button.icon.height,
                name: "image",
                offset: {
                    x: this.data.button.icon.width / 2,
                    y: this.data.button.icon.height / 2
                }
            })
        })

        button.add(this.setSprite("correct", { x: button.width() / 2, y: button.height() / 2 }))
        button.add(this.setSprite("wrong", { x: button.width() / 2, y: button.height() / 2 }))

        this.box.add(button)

        return this.box
    }

    createCell(x, y, w, fill, stroke, strokeWidth) {
        const cell = new Konva.Rect({
            x: x,
            y: y,
            width: w / 2,
            height: w / 2,
            fill: fill,
            stroke: stroke,
            strokeWidth: strokeWidth,
            name: 'cell'
        })

        return cell
    }

    createIcon(data) {
        const icon = new Konva.Group({
            x: instance.getIconPosition(instance.icons.length).x,
            y: instance.getIconPosition(instance.icons.length).y,
            width: instance.data.icon.width,
            height: instance.data.icon.height,
            draggable: true,
            name: data.correct_wrong ? 'icon_correct' : 'icon_wrong'
        })

        Konva.Image.fromURL(data.icon, (img) => {
            img.setAttrs({
                x: 0,
                y: 0,
                width: icon.width(),
                height: icon.height(),
                name: "image",
            })
            icon.add(img)
        })

        instance.layer.add(icon)
        instance.icons.push(icon)
        instance.setEventListenersForIcon(icon)
    }

    addButton(name, background, label) {
        const button = document.createElement('div')
        button.className = "button " + background + ' ' + name
        button.innerHTML = "<span>" + label + "</span>"

        return button
    }

    intersected(r1, r2) {
        return !(
            r2.x() > r1.x() + r1.width() ||
            r2.x() + r2.width() < r1.x() ||
            r2.y() > r1.y() + r1.height() ||
            r2.y() + r2.height() < r1.y()
        )
    }

    movedToCorrectBox(icon) {
        const boxCategory = icon.name().replace('icon_', '')
        const correctBox = instance.boxes.find(b => b.id() == boxCategory)

        return instance.intersected(icon, correctBox)
    }

    sortingFeedback(selectedBox, feedback) {
        this.buttons.forEach(button => {
            if (button.parent.id() === selectedBox) {
                button.children[1].visible(false)
                this.playAnimation(button, feedback)
            }
        })
    }

    playAnimation(button, feedback) {
        const animation = button.findOne('#' + feedback)
        const buttonBg = button.findOne('.buttonBg')
        const image = button.findOne('.image')

        if (animation.isRunning()) {
            animation.stop()
            animation.frameIndex(0)
        }
        else {
            const otherFeedback = feedback == 'correct' ? 'wrong' : 'correct'
            const otherAnimation = button.findOne('#' + otherFeedback)

            if (otherAnimation.isRunning()) {
                otherAnimation.stop()
                otherAnimation.frameIndex(0)
                otherAnimation.visible(false)
            }
        }

        buttonBg.fill(instance.data.colors[feedback])
        image.visible(false)
        animation.visible(true)
        animation.start()

        animation.on('frameIndexChange.konva', function () {
            if (this.frameIndex() == 7) {
                animation.visible(false)
                animation.stop()
                buttonBg.fill('blue')
                image.visible(true)
            }
        })
    }

    setSprite(id, position) {
        const image = new Image()
        image.src = 'games/' + id + '.png'

        return new Konva.Sprite({
            x: position.x,
            y: position.y,
            width: 240,
            height: 134,
            image: image,
            animation: 'button',
            animations: this.animations,
            frameRate: 8,
            frameIndex: 0,
            name: "animationSprite",
            id: id,
            visible: false,
            offset: {
                x: 240 / 2,
                y: 134 / 2
            }
        })
    }

    getIconPosition(index) {
        const iconsWrapper = Math.abs(instance.leftBox.x() + instance.leftBox.width() - instance.rightBox.x())

        const marginGutter = {
            top: 10,
            between: 20
        }

        const boxSize = instance.data.icon.width + marginGutter.between
        const iconsPerRow = Math.max(Math.min(Math.floor((iconsWrapper - 20) / boxSize), 4), 2) // between [2-4]
        marginGutter.sides = (iconsWrapper - iconsPerRow * instance.data.icon.width - (iconsPerRow - 1) * marginGutter.between) / 2

        const position = {
            x: instance.leftBox.x() + instance.leftBox.width() + marginGutter.sides + (index % iconsPerRow) * (instance.data.icon.width + marginGutter.between),
            y: instance.leftBox.y() + marginGutter.top + Math.floor(index / iconsPerRow) * (instance.data.icon.height + marginGutter.between)
        }

        return position
    }

    resize() {

        const width = document.querySelector('.game-canvas').offsetWidth
        const height = document.querySelector('.game-canvas').offsetHeight

        // Set stage dimension
        instance.stage.width(width)
        instance.stage.height(height)

        instance.leftBox.y(instance.stage.height() / 2 - 300)
        instance.rightBox.y(instance.stage.height() / 2 - 300)

        // Set boxes position
        if (window.innerWidth < 1400) {
            instance.leftBox.x(32)
            instance.rightBox.x(instance.stage.width() - instance.data.box.width - 32)
        } else {
            instance.leftBox.x(instance.stage.width() / 2 - (instance.data.box.width * 2))
            instance.rightBox.x(instance.stage.width() / 2 + instance.data.box.width)
        }

        // Set icons position
        instance.icons.forEach((icon, index) => {
            icon.position(instance.getIconPosition(index))
        })
    }

    destroy() {
        window.removeEventListener('resize', instance.resize)
        document.querySelector('.game')?.remove()
    }
}