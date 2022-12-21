import Konva from 'konva'
import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class Game1Chapter3 {

    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world

        instance = this
        instance.init()
    }

    init() {

        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        } else {

            const wrapper = document.createElement('div')
            wrapper.classList.add('g1c3_wrapper')

            const canvas = document.createElement('div')
            canvas.setAttribute('id', 'g1c3_canvas')

            const title = document.createElement('h3')
            title.className = 'modal__heading--minigame'
            title.innerText = 'Game 1'

            const playBTN = document.createElement('button')
            playBTN.setAttribute('id', 'g1c3_play')
            playBTN.innerText = 'Play game'

            const pauseBTN = document.createElement('button')
            pauseBTN.setAttribute('id', 'g1c3_pause')
            pauseBTN.innerText = 'Pause game'

            wrapper.append(canvas, playBTN, pauseBTN)

            instance.modal = new Modal(wrapper.outerHTML, 'g1c3')
            instance.modal.htmlEl.prepend(title)
            instance.modal.htmlEl.querySelector('.modal__close').style.display = 'none'

            instance.draw()

        }
    }

    draw() {
        const stage = new Konva.Stage({
            container: '#g1c3_canvas',
            width: 1024,
            height: 800
        })

        const layer = new Konva.Layer()

        stage.add(layer)
        stage.container().style.border = '1px solid white'

        // Heart

        const center = {
            x: stage.width() / 2,
            y: stage.height() / 2
        }

        const heartImage = new Image()

        heartImage.onload = () => {
            const heart = new Konva.Image({
                x: center.x,
                y: center.y,
                image: heartImage,
                width: 150,
                height: 150,
                id: 'heart'
            })

            heart.offsetX(heart.width() / 2)
            heart.offsetY(heart.height() / 2)

            layer.add(heart)
        }

        heartImage.src = 'assets/heart.png'


        const cloud = {
            highestSpeed: 1.6,
            lowestSpeed: 0.6,
            probability: 0.02,
            images: [
                'assets/cloud1.png',
                'assets/cloud2.png',
                'assets/cloud3.png',
                'assets/cloud4.png',
                'assets/cloud5.png'
            ]
        }

        let clouds = []

        const generateRandomNumber = (min, max) => {
            return min + Math.random() * (max - min);
        }

        const isIntersectingRectangleWithCircle = (rect, width, height, circle, radius) => {
            const distX = Math.abs(circle.x - rect.x - width / 2);
            const distY = Math.abs(circle.y - rect.y - height / 2);
            if (distX > (width / 2 + radius) || distY > (height / 2 + radius)) {
                return false;
            }
            if (distX <= (width / 2) || distY <= (height / 2)) {
                return true;
            }
            const dX = distX - width / 2;
            const dY = distY - height / 2;
            return dX ** 2 + dY ** 2 <= radius ** 2;
        }

        // Objects

        function createCloud() {
            if (Math.random() < cloud.probability) {
                const cloudImage = new Image()

                const x = Math.random() * stage.width()
                const y = Math.random() * stage.height()
                const dX = center.x - x
                const dY = center.y - y
                const norm = Math.sqrt(dX ** 2 + dY ** 2)
                const speed = generateRandomNumber(cloud.lowestSpeed, cloud.highestSpeed)

                cloudImage.onload = () => {
                    const cloud = new Konva.Image({
                        x: x,
                        y: y,
                        image: cloudImage,
                        width: 100,
                        height: 50,
                        name: 'cloud',
                    })
                    layer.add(cloud)

                    clouds.push({
                        item: cloud,
                        speedX: dX / norm * speed,
                        speedY: dY / norm * speed,
                    })
                }

                cloudImage.src = cloud.images[Math.floor(Math.random() * cloud.images.length)]
            }
        }

        function removeCloud(frames) {
            for (const c of clouds) {
                // if (isIntersectingRectangleWithCircle({ x: c.item.x(), y: c.item.y() - c.item.height() }, c.item.width(), c.item.height(), center, 0)) { 

                // c.item.x(c.speedX + frames)
                // c.item.y(c.speedY + frames)
                // }
            }
        }


        const animation = new Konva.Animation(frames => {
            createCloud()
            removeCloud(frames)
        })

        document.getElementById('g1c3_play').addEventListener('click', () => {
            this.experience.gameIsOn = true
            animation.start()
        })

        document.getElementById('g1c3_pause').addEventListener('click', () => {
            this.experience.gameIsOn = false
            animation.stop()
        })



        // document.getElementById('g1c3_play').addEventListener('click', () => {

        //     const heart = stage.find('#heart')
        //     const clouds = stage.find('.cloud')

        //     const animation = new Konva.Animation((frame) => {
        //         clouds.forEach(c => {

        //         }, layer)
        //     })

        //     animation.start()


        // })

    }

}