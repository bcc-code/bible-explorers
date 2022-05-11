import Experience from '../Experience.js'
import Konva from 'konva'

let instance = null

export default class Game {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.sizes = this.experience.sizes

        this.data = {
            noOfIcons: 12,
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
                width: 460,
                height: 700,
                strokeWidth: 10,
                cornerRadius: 28
            },
            icon: {
                width: 100,
                height: 100
            },
            counter: {
                correct: 0,
                wrong: 0
            }
        }

        instance = this
    }

    toggleSortingGame() {
        instance.program = instance.world.program

        this.init()
        this.store()

        this.icons.forEach(icon => {
            const defaultColor = icon.children[0].fill()

            icon.on('mouseover', () => {
                icon.children[0].fill('red')
                document.body.style.cursor = 'pointer'
            })

            icon.on('mouseout', () => {
                icon.children[0].fill(defaultColor)
                document.body.style.cursor = 'default'
            })

            icon.on('dragstart', function () {
                instance.draggedIconPosition = icon.position()
            })

            icon.on('dragend', () => {
                const category = icon.name().replace('icon_', '')
                const box = instance.boxes.find(b => b.id() == category)
                let selectedBox = category
                let feedback = null

                if (!icon.inRightPlace && instance.isInRightBox(icon)) {
                    feedback = 'correct'
                    const cell = instance.cells[category][instance.data.counter[category]++]

                    icon.to({
                        x: box.x() + cell.x() + cell.width() / 2 - icon.width() / 2,
                        y: box.y() + cell.y() + cell.height() / 2 - icon.height() / 2,
                        duration: 0.5
                    })

                    icon.inRightPlace = true

                    let totalCount = 0
                    Object.values(instance.data.counter).forEach(c => totalCount += c);
                    if (totalCount == instance.data.noOfIcons) {
                        console.log('Game finished!')
                        instance.destroy()
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
                }

                const img = instance.buttons.find(b => b.id() === selectedBox).children.find(item => item.name() == "image")
                const buttonBg = instance.buttons.find(b => b.id() === selectedBox).children.find(item => item.name() == "buttonBg")
                instance.sortingFeedback(img, buttonBg, feedback)
            })
        })

        this.buttons.forEach(button => {
            button.on('mouseover', () => {
                document.body.style.cursor = 'pointer'
            })

            button.on('mouseout', () => {
                document.body.style.cursor = 'default'
            })
        })
    }

    init() {
        const gameWrapper = document.createElement('div')
        gameWrapper.setAttribute("id", "sort-game")
        document.body.appendChild(gameWrapper)

        this.stage = new Konva.Stage({
            container: 'sort-game',
            width: this.sizes.width,
            height: this.sizes.height,
        })

        document.body.classList.add('freeze')
    }

    store() {
        this.layer = new Konva.Layer()
        this.leftBox = this.createBox(
            this.data.box.x,
            this.data.box.y,
            this.data.box.width,
            this.data.box.height,
            this.data.colors.orange,
            this.data.colors.orangeOultine,
            this.data.box.strokeWidth,
            this.data.box.cornerRadius,
            "correct",
            "games/like.svg"
        )
        this.rightBox = this.createBox(
            this.stage.width() - this.data.box.width - this.data.box.x,
            this.data.box.y,
            this.data.box.width,
            this.data.box.height,
            this.data.colors.pink,
            this.data.colors.pinkOutline,
            this.data.box.strokeWidth,
            this.data.box.cornerRadius,
            "wrong",
            "games/dislike.svg"
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

        for (let i = 0; i < instance.data.noOfIcons; i++) {
            this.layer.add(this.createIcon(i))
        }

        this.icons = this.layer.children.filter(item => item.attrs.name.startsWith("icon_"))
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

    createIcon(index) {
        const randomColor = () => {
            const color = Math.floor(Math.random() * 16777215).toString(16);
            return "#" + color
        }

        const marginGutter = 25
        const wrapper = {
            x: {
                min: this.data.box.x + this.data.box.width + marginGutter,
                max: this.sizes.width - this.data.box.width - this.data.box.x - this.data.icon.width - marginGutter
            },
            y: {
                min: this.data.box.y + marginGutter,
                max: this.sizes.height - (this.sizes.height - this.data.box.height - this.data.box.y) - this.data.icon.height - marginGutter
            }
        }

        const icon = new Konva.Group({
            x: instance.getRndInteger(wrapper.x.min, wrapper.x.max),
            y: instance.getRndInteger(wrapper.y.min, wrapper.y.max),
            width: this.data.icon.width,
            height: this.data.icon.height,
            draggable: true,
            name: index < 6 ? 'icon_correct' : 'icon_wrong'
        })
        const shape = new Konva.Rect({
            width: icon.width(),
            height: icon.height(),
            fill: randomColor(),
            cornerRadius: 10
        })
        const text = new Konva.Text({
            x: 10,
            y: 10,
            text: 'icon ' + index,
            fontSize: 20,
            fill: "white",
            align: "center"
        })

        icon.add(shape, text)

        const boundingBox = shape.getClientRect({ relativeTo: icon })

        const box = new Konva.Rect({
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
            stroke: 'red',
            strokeWidth: 1,
            cornerRadius: 10
        })

        icon.add(box)

        return icon
    }

    _intersected(r1, r2) {
        return !(
            r2.x > r1.x + r1.width ||
            r2.x + r2.width < r1.x ||
            r2.y > r1.y + r1.height ||
            r2.y + r2.height < r1.y
        )
    }

    isInRightBox(icon) {
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

    _isNearCell(icon, cell) {
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

    sortingFeedback(img, layer, feedback) {
        const color = instance.data.colors[feedback]
        instance.changedBtnImgSrc = img.image().src

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
                instance.setNewImage(img, instance.changedBtnImgSrc)
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

    getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1) ) + min;
    }

    destroy() {
        document.getElementById('sort-game').remove()
        document.body.classList.remove('freeze')
        instance.program.advance()
    }
}