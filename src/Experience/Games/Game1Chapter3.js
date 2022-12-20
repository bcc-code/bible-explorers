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

            wrapper.append(canvas, playBTN)

            instance.modal = new Modal(wrapper.outerHTML, 'g1c3')
            instance.modal.htmlEl.prepend(title)

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


        // Objects

        function createLetter() {
            if (Math.random() < cloud.probability) {
                const cloudImage = new Image()

                cloudImage.onload = () => {

                    const cloud = new Konva.Image({
                        x: Math.random() < 0.5 ? 0 : stage.width(),
                        y: Math.random() * stage.height(),
                        image: cloudImage,
                        width: 100,
                        height: 50,
                        name: 'cloud',
                    })

                    const dX = center.x - cloud.x()
                    const dY = center.y - cloud.y()
                    const norm = Math.sqrt(dX ** 2 + dY ** 2)
                    // const speed = Math.random()

                    layer.add(cloud)
                }

                cloudImage.src = cloud.images[Math.floor(Math.random() * cloud.images.length)]
            }
        }



        const animation = new Konva.Animation(frame => {

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