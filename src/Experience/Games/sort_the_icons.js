import Experience from '../Experience.js'

const canvas = document.createElement('canvas')
const c = canvas.getContext('2d')

let instance = null

export default class sortIcons {

    constructor() {
        this.experience = new Experience();
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera

        // Setup
        instance = this
        this.drag = false
        this.startX
        this.startY

        this._init()

        // Sortable
        const left = new Item(458, 700, 458, 700, "#fbaf4e", "#d27235", 10)
        const right = new Item(canvas.width - 458, 700, 458, 700, "#f65b98", "#b42c64", 10)
        const box = new Item(200, 200, 200, 200, "#0395e2", "#fff", 10)

        // an array of objects that define different sortable boxes
        this.sortable = []
        this.sortable.push(box)

        this.static = []
        this.static.push(left, right)
        // call to draw the scene
        this._draw()

        // Events
        canvas.addEventListener('mousedown', this._mouseDown, false)
        canvas.addEventListener('mouseup', this._mouseUp, false)
        canvas.addEventListener('mousemove', this._mouseMove, false)
    }

    _init() {
        canvas.classList.add('sort-game')
        canvas.width = this.sizes.width - 64
        canvas.height = this.sizes.height - 64

        document.body.appendChild(canvas)

        this.boundingBox = canvas.getBoundingClientRect()
        this.offsetX = this.boundingBox.left
        this.offsetY = this.boundingBox.top
    }

    // draw a single rect
    _rect(x, y, w, h) {
        c.beginPath()
        c.rect(x, y, w, h)
        c.closePath()
        c.stroke()
        c.fill()
    }

    // clear the canvas
    _clear() {
        c.clearRect(0, 0, canvas.width, canvas.height)
    }

    // redraw the scene
    _draw() {
        this._clear()

        const gradient = c.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2)
        gradient.addColorStop(0.1, 'rgba(62,48,109,1)');
        gradient.addColorStop(1, 'rgba(12,26,67,1)');

        c.fillStyle = gradient
        this._rect(0, 0, canvas.width, canvas.height)

        this.static.forEach((item) => {
            c.fillStyle = item.fill
            c.lineWidth = item.strokeWidth
            c.strokeStyle = item.strokeStyle
            this._rect(item.position.x, item.position.y, item.width, item.height)
        })

           // redraw each rect in the sortable[] array
           this.sortable.forEach((item) => {
            c.fillStyle = item.fill
            c.lineWidth = item.strokeWidth
            c.strokeStyle = item.strokeStyle
            this._rect(item.position.x, item.position.y, item.width, item.height)
        })
    }

    _mouseDown(e) {
        // tell the browser we're handling this mouse event
        e.preventDefault()
        e.stopPropagation()

        // get the current mouse position
        let mx = parseInt(e.clientX - instance.offsetX)
        let my = parseInt(e.clientY - instance.offsetY)

        // test each rect to see if mouse is inside
        instance.drag = false;

        instance.sortable.forEach((item) => {
            if (mx > item.position.x && mx < item.position.x + item.width && my > item.position.y && my < item.position.y + item.height) {
                // if yes, set that rects isDragging=true
                instance.drag = true
                item.isDragging = true
            }
        })

        // save the current mouse position
        instance.startX = mx
        instance.startY = my
    }

    _mouseUp(e) {
        // tell the browser we're handling this mouse event
        e.preventDefault()
        e.stopPropagation()

        // clear all the dragging flags
        instance.drag = false
        instance.sortable.forEach((item) => {
            item.isDragging = false
        })
    }

    _mouseMove(e) {
        // if we're dragging anything...

        if (instance.drag) {

            // tell the browser we're handling this mouse event
            e.preventDefault()
            e.stopPropagation()

            // get the current mouse position
            let mx = parseInt(e.clientX - instance.offsetX)
            let my = parseInt(e.clientY - instance.offsetY)

            // calculate the distance the mouse has moved
            // since the last mousemove
            let dx = mx - instance.startX
            let dy = my - instance.startY

            // move each rect that isDragging
            // by the distance the mouse has moved
            // since the last mousemove

            instance.sortable.forEach((item) => {
                if (item.isDragging) {
                    item.position.x += dx
                    item.position.y += dy
                }
            })

            // redraw the scene with the new rect positions
            instance._draw();

            // save the current mouse position
            instance.startX = mx
            instance.startY = my
        }
    }

}


class Item {
    constructor(x, y, w, h, fill, strokeC, strokeW) {
        this.position = {
            x: x - w / 2,
            y: y - h / 2
        }
        this.width = w
        this.height = h
        this.fill = fill
        this.strokeWidth = strokeW
        this.strokeStyle = strokeC
        this.isDragging = false
    }

    draw() {
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
        c.fillStyle = this.fill
        c.lineWidth = this.strokeWidth
        c.strokeStyle = this.strokeStyle
    }
}



