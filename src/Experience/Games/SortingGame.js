import Experience from '../Experience.js'
import Konva from 'konva'
import _s from '../Utils/Strings.js'
import Modal from '../Utils/Modal.js'

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
        this.init()
        this.createAllLayers()
        this.addEventListenersForButtons()
        window.addEventListener('resize', instance.resize)
    }

    init() {
        this.data = {
            canvas: {
                width: this.sizes.width,
                height: this.sizes.height
            },
            colors: {
                orange: "#fbaf4e",
                orangeOultine: "#d27235",
                pink: "#f65b98",
                pinkOutline: "#b42c64",
                correct: "#00ff00",
                wrong: "#ff0000"
            },
            box: {
                x: this.sizes.width / 15,
                y: 225,
                width: 410,
                height: 760,
                strokeWidth: 10,
                cornerRadius: 28,
                buttonSrc: {
                    wrong: "games/dislike.svg",
                    correct: "games/like.svg"
                }
            },
            icon: {
                width: 150,
                height: 150
            },
            button: {
                width: 277,
                height: 77,
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
                    width: 100,
                    height: 80
                },
                sprite: {
                    width: 240,
                    height: 134
                }
            },
            counter: {
                correct: 0,
                wrong: 0
            },
            icons: []
        }

        const spriteW = this.data.button.sprite.width
        const spriteH = this.data.button.sprite.height

        this.animations = {
            // x, y, width, height (8 frames)
            button: [
                0, 0, spriteW, spriteH,
                spriteW * 2, 0, spriteW, spriteH,
                spriteW * 3, 0, spriteW, spriteH,
                spriteW * 4, 0, spriteW, spriteH,
                spriteW * 5, 0, spriteW, spriteH,
                spriteW * 6, 0, spriteW, spriteH,
                spriteW * 7, 0, spriteW, spriteH,
                spriteW * 8, 0, spriteW, spriteH,
            ]
        }

        const gameWrapper = document.createElement('div')
        gameWrapper.setAttribute("id", "sort-game")
        gameWrapper.classList.add('miniGame')
        document.body.appendChild(gameWrapper)

        const title = document.createElement('div')
        title.classList.add('heading')
        title.innerHTML = "<h2>" + _s.miniGames.sortingIcons + "</h2>"

        const actions = document.createElement('div')
        actions.classList.add('miniGame__actions')

        this.stage = new Konva.Stage({
            container: 'sort-game',
            width: this.sizes.width,
            height: this.sizes.height,
        })

        gameWrapper.appendChild(title)
        gameWrapper.appendChild(actions)

        actions.appendChild(
            this.addButton('button__back', 'button__default', _s.journey.back)
        )
        actions.appendChild(
            this.addButton('button__reset', 'button__default', _s.miniGames.reset)
        )

        if (instance.debug.active) {
            actions.appendChild(
                this.addButton('button__skip', 'button__default', _s.miniGames.skip)
            )
        }

        instance.program = instance.world.program
        const gameData = instance.program.getCurrentStepData().sorting.sort(() => Math.random() - 0.5)

        instance.data.noOfIcons = gameData.length
        instance.data.icons = gameData

        document.body.classList.add('freeze')
    }

    createAllLayers() {
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

    addEventListenersForButtons() {
        document.querySelectorAll('.miniGame .button').forEach(button => {
            if (button.classList.contains('button__reset')) {
                button.addEventListener('click', () => {
                    instance.destroy()
                    instance.toggleSortingGame()
                })
            }

            if (button.classList.contains('button__back')) {
                button.addEventListener('click', () => {
                    instance.destroy()
                    instance.world.program.taskDescription.toggleTaskDescription()
                })
            }

            if (button.classList.contains('button__skip')) {
                button.addEventListener('click', () => {
                    instance.destroy()
                    instance.program.advance()
                })
            }
        })
    }

    addEventListenersForIcon(icon) {
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

        icon.on('dragstart', function () {
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
                instance.audio.playCorrectSound()

                if (instance.gameIsFinished()) {
                    setTimeout(instance.finishGame, 1000)
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

                instance.audio.playWrongSound()
            }

            instance.sortingFeedback(selectedBox, feedback)
        })
    }

    gameIsFinished() {
        let totalCount = 0
        Object.values(instance.data.counter).forEach(c => totalCount += c);
        return totalCount == instance.data.icons.length
    }

    finishGame() {
        instance.toggleGameComplete()
        instance.audio.playTaskCompleted()

        document.getElementById('continue_journey').addEventListener('click', () => {
            instance.destroy()
            instance.modal.destroy()
            instance.program.advance()
        })
    }

    toggleGameComplete() {
        let html = `<div class="modal__content congrats congrats__miniGame">
            <div class="congrats__container">
                <div class="congrats__title"><i class="icon icon-star-solid"></i><i class="icon icon-star-solid"></i><h1>${_s.miniGames.completed.title}</h1><i class="icon icon-star-solid"></i><i class="icon icon-star-solid"></i></div>
                <div class="congrats__chapter-completed">${_s.miniGames.completed.message}!</div>
                <div id="continue_journey" class="button button__continue">
                    <div class="button__content"> <span>${_s.miniGames.continue}</span></div>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html)

        document.querySelector('.modal').classList.add('modal__congrats')
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
            stroke: stroke,
            strokeWidth: strokeWidth,
            cornerRadius: radius,
            name: 'container'
        }))

        this.grid = new Konva.Group({
            width: w - 60,
            height: h - 260,
            name: 'grid',
            id: id
        })

        this.box.add(this.grid)

        let posX = 30
        let posY = 30

        for (let i = 0; i < 6; i++) {
            const cell = this.createCell(posX, posY, this.grid.width(), this.grid.height(), fill, stroke, strokeWidth, i + 1)
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
            width: this.box.width() - 60,
            height: 140,
            x: 30,
            y: this.box.height() - 170,
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

    createCell(x, y, w, h, fill, stroke, strokeWidth) {
        const cell = new Konva.Rect({
            x: x,
            y: y,
            width: w / 2,
            height: h / 3,
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
                width: icon.width(),
                height: icon.height(),
                name: "image",
            })
            icon.add(img)
        })

        instance.layer.add(icon)
        instance.icons.push(icon)
        instance.addEventListenersForIcon(icon)
    }

    addButton(name, background, label) {
        const button = document.createElement('div')
        button.className = "button " + background + ' ' + name
        button.innerHTML = "<span>" + label + "</span>"

        return button
    }

    createButton(id, x, y, imgSrc, text, offset = { x: 0, y: 0 }) {
        const button = new Konva.Group({
            x: x,
            y: y,
            width: this.data.button.width,
            height: this.data.button.height,
            id: id,
            offset: offset
        })

        Konva.Image.fromURL(imgSrc, image => {
            button.add(image)

            image.setAttrs({
                width: button.width(),
                height: button.height(),
                name: 'image'
            })

            image.zIndex(0)
        })

        button.add(new Konva.Text({
            text: text,
            fontSize: this.data.button.fontSize,
            fontFamily: this.data.button.fontFamily,
            align: this.data.button.align,
            fill: this.data.button.textFill,
            width: button.width(),
            y: button.height() / 2,
            offset: {
                y: 12
            },
            name: 'label',
            listening: false
        }))

        this.layer.add(button)

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

        animation.on('frameIndexChange.konva', function() {
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
            width: this.data.button.sprite.width,
            height: this.data.button.sprite.height,
            image: image,
            animation: 'button',
            animations: this.animations,
            frameRate: 8,
            frameIndex: 0,
            name: "animationSprite",
            id: id,
            visible: false,
            offset: {
                x: this.data.button.sprite.width / 2,
                y: this.data.button.sprite.height / 2
            }
        })
    }

    getIconPosition(index) {
        const iconsWrapperWidth = instance.sizes.width - (instance.data.box.x + instance.data.box.width) * 2
        const marginGutter = {
            top: 25,
            between: 50
        }

        const boxSize = instance.data.icon.width + marginGutter.between
        const iconsPerRow = Math.max(Math.min(Math.floor((iconsWrapperWidth - 100) / boxSize), 4), 2) // between [2-4]
        marginGutter.sides = (iconsWrapperWidth - iconsPerRow * instance.data.icon.width - (iconsPerRow - 1) * marginGutter.between) / 2

        const position = {
            x: instance.data.box.x + instance.data.box.width + marginGutter.sides + (index % iconsPerRow) * (instance.data.icon.width + marginGutter.between),
            y: instance.data.box.y + marginGutter.top + Math.floor(index / iconsPerRow) * (instance.data.icon.height + marginGutter.between)
        }

        return position
    }

    resize() {
        var containerWidth = window.innerWidth
        var containerHeight = window.innerHeight
        var scaleX = containerWidth / instance.data.canvas.width
        var scaleY = containerHeight / instance.data.canvas.height

        // Set stage dimension
        instance.stage.width(instance.data.canvas.width * scaleX)
        instance.stage.height(instance.data.canvas.height * scaleY)

        // Set boxes position
        instance.leftBox.x(instance.sizes.width / 15)
        instance.rightBox.x(instance.stage.width() - instance.data.box.width - instance.sizes.width / 15)

        // Set icons position
        instance.icons.forEach((icon, index) => {
            icon.position(instance.getIconPosition(index))
        })
    }

    destroy() {
        document.getElementById('sort-game').remove()
        document.body.classList.remove('freeze')
        window.removeEventListener('resize', instance.resize)
    }
}