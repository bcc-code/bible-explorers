import Experience from '../Experience.js'
import Konva from 'konva'
import _s from '../Utils/Strings.js'
import Modal from '../Utils/Modal.js'

let instance = null

export default class CableConnector {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.sizes = this.experience.sizes

        instance = this

        this.color = {
            name: [
                'gray',
                'blue',
                'yellow',
                'pink',
                'purple'
            ],
            hex: [
                "#989898",
                "#373e93",
                "#f9c662",
                "#ff6ea9",
                "#af4eaa"
            ],
            stroke: [
                "#878787",
                "#23307a",
                "#fcb04e",
                "#f75b99",
                "#9f4096",
            ]
        }

        this.cables = []
        this.outlets = {
            items: [],
            left: [],
            right: []
        }

        this.init()
        this.setup()
        this.addEventListeners()
    }

    setup() {

        const layer = new Konva.Layer()

        const container = new Container({
            x: 300,
            y: 200,
            width: this.sizes.width - 600,
            height: this.sizes.height - 400
        })

        layer.add(container._draw())

        const itemsLength = 5

        const outletWidth = 40
        const outletHeight = 100

        const spaceLeft = container.height - (outletHeight * itemsLength)
        const spaceBetween = spaceLeft / (itemsLength + 1)
        const setY = (index) => spaceBetween + index * (outletHeight + spaceBetween)

        for (let i = 0; i < itemsLength; i++) {

            const cable = new Cable({
                color: this.color.name[i],
                x: container.sideWidth + outletWidth + 10,
                y: setY(i),
                width: 600,
                height: 200,
                fill: this.color.hex[i],
                stroke: this.color.stroke[i]
            })

            const outlet_l = new Outlet({
                color: this.color.name[i],
                x: container.sideWidth,
                y: setY(i),
                width: outletWidth,
                height: outletHeight,
                fill: this.color.hex[i],
                stroke: this.color.stroke[i]
            })

            const outlet_r = new Outlet({
                color: this.color.name[i],
                x: container.width - container.sideWidth,
                y: setY(i),
                width: outletWidth,
                height: outletHeight,
                fill: this.color.hex[i],
                stroke: this.color.stroke[i]
            })

            outlet_l.item.cache()
            outlet_r.item.cache()

            this.cables.push(cable)
            this.outlets.left.push(outlet_l)
            this.outlets.right.push(outlet_r)
            this.outlets.items.push(outlet_l, outlet_r)

            container.item.add(cable._draw())
            container.item.add(outlet_l._draw())
            container.item.add(outlet_r._draw().scaleX(-1))
        }

        this.cables.forEach((cable) => {

            cable.item.zIndex(2)
            cable.item.children.forEach(item => {
                item.on('dragmove', () => {
                    const cord = cable.item.children.find(cord => cord.name() === "cord")

                    if (item.name() === "plug_left") {
                        cord.points()[0] = item.x() + item.width() / 2
                        cord.points()[1] = item.y() + 30
                    } else if (item.name() === "plug_right") {
                        cord.points()[4] = item.x() - item.width() / 2
                        cord.points()[5] = item.y() + 30
                    }
                })
            })
        })

        this.stage.add(layer)
    }

    init() {
        const gameWrapper = document.createElement('div')
        gameWrapper.setAttribute("id", "cable-connector")
        gameWrapper.classList.add('miniGame')
        document.body.appendChild(gameWrapper)

        const title = document.createElement('div')
        title.classList.add('game__title')
        title.innerHTML = "<h1>" + _s.miniGames.cableConnect.title + "</h1>"


        const actions = document.createElement('div')
        actions.classList.add('miniGame__actions')

        this.stage = new Konva.Stage({
            container: 'cable-connector',
            width: this.sizes.width,
            height: this.sizes.height,
        })

        const resetBtn = this.addButton('button__reset', 'button__default', _s.miniGames.reset)
        const backBtn = this.addButton('button__back', 'button__default', _s.journey.back)


        gameWrapper.appendChild(title)
        gameWrapper.appendChild(actions)

        actions.appendChild(backBtn)
        actions.appendChild(resetBtn)

        document.body.classList.add('freeze')
    }

    addEventListeners() {
        const buttons = document.querySelectorAll('.miniGame .button')

        buttons.forEach(button => {
            if (button.classList.contains('button__reset')) {
                button.addEventListener('click', () => {
                    // do something
                })
            }

            if (button.classList.contains('button__back')) {
                button.addEventListener('click', () => {
                    // do something
                    instance.destroy()
                })
            }
        })
    }

    addButton(name, background, label) {
        const button = document.createElement('div')
        button.className = "button " + background + ' ' + name
        button.innerHTML = "<span>" + label + "</span>"

        return button
    }

    toggleGameComplete() {
        let html = `
            <div class="modal__content congrats congrats__miniGame">
                <div class="congrats__container">
                    <div class="congrats__title"><i class="icon icon-star-solid"></i><i class="icon icon-star-solid"></i><h1>${_s.miniGames.cableConnect.completed.title}</h1><i class="icon icon-star-solid"></i><i class="icon icon-star-solid"></i></div>
                    <div class="congrats__chapter-completed">${_s.miniGames.cableConnect.completed.message}!</div>
                    <div id="continue_journey" class="button button__goToTask"><span>${_s.miniGames.continue}</span></div>
                </div>
            </div>
        `

        instance.modal = new Modal(html)
    }

    destroy() {
        document.getElementById('cable-connector').remove()
        document.body.classList.remove('freeze')
    }

}

class Container {
    constructor({ x, y, width, height }) {
        this.position = { x, y }
        this.width = width
        this.height = height
        this.stroke = "#cbcbcb"
        this.strokeWidth = 10
        this.radius = 30
        this.sideWidth = 300

        this.outlet = {
            width: 40,
            height: 100,
        }
    }

    _draw() {
        this.item = new Konva.Group({
            x: this.position.x,
            y: this.position.y
        })

        this.item.add(this._bg())
        this.item.add(this._icon())
        this.item.add(this._side({ x: 0, y: 0 }))
        this.item.add(this._side({ x: this.width, y: 0 }).scaleX(-1))

        return this.item
    }

    _bg() {
        const background = new Konva.Rect({
            width: this.width,
            height: this.height,
            fillLinearGradientEndPointY: this.height,
            fillLinearGradientColorStops: [
                0, '#1a1a1a',
                1, '#4d4d4d'
            ],
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
            cornerRadius: this.radius,
            name: 'side',
            listening: false
        })

        return background
    }

    _icon() {
        const icon = new Konva.Group({
            x: this.width / 2,
            y: this.height / 2,
            listening: false
        })

        icon.add(new Konva.RegularPolygon({
            sides: 3,
            radius: 200,
            fill: '#fbaf4e',
            stroke: 'black',
            strokeWidth: this.strokeWidth * 2,
            cornerRadius: this.radius,
            rotation: 20,
            opacity: 0.35,
            lineJoin: 'round',
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

        return icon
    }

    _side({ x, y }) {
        const side = new Konva.Group({
            x: x,
            y: y,
            listening: false
        })

        side.add(new Konva.Rect({
            width: this.sideWidth,
            height: this.height,
            fillLinearGradientEndPointX: this.sideWidth,
            fillLinearGradientColorStops: [
                0, '#989898',
                1, '#666666'
            ],
            cornerRadius: [this.radius, 0, 0, this.radius],
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
        }))

        Konva.Image.fromURL('games/band.svg', image => {
            side.add(image)
            image.setAttrs({
                x: 250 - this.strokeWidth / 2,
                y: this.strokeWidth / 2,
                width: 50,
                height: this.height - this.strokeWidth,
            })
        })

        return side
    }
}

class Outlet {
    constructor({ color, x, y, width, height, fill, stroke }) {
        this.color = color
        this.position = { x, y }
        this.width = width
        this.height = height
        this.fill = fill
        this.stroke = stroke
        this.strokeWidth = 10
        this.item = this._draw()
    }

    _draw() {
        const outlet = new Konva.Rect({
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height,
            fill: this.fill,
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
            offset: {
                x: -this.strokeWidth
            }
        })

        return outlet
    }
}

class Cable {
    constructor({ color, x, y, width, height, fill, stroke }) {
        this.color = color
        this.position = { x, y }
        this.width = width
        this.height = height
        this.fill = fill
        this.stroke = stroke
        this.strokeWidth = 10

        this.plug = {
            width: 60,
            height: 60,
            radius: 30
        }

        this.pin = {
            width: 40,
            height: 10,
            radius: 5,
        }

        this.item = null
    }

    _draw() {
        const cable = new Konva.Group({
            x: this.position.x,
            y: this.position.y,
        })

        const plug_l = this._plug({ x: 0, y: 0 }, "left")
        const plug_r = this._plug({ x: this.width, y: 0 }, "right").scaleX(-1)

        const cord = this._cord(
            [
                plug_l.x() + this.plug.width, this.plug.height / 2,
                (plug_l.x() + plug_r.x()) / 2, this.plug.height / 2,
                plug_r.x() - this.plug.width, this.plug.height / 2
            ]
        )

        this.item = cable
        cable.add(cord, plug_l, plug_r)
        return cable
    }

    _plug({ x, y }, position) {
        const plug = new Konva.Group({
            x,
            y,
            width: 100,
            height: 100,
            draggable: true,
            name: 'plug_' + position
        })

        plug.add(new Konva.Rect({
            x: -this.pin.width,
            y: 10,
            width: this.pin.width,
            height: this.pin.height,
            stroke: "#dcdcdc",
            strokeWidth: this.strokeWidth,
            cornerRadius: [this.pin.radius, 0, 0, this.pin.radius]
        }))

        plug.add(new Konva.Rect({
            x: -this.pin.width,
            y: 40,
            width: this.pin.width,
            height: this.pin.height,
            stroke: "#dcdcdc",
            strokeWidth: this.strokeWidth,
            cornerRadius: [this.pin.radius, 0, 0, this.pin.radius]
        }))

        plug.add(new Konva.Rect({
            width: this.plug.width,
            height: this.plug.height,
            fill: this.fill,
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
            cornerRadius: [0, this.plug.radius, this.plug.radius, 0]
        }))


        return plug
    }

    _cord(points) {
        const cord = new Konva.Line({
            points,
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
            tension: 1,
            name: 'cord'
        })
        return cord
    }


}

