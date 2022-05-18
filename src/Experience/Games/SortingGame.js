import Experience from '../Experience.js'
import Konva from 'konva'
import _s from '../Utils/Strings.js'

let instance = null

export default class Game {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.audio = this.world.audio
        this.sizes = this.experience.sizes
        this.debug = this.experience.debug

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
                x: 200,
                y: 200,
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
                fontFamily: 'Archivo',
                align: 'center',
                textFill: 'white'
            }
        }

        instance = this
    }

    toggleSortingGame() {
        this.init()
        this.createAllLayers()
        this.addEventListeners()
    }

    init() {
        this.data.counter = {
            correct: 0,
            wrong: 0
        }
        this.data.icons = []

        const gameWrapper = document.createElement('div')
        gameWrapper.setAttribute("id", "sort-game")
        document.body.appendChild(gameWrapper)

        this.stage = new Konva.Stage({
            container: 'sort-game',
            width: this.sizes.width,
            height: this.sizes.height,
        })

        instance.program = instance.world.program
        const gameData = instance.program.getCurrentStepData().sorting

        instance.data.noOfIcons = gameData.length
        instance.data.icons = gameData

        document.body.classList.add('freeze')
    }

    createAllLayers() {
        this.layer = new Konva.Layer()

        this.layer.add(new Konva.Text({
            text: _s.miniGames.sortingIcons.title,
            fontSize: 48,
            fontFamily: 'Archivo',
            fill: 'white',
            align: 'center',
            width: this.sizes.width,
            y: 100
        }))

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
        this.actions = []
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

        instance.data.icons.forEach(iconData => {
            const icon = this.createIcon(iconData)
            instance.layer.add(icon)
            instance.icons.push(icon)
        })

        this.createButton("reset", this.sizes.width / 2, this.sizes.height - 100, this.data.button.srcDefault.default, _s.miniGames.reset)

        if (this.debug.active) {
            this.createButton("skip", this.data.box.x, this.sizes.height - 100, this.data.button.srcDefault.default, _s.miniGames.skip)
        }
    }

    addEventListeners() {
        this.icons.forEach(icon => {
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
                icon.zIndex(10)
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
                    instance.audio.playCodeUnlockedSound()
                    instance.checkGameFinished()
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

                const img = instance.buttons.find(b => b.id() === selectedBox).children.find(item => item.name() == "image")
                const buttonBg = instance.buttons.find(b => b.id() === selectedBox).children.find(item => item.name() == "buttonBg")
                instance.sortingFeedback(img, buttonBg, selectedBox, feedback)
            })
        })

        this.actions.forEach(button => {
            button.on('mouseover', () => {
                document.body.style.cursor = 'pointer'
                const img = button.children.find(item => item.name() == "image")
                instance.setNewImage(img, instance.data.button.srcDefault.hover)
            })
            button.on('mouseout', () => {
                document.body.style.cursor = 'default'
                const img = button.children.find(item => item.name() == "image")
                instance.setNewImage(img, instance.data.button.srcDefault.default)
            })

            button.offset({
                x: button.width() / 2,
                y: button.height() / 2
            })

            if (button.id() == "reset") {
                button.on('click', () => {
                    instance.destroy()
                    instance.toggleSortingGame()
                })
            }

            if (button.id() == "skip") {
                button.on('click', () => {
                    instance.destroy()
                    instance.program.advance()
                })
            }

        })
    }

    checkGameFinished() {
        let totalCount = 0
        Object.values(instance.data.counter).forEach(c => totalCount += c);
        if (totalCount == instance.data.icons.length) {

            const continueJourney = this.createButton("continue", this.sizes.width - this.data.box.x, this.sizes.height - 100, this.data.button.srcContinue.default, _s.miniGames.continue)
            continueJourney.offset({
                x: continueJourney.width() / 2,
                y: continueJourney.height() / 2
            })

            const label = continueJourney.children.find(item => item.name() == "label")
            label.offsetX(12)

            continueJourney.on('mouseover', () => {
                document.body.style.cursor = 'pointer'
                const img = resetGame.children.find(item => item.name() == "image")
                instance.setNewImage(img, instance.data.button.srcContinue.hover)
            })
            continueJourney.on('mouseout', () => {
                document.body.style.cursor = 'default'
                const img = resetGame.children.find(item => item.name() == "image")
                instance.setNewImage(img, instance.data.button.srcContinue.default)
            })

            continueJourney.on('click', () => {
                instance.destroy()
                instance.program.advance()
            })

            setTimeout(function () {
                instance.audio.playCongratsSound()
            }, 2000)
        }
    }

    completeContent() {

        const complete = new Konva.Layer()

        const completeBox = new Konva.Group({
            width: instance.sizes.width,
            height: instance.sizes.height,
        })

        completeBox.add(new Konva.Rect({
            width: completeBox.width(),
            height: completeBox.height(),
            fillLinearGradientEndPointX: completeBox.width(),
            fillLinearGradientColorStops: [
                0, '#131A43',
                1, '#3E306D'
            ],
            opacity: .8
        }))

        const textBox = new Konva.Group({
            x: completeBox.width() / 2,
            y: completeBox.height() / 2,
            width: 700,
            height: 500,
            offset: {
                x: 350,
                y: 250
            }
        })

        textBox.add(new Konva.Path({
            data: 'M40.93 8 8.13 41.18C2.93 46.44 0 53.64 0 61.16v370.2c0 6.76 2.37 13.29 6.68 18.39l16.82 19.91c5.15 6.1 12.6 9.6 20.44 9.6h90.11c6.76 0 13.27 2.6 18.26 7.3l6.55 6.15c4.99 4.7 11.51 7.3 18.26 7.3h482.93c8.02 0 15.63-3.66 20.78-10.01l12.83-15.79c4.09-5.04 6.34-11.4 6.34-17.98v-93.98c0-8-3.32-15.62-9.12-20.93-5.77-5.29-9.09-12.86-9.12-20.83l-.87-246.46c-.03-7.53-2.99-14.73-8.23-19.98l-16.48-16.5c-5.06-5.07-11.83-7.9-18.89-7.9H501.07c-7.5 0-14.66-3.2-19.78-8.84L470.43 8.85C465.3 3.21 458.14.01 450.65.01H59.91c-7.1 0-13.91 2.87-18.98 8Z',
            fillLinearGradientEndPointX: textBox.width(),
            fillLinearGradientColorStops: [
                0, '#131A43',
                1, '#3E306D'
            ],
            stroke: '#0396e3',
            strokeWidth: 4,
            lineJoin: 'round',
            lineCap: 'round'
        }))

        textBox.add(new Konva.Text({
            text: 'Congrats',
            fontSize: 48,
            fontFamily: 'Archivo',
            fill: 'white',
            align: 'center',
            width: textBox.width(),
            y: textBox.height() / 2
        }))

        completeBox.add(textBox)
        complete.add(completeBox)
        // instance.stage.add(complete)
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
                x: button.width() / 2 - 50,
                y: 20,
                width: 100,
                height: 100,
                name: "image"
            })
        })

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
            x: instance.getIconPosition().x,
            y: instance.getIconPosition().y,
            width: this.data.icon.width,
            height: this.data.icon.height,
            draggable: true,
            name: data.correct_wrong ? 'icon_correct' : 'icon_wrong'
        })
        Konva.Image.fromURL(data.icon, (img) => {
            img.setAttrs({
                width: icon.width(),
                height: icon.height(),
                name: "image"
            })
            icon.add(img)
        })

        return icon
    }

    createButton(id, x, y, imgSrc, text) {
        const button = new Konva.Group({
            x: x,
            y: y,
            width: this.data.button.width,
            height: this.data.button.height,
            id: id
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
            id: 'label',
            listening: false
        }))

        this.actions.push(button)
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

        if (
            icon.x() > correctBox.x() && icon.x() < correctBox.x() + correctBox.width() &&
            icon.y() > correctBox.y() && icon.y() < correctBox.y() + correctBox.height()
        ) {
            return true
        } else {
            return false
        }
    }

    isNearCell(icon, cell) {
        const cellX = instance.data.box.x + cell.x()
        const cellY = instance.data.box.y + cell.y()

        if (
            icon.x() > cellX && icon.x() < cellX + cell.width() &&
            icon.y() > cellY && icon.y() < cellY + cell.height()
        ) {
            return true
        } else {
            return false
        }
    }

    sortingFeedback(img, layer, selectedBox, feedback) {
        const color = instance.data.colors[feedback]
        const defaultBtnSrc = instance.data.box.buttonSrc[selectedBox]

        var blink = new Konva.Animation(function (frame) {
            if (frame.time < 500) {
                instance.setNewImage(img, 'games/' + feedback + '.svg')
                img.attrs.height = 60
                img.y(40)
                layer.fill(color)
            }
            else if (frame.time >= 500 && frame.time < 1000) {
                layer.fill('blue')
            }
            else if (frame.time >= 1000 && frame.time < 1500) {
                layer.fill(color)
            }
            else {
                instance.setNewImage(img, defaultBtnSrc)
                img.attrs.height = 100
                img.y(20)
                layer.fill('blue')
                this.stop()
            }
        })
        blink.start()
    }

    setNewImage(img, src) {
        var newImg = new Image()
        newImg.src = src
        newImg.onload = function () {
            img.image(newImg)
        }
    }

    getIconPosition() {
        const iconsPerRow = 3
        const marginGutter = {
            top: 25,
            between: 50
        }
        marginGutter.sides = (instance.sizes.width - (instance.data.box.x + instance.data.box.width) * 2 - iconsPerRow * (instance.data.icon.width + marginGutter.between)) / 2

        const position = {
            x: instance.data.box.x + instance.data.box.width + marginGutter.sides + (instance.icons.length % iconsPerRow) * (instance.data.icon.width + marginGutter.between),
            y: instance.data.box.y + marginGutter.top + Math.floor(instance.icons.length / iconsPerRow) * (instance.data.icon.height + marginGutter.between)
        }

        return position
    }

    destroy() {
        document.getElementById('sort-game').remove()
        document.body.classList.remove('freeze')
    }
}