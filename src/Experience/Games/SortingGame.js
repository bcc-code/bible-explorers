import Experience from '../Experience.js'
import Konva from 'konva'

let instance = null

export default class SortingGame {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.sizes = this.experience.sizes

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

        instance.data.icons.forEach(iconData => {
            const icon = this.createIcon(iconData)
            instance.layer.add(icon)
            instance.icons.push(icon)
        })
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

                if (instance.movedToRightBox(icon)) {
                    feedback = 'correct'
                    const cell = instance.cells[category][instance.data.counter[category]++]

                    icon.to({
                        x: box.x() + cell.x() + cell.width() / 2 - icon.width() / 2,
                        y: box.y() + cell.y() + cell.height() / 2 - icon.height() / 2,
                        duration: 0.5
                    })

                    icon.draggable(false)
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
                }

                const img = instance.buttons.find(b => b.id() === selectedBox).children.find(item => item.name() == "image")
                const buttonBg = instance.buttons.find(b => b.id() === selectedBox).children.find(item => item.name() == "buttonBg")
                instance.sortingFeedback(img, buttonBg, selectedBox, feedback)
            })
        })
    }

    checkGameFinished() {
        let totalCount = 0
        Object.values(instance.data.counter).forEach(c => totalCount += c);
        if (totalCount == instance.data.icons.length) {
            setTimeout(function() {
                console.log('Game finished!')
                instance.destroy()
            }, 2000)
        }
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

    intersected(r1, r2) {
        return !(
            r2.x() > r1.x() + r1.width() ||
            r2.x() + r2.width() < r1.x() ||
            r2.y() > r1.y() + r1.height() ||
            r2.y() + r2.height() < r1.y()
        )
    }

    movedToRightBox(icon) {
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

    sortingFeedback(img, layer, selectedBox, feedback) {
        const color = instance.data.colors[feedback]
        const defaultBtnSrc = instance.data.box.buttonSrc[selectedBox]

        var blink = new Konva.Animation(function(frame) {
            if (frame.time < 500) {
                instance.setNewImage(img, 'games/' + feedback + '.svg')
                layer.stroke(color)
            }
            else if (frame.time >= 500 && frame.time < 1000) {
                layer.stroke('white')
            }
            else if (frame.time >= 1000 && frame.time < 1500) {
                layer.stroke(color)
            }
            else {
                instance.setNewImage(img, defaultBtnSrc)
                layer.stroke('white')
                this.stop()
            }
        })
        blink.start()
    }

    setNewImage(img, src) {
        var newImg = new Image()
        newImg.src = src
        newImg.onload = function() {
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
        instance.program.advance()
    }
}