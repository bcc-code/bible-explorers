import Experience from '../Experience.js'
import Konva from 'konva'

let instance = null

export default class CableConnector {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.sizes = this.experience.sizes

        this.data = {
            box: {
                width: this.sizes.width - 200,
                height: this.sizes.height - 200,
                cornerRadius: 28,
                strokeWidth: 10,
                strokeColor: '#cbcbcb',
                gradientColor: [
                    0, '#1a1a1a',
                    1, '#4d4d4d'
                ],
                gradientColorSides: [
                    0, '#989898',
                    1, '#666666'
                ],
            },
            side: {
                width: 300,
            },
            default: {
                strokeWidth: 6,
            },
            outlet: {
                width: 40,
                height: 100,
                items: []
            },
            plugin: {
                width: 100,
                height: 60,
                items: []
            },
            colors: [
                "#989898",
                "#373e93",
                "#f9c662",
                "#ff6ea9",
                "#af4eaa"
            ],

            strokeColors: [
                "#878787",
                "#23307a",
                "#fcb04e",
                "#f75b99",
                "#9f4096",
            ]
        }
        instance = this

        this.init()
        this.createAllLayers()
    }

    init() {
        const gameWrapper = document.createElement('div')
        gameWrapper.setAttribute("id", "cable-connector")
        document.body.appendChild(gameWrapper)

        this.stage = new Konva.Stage({
            container: 'cable-connector',
            width: this.sizes.width,
            height: this.sizes.height,
        })

        document.body.classList.add('freeze')
    }

    createAllLayers() {
        this.layer = new Konva.Layer()

        this.wrapper = new Konva.Group({
            x: 100,
            y: 100,
            width: this.data.box.width,
            height: this.data.box.height,
        })

        const leftSide = new Konva.Group({
            width: this.data.side.width,
            height: this.data.box.height,
        })

        leftSide.add(new Konva.Rect({
            width: leftSide.width(),
            height: leftSide.height(),
            fillLinearGradientStartPoint: {
                x: 0,
                y: 0
            },
            fillLinearGradientEndPoint: {
                x: 300,
                y: 0
            },
            fillLinearGradientColorStops: this.data.box.gradientColorSides,
            cornerRadius: [this.data.box.cornerRadius, 0, 0, this.data.box.cornerRadius],
            stroke: this.data.box.strokeColor,
            strokeWidth: this.data.box.strokeWidth
        }))

        leftSide.add(new Konva.Rect({
            width: 40,
            height: leftSide.height() - 10,
            x: leftSide.width(),
            y: 5,
            fillLinearGradientStartPoint: {
                x: 0,
                y: 0
            },
            fillLinearGradientEndPoint: {
                x: 400,
                y: leftSide.height()
            },
            fillLinearGradientColorStops: [
                0, 'black',
                0.1, 'black',
                0.1, '#fbaf4e',
                0.2, '#fbaf4e',
                0.2, 'black',
                0.3, 'black',
                0.3, '#fbaf4e',
                0.4, '#fbaf4e',
                0.4, 'black',
                0.5, 'black',
                0.5, '#fbaf4e',
                0.6, '#fbaf4e',
                0.6, 'black',
                0.7, 'black',
                0.7, '#fbaf4e',
                0.8, '#fbaf4e',
                0.8, 'black',
                0.9, 'black',
                0.9, '#fbaf4e',
                1, '#fbaf4e',
            ],
        }))

        this.wrapper.add(leftSide)

        const rigthSide = new Konva.Group({
            x: this.data.box.width - this.data.side.width,
            width: this.data.side.width,
            height: this.data.box.height,
        })

        rigthSide.add(new Konva.Rect({
            width: rigthSide.width(),
            height: rigthSide.height(),
            cornerRadius: [0, this.data.box.cornerRadius, this.data.box.cornerRadius, 0],
            fillLinearGradientStartPoint: {
                x: 300,
                y: 0
            },
            fillLinearGradientEndPoint: {
                x: 0,
                y: 0
            },
            fillLinearGradientColorStops: this.data.box.gradientColorSides,
            stroke: this.data.box.strokeColor,
            strokeWidth: this.data.box.strokeWidth
        }))

        rigthSide.add(new Konva.Rect({
            width: 40,
            height: rigthSide.height() - 10,
            x: 5,
            y: 5,
            fillLinearGradientStartPoint: {
                x: 0,
                y: 0
            },
            fillLinearGradientEndPoint: {
                x: -400,
                y: leftSide.height()
            },
            fillLinearGradientColorStops: [
                0, 'black',
                0.1, 'black',
                0.1, '#fbaf4e',
                0.2, '#fbaf4e',
                0.2, 'black',
                0.3, 'black',
                0.3, '#fbaf4e',
                0.4, '#fbaf4e',
                0.4, 'black',
                0.5, 'black',
                0.5, '#fbaf4e',
                0.6, '#fbaf4e',
                0.6, 'black',
                0.7, 'black',
                0.7, '#fbaf4e',
                0.8, '#fbaf4e',
                0.8, 'black',
                0.9, 'black',
                0.9, '#fbaf4e',
                1, '#fbaf4e',
            ],
        }))

        this.wrapper.add(rigthSide)

        // Plugins

        const box = new Konva.Group({
            x: this.data.side.width,
            width: this.data.box.width - this.data.side.width * 2,
            height: this.data.box.height,
        })

        box.add(new Konva.Rect({
            width: box.width(),
            height: box.height(),
            fillLinearGradientStartPoint: {
                x: 0,
                y: 0
            },
            fillLinearGradientEndPoint: {
                x: 0,
                y: this.data.box.height
            },
            fillLinearGradientColorStops: this.data.box.gradientColor,
            stroke: this.data.box.strokeColor,
            strokeWidth: this.data.box.strokeWidth,
            listening: false,
        }))

        this.wrapper.add(box)

        box.add(this.outlet(5, 20, this.data.colors[0], this.data.strokeColors[0], this.data.default.strokeWidth))
        box.add(this.outlet(5, 220, this.data.colors[2], this.data.strokeColors[2], this.data.default.strokeWidth))
        box.add(this.outlet(5, 420, this.data.colors[1], this.data.strokeColors[1], this.data.default.strokeWidth))
        box.add(this.outlet(5, 620, this.data.colors[3], this.data.strokeColors[3], this.data.default.strokeWidth))
        box.add(this.outlet(5, 820, this.data.colors[4], this.data.strokeColors[4], this.data.default.strokeWidth))

        box.add(this.outlet(box.width(), 20, this.data.colors[4], this.data.strokeColors[4], this.data.default.strokeWidth, -1))
        box.add(this.outlet(box.width(), 220, this.data.colors[0], this.data.strokeColors[0], this.data.default.strokeWidth, -1))
        box.add(this.outlet(box.width(), 420, this.data.colors[3], this.data.strokeColors[3], this.data.default.strokeWidth, -1))
        box.add(this.outlet(box.width(), 620, this.data.colors[1], this.data.strokeColors[1], this.data.default.strokeWidth, -1))
        box.add(this.outlet(box.width(), 820, this.data.colors[2], this.data.strokeColors[2], this.data.default.strokeWidth, -1))

        box.add(this.plugIn(20, 40, this.data.colors[0], this.data.strokeColors[0], this.data.default.strokeWidth))
        box.add(this.plugIn(20, 220, this.data.colors[2], this.data.strokeColors[2], this.data.default.strokeWidth))
        box.add(this.plugIn(20, 420, this.data.colors[1], this.data.strokeColors[1], this.data.default.strokeWidth))
        box.add(this.plugIn(20, 620, this.data.colors[3], this.data.strokeColors[3], this.data.default.strokeWidth))
        box.add(this.plugIn(20, 820, this.data.colors[4], this.data.strokeColors[4], this.data.default.strokeWidth))

        box.add(this.plugIn(box.width() - 40, 40, this.data.colors[0], this.data.strokeColors[0], this.data.default.strokeWidth, -1))
        box.add(this.plugIn(box.width() - 40, 220, this.data.colors[2], this.data.strokeColors[2], this.data.default.strokeWidth, -1))
        box.add(this.plugIn(box.width() - 40, 420, this.data.colors[1], this.data.strokeColors[1], this.data.default.strokeWidth, -1))
        box.add(this.plugIn(box.width() - 40, 620, this.data.colors[3], this.data.strokeColors[3], this.data.default.strokeWidth, -1))
        box.add(this.plugIn(box.width() - 40, 820, this.data.colors[4], this.data.strokeColors[4], this.data.default.strokeWidth, -1))


        console.log(this.data.plugin.items);

        this.layer.add(this.wrapper)
        this.stage.add(this.layer)
    }

    outlet(x, y, fill, strokeColor, strokeWidth, position = 1) {
        const item = new Konva.Rect({
            x: x,
            y: y,
            width: this.data.outlet.width,
            height: this.data.outlet.height,
            fill: fill,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            scaleX: position,
            name: 'outlet'
        })

        this.data.outlet.items.push(item)

        return item
    }


    plugIn(x, y, fill, strokeColor, strokeWidth, position = 1) {
        const item = new Konva.Group({
            x: x,
            y: y,
            width: this.data.plugin.width,
            height: this.data.plugin.height,
            scaleX: position,
            name: 'plugin'
        })

        item.add(new Konva.Rect({
            y: 8,
            width: 40,
            height: 16,
            stroke: '#dcdcdc',
            strokeWidth: strokeWidth,
            cornerRadius: [8, 0, 0, 8]
        }))

        item.add(new Konva.Rect({
            y: 36,
            width: 40,
            height: 16,
            stroke: '#dcdcdc',
            strokeWidth: strokeWidth,
            cornerRadius: [8, 0, 0, 8]
        }))

        item.add(new Konva.Rect({
            x: 40,
            width: item.width() - 40,
            height: item.height(),
            fill: fill,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            cornerRadius: [0, 28, 28, 0]
        }))


        return item
    }

    addEventListeners() {

    }

    destroy() {
    }
}