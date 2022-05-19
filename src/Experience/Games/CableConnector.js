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
                pattern: {
                    width: 50,
                    src: 'games/band.svg'
                }
            },
            default: {
                strokeWidth: 6,
            },
            outlet: {
                width: 40,
                height: 100,
                items: {
                    left: [],
                    right: []
                }
            },
            plug: {
                width: 106,
                height: 66,
                items: {
                    left: [],
                    right: []
                }
            },
            cords: [],
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
            ],
            colorNames: [
                'gray',
                'blue',
                'yellow',
                'pink',
                'purple'
            ]
        }
        instance = this

        this.init()
        this.createAllLayers()
    }

    createAllLayers() {
        this.layer = new Konva.Layer()

        const box = this.box(this.data.side.width, 0, this.data.box.width, this.data.box.height)
        const box_l = this.side("left", 0, 0, this.data.side.width, this.data.box.height)
        const box_r = this.side("right", this.wrapper.width(), 0, this.data.side.width, this.data.box.height)

        this.wrapper.add(box, box_l, box_r)

        const itemLength = 5
        const spaceLeftOutlets = box.height() - (this.data.outlet.height * itemLength)
        const spaceBetweenOutlets = spaceLeftOutlets / (itemLength + 1)

        const setY = (index) => spaceBetweenOutlets + index * (this.data.outlet.height + spaceBetweenOutlets)

        for (let i = 0; i < itemLength; i++) {

            // Add outlets
            const outlet_l = this.outlet('left', this.data.colorNames[i], 0, setY(i), this.data.colors[i], this.data.strokeColors[i])
            const outlet_r = this.outlet('right', this.data.colorNames[i], box.width(), setY(i), this.data.colors[i], this.data.strokeColors[i])

            // Add plugs
            const plug_l = this.plugIn('left', this.data.colorNames[i], 0, setY(i) + this.data.outlet.height / 2, this.data.colors[i], this.data.strokeColors[i],)
            const plug_r = this.plugIn('right', this.data.colorNames[i], box.width(), setY(i) + this.data.outlet.height / 2, this.data.colors[i], this.data.strokeColors[i])

            //Add cords
            const cord = this.cord(
                this.data.colorNames[i],
                this.data.strokeColors[i],
                this.data.plug.items.left[i].x() + this.data.plug.width, this.data.plug.items.left[i].y(),
                this.data.plug.items.right[i].x() - this.data.plug.width, this.data.plug.items.right[i].y()
            )

            box.add(cord, plug_l, plug_r, outlet_l, outlet_r)
        }

        this.data.plug.items.right.forEach(item => {
            item.draggable(true)
        })

        this.data.plug.items.right.forEach((item, index) => {
            const color = item.name().split(' ')[1]
            item.on('dragmove', () => {
                if (item.name().includes(color)) {
                    this.data.cords[index].attrs.points[2] = item.x() - item.width()
                    this.data.cords[index].attrs.points[3] = item.y()
                }
            })
        })

        this.layer.add(this.wrapper)
        this.stage.add(this.layer)
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

        this.wrapper = new Konva.Group({
            x: 100,
            y: 100,
            width: this.data.box.width,
            height: this.data.box.height,
        })

        document.body.classList.add('freeze')
    }


    box(x, y, w, h) {
        const item = new Konva.Group({
            x: x,
            y: y,
            width: w - this.data.side.width * 2,
            height: h,
            name: 'box'
        })

        item.add(new Konva.Rect({
            width: item.width(),
            height: item.height(),
            fillLinearGradientEndPointY: this.data.box.height,
            fillLinearGradientColorStops: this.data.box.gradientColor,
            stroke: this.data.box.strokeColor,
            strokeWidth: this.data.box.strokeWidth,
            shadowForStrokeEnabled: false,
            listening: false
        }))

        const icon = new Konva.Group({
            x: item.width() / 2,
            y: item.height() / 2,
        })

        icon.add(new Konva.RegularPolygon({
            sides: 3,
            radius: 200,
            fill: '#fbaf4e',
            stroke: 'black',
            strokeWidth: 20,
            shadowForStrokeEnabled: false,
            cornerRadius: 28,
            rotation: 20,
            opacity: 0.35,
            lineJoin: 'round',
            listening: false
        }))

        Konva.Image.fromURL('games/arrow.svg', image => {
            icon.add(image)
            image.setAttrs({
                width: 80,
                height: 200,
                offset: {
                    x: 33,
                    y: 120
                },
                opacity: 0.35
            })
        })

        item.add(icon)

        return item
    }
    side(position, x, y, w, h) {
        const item = new Konva.Group({
            x: x,
            y: y,
            width: w,
            height: h,
            listening: false,
            namne: 'side_' + position
        })

        item.add(new Konva.Rect({
            width: item.width(),
            height: item.height(),
            fillLinearGradientEndPointX: 300,
            fillLinearGradientColorStops: this.data.box.gradientColorSides,
            cornerRadius: [this.data.box.cornerRadius, 0, 0, this.data.box.cornerRadius],
            stroke: this.data.box.strokeColor,
            strokeWidth: this.data.box.strokeWidth,
            shadowForStrokeEnabled: false
        }))

        Konva.Image.fromURL(this.data.side.pattern.src, image => {
            item.add(image)
            image.setAttrs({
                x: this.data.side.width - this.data.side.pattern.width - this.data.box.strokeWidth / 2,
                y: this.data.box.strokeWidth / 2,
                width: this.data.side.pattern.width,
                height: item.height() - this.data.box.strokeWidth,
            })
        })

        if (position == "right") {
            item.scaleX(-1)
        }

        return item
    }
    outlet(position, color, x, y, fill, stroke) {
        const outlet = new Konva.Rect({
            x: x,
            y: y,
            width: this.data.outlet.width,
            height: this.data.outlet.height,
            fill: fill,
            stroke: stroke,
            strokeWidth: this.data.default.strokeWidth,
            shadowForStrokeEnabled: false,
            name: 'outlet_' + position + ' ' + color,
        })

        if (position == 'left') {
            this.data.outlet.items.left.push(outlet)
        } else {
            this.data.outlet.items.right.push(outlet)
            outlet.scaleX(-1)
        }

        return outlet
    }
    plugIn(position, color, x, y, fill, stroke) {
        const plug = new Konva.Group({
            x: x,
            y: y,
            width: this.data.plug.width,
            height: this.data.plug.height,
            name: 'plugin_' + position + ' ' + color,
            offset: {
                x: 0,
                y: this.data.plug.height / 2
            }
        })

        const pinHeight = plug.height() / 4

        for (let i = 0; i < 2; i++) {
            const pin = new Konva.Rect({
                y: i * pinHeight * 2,
                width: plug.width() / 2,
                height: pinHeight,
                stroke: '#dcdcdc',
                strokeWidth: this.data.default.strokeWidth,
                offset: {
                    x: - plug.width() / 4 + 10,
                    y: - pinHeight / 2
                },
                shadowForStrokeEnabled: false,
                cornerRadius: 8
            })
            plug.add(pin)
        }

        plug.add(new Konva.Rect({
            x: plug.width() / 2,
            width: plug.width() - 40,
            height: plug.height(),
            fill: fill,
            stroke: stroke,
            strokeWidth: this.data.default.strokeWidth,
            shadowForStrokeEnabled: false,
            cornerRadius: [0, 28, 28, 0]
        }))


        if (position == 'left') {
            this.data.plug.items.left.push(plug)
        } else {
            this.data.plug.items.right.push(plug)
            plug.scaleX(-1)
        }

        return plug
    }
    cord(color, fill, x1, y1, x2, y2) {
        const cord = new Konva.Line({
            points: [
                x1, y1,
                x2, y2
            ],
            stroke: fill,
            strokeWidth: this.data.default.strokeWidth,
            name: 'cord ' + color
        })

        this.data.cords.push(cord)
        return cord
    }

}