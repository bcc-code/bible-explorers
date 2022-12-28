import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import gsap from 'gsap'

let dialog = null

export default class Dialog {
    constructor() {
        this.experience = new Experience()
        dialog = this
    }

    toggleDialog() {
        if (document.querySelector('.modal__dialog')) {
            dialog.modal.destroy()
        }
        else {
            let world = this.experience.world
            let debug = this.experience.debug
            dialog.program = world.program
            let data = dialog.program.getCurrentStepData()

            let chatHTML =
                `<section class="chat">
                    <header class="chat_header">
                        <span class="chat_online">Online</span>
                    </header>
                    <article class="chat_content">
                        <div class="chat_message welcome">
                            <img src="games/profile.png"/>
                            <p>Hei Explorers, do you have any questions?</p>
                        </div>
                    </article>
                    <footer class="chat_footer">`
            data.dialog.forEach(item => {
                chatHTML += `<button type="button">${item.question}</button>`
            })
            chatHTML += `</footer>
                </section>`

            dialog.modal = new Modal(chatHTML, 'modal_chat')

            const close = document.querySelector(".modal__close ")
            close.style.display = 'none'

            const back = document.getElementById("back")
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', (e) => {
                dialog.modal.destroy()
                dialog.program.previousStep()
            })

            const next = document.getElementById('continue')
            next.style.display = 'block'
            next.innerText = _s.task.next
            next.addEventListener('click', dialog.completeDialog)

            const chatButttons = document.querySelectorAll('.chat_footer button')
            const chatContent = document.querySelector('.chat_content')


            chatButttons.forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    const question = document.createElement('div')
                    question.classList.add('chat_message', 'user')
                    question.innerHTML = `<p>${data.dialog[index].question}</p>`

                    const reply = document.createElement('div')
                    reply.classList.add('chat_message', 'iris')
                    reply.innerHTML = `<img src="games/profile.png"/><p></p>`
                    chatContent.append(question, reply)

                    const messages = document.querySelectorAll('.chat_message.iris p')

                    gsap.to(messages[messages.length - 1], {
                        duration: 2,
                        onStart() {
                            this.targets(0)[0].innerHTML = '<div class="typing"><span></span><span></span><span></span></div>'
                        },
                        onComplete() {
                            this.targets(0)[0].innerHTML = data.dialog[index].answer
                        },
                    })

                    btn.remove()

                })
            })


        }
    }

    completeDialog() {
        dialog.modal.destroy()
        dialog.program.nextStep()
    }
}