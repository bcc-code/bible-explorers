import Experience from '../Experience.js'
import Konva from 'konva'

let instance = null

export default class Game {
    constructor() {


        this.experience = new Experience()
        this.sizes = this.experience.sizes

        this.data = {
            orange: "#fbaf4e",
            orangeOultine: "#d27235",
            pink: "#f65b98",
            pinkOutline: "#b42c64",
            strokeWidth: 10,
            cornerRadius: 28,
            width: 460,
            height: 700,
            x: 200,
            y: 200
        }


        // Setup
        instance = this
        this._init()
        this._store()

        this.icons.forEach((icon, index) => {
            const defaultColor = icon.children[0].fill()

            icon.on('mouseover', () => {
                icon.children[0].fill('red')
                document.body.style.cursor = 'pointer'
            })

            icon.on('mouseout', () => {
                icon.children[0].fill(defaultColor)
                document.body.style.cursor = 'default'
            })

            icon.on('dragend', () => {
                const cellRight = instance.cellsLeft[index % 6]
                const cellWrong = instance.cellsRight[index % 6]
                console.log(cellRight);
                console.log(cellWrong);

                if (!icon.inRightPlace && instance._isNearCell(icon, cellRight)) {
                    icon.position({
                        x: cellRight.x() + instance.data.x + cellRight.width() / 2 - icon.width() / 2,
                        y: cellRight.y() + instance.data.y + cellRight.height() / 2 - icon.height() / 2,
                    })

                    icon.inRightPlace = true
                } else if (!icon.inRightPlace && instance._isNearCell(icon, cellWrong)) {
                    icon.position({
                        x: cellWrong.x() + instance.data.x + cellWrong.width() / 2 - icon.width() / 2,
                        y: cellWrong.y() + instance.data.y + cellWrong.height() / 2 - icon.height() / 2,
                    })

                    icon.inRightPlace = true
                }



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

    _init() {
        const gameWrapper = document.createElement('div')
        gameWrapper.setAttribute("id", "sort-game")
        document.body.appendChild(gameWrapper)

        this.stage = new Konva.Stage({
            container: 'sort-game',
            width: this.sizes.width,
            height: this.sizes.height,
        })

    }

    _store() {
        this.layer = new Konva.Layer()
        this.leftBox = this._box(
            this.data.x,
            this.data.y,
            this.data.width,
            this.data.height,
            this.data.orange,
            this.data.orangeOultine,
            this.data.strokeWidth,
            this.data.cornerRadius,
            "correct",
            "games/like.svg"
        )
        this.rightBox = this._box(
            this.stage.width() - this.data.width - this.data.x,
            this.data.y,
            this.data.width,
            this.data.height,
            this.data.pink,
            this.data.pinkOutline,
            this.data.strokeWidth,
            this.data.cornerRadius,
            "wrong",
            "games/dislike.svg"
        )

        this.leftBox.attrs.id = 'left_box'
        this.rightBox.attrs.id = 'right_box'

        this.layer.add(this.leftBox, this.rightBox)
        this.stage.add(this.layer)

        this.boxes = this.layer.children.filter(item => item.attrs.name === "box")
        this.container = []
        this.grids = []
        this.buttons = []
        this.cellsLeft = []
        this.cellsRight = []
        this.boxes.forEach(el => {
            this.grids.push(el.children.filter(item => item.attrs.name === "grid")[0])
            this.container.push(el.children.filter(item => item.attrs.name === "container")[0])
            this.buttons.push(el.children.filter(item => item.attrs.name === "button")[0])
        })

        this.grids.forEach(grid => {

            if (grid.attrs.id === "correct") {
                grid.children.forEach(el => {
                    this.cellsLeft.push(el)
                })
            } else if ((grid.attrs.id === "wrong")) {
                grid.children.forEach(el => {
                    this.cellsRight.push(el)
                })
            }
        })


        for (let i = 0; i < 12; i++) {
            this.layer.add(this._createIcon(i))
        }

        this.icons = this.layer.children.filter(item => item.attrs.name === "icon")

    }

    _box(x, y, w, h, fill, stroke, strokeWidth, radius, id, buttonSrc) {
        this.box = new Konva.Group({
            x: x,
            y: y,
            width: w,
            height: h,
            name: 'box'
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
            const cell = this._createCell(posX, posY, this.grid.width(), this.grid.height(), fill, stroke, strokeWidth, i + 1)
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
        })

        button.add(new Konva.Rect({
            width: button.width(),
            height: button.height(),
            fill: "blue",
            stroke: "white",
            strokeWidth: strokeWidth,
            cornerRadius: radius / 2,
        }))

        Konva.Image.fromURL(buttonSrc, (imageNode) => {
            button.add(imageNode)

            imageNode.setAttrs({
                x: button.width() / 2 - 50,
                y: 20,
                width: 100,
                height: 100
            })
        })

        this.box.add(button)

        return this.box
    }

    _createCell(x, y, w, h, fill, stroke, strokeWidth) {
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

    _createIcon(index) {

        const randomColor = () => {
            const color = Math.floor(Math.random() * 16777215).toString(16);
            return "#" + color
        }

        const icon = new Konva.Group({
            // x: this.stage.width() / 2 - 50,
            x: Math.random() * this.sizes.width,
            // y: this.stage.height() / 2 - 50,
            y: Math.random() * this.sizes.height,
            width: 100,
            height: 100,
            draggable: true,
            name: 'icon'
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

    _isNearCell(icon, cell) {
        const cellX = instance.data.x + cell.x()
        const cellY = instance.data.y + cell.y()

        console.log(icon.x(), 'ix');
        console.log(icon.y(), 'iy');
        console.log(cellX, 'cx');
        console.log(cellY, 'cy');

        if (
            icon.x() > cellX && icon.x() < cellX + cell.width() &&
            icon.y() > cellY && icon.y() < cellY + cell.height()
        ) {
            return true
        } else {
            return false
        }
    }
}


