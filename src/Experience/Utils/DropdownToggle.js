export default class DropdownToggle {
    constructor(toggleButton, dropdown) {
        this.toggleButton = toggleButton
        this.dropdown = dropdown
        this.init()
    }

    init() {
        this.bindEvents()
    }

    bindEvents() {
        // Toggle dropdown on button click
        this.toggleButton.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggleDropdown()
        })

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.toggleButton.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.closeDropdown()
            }
        })
    }

    toggleDropdown() {
        this.toggleButton.classList.toggle('active')
        this.dropdown.classList.toggle('is-visible')
        this.toggleAriaPressed()
    }

    closeDropdown() {
        this.toggleButton.classList.remove('active')
        this.dropdown.classList.remove('is-visible')
    }

    toggleAriaPressed() {
        let isPressed = this.toggleButton.getAttribute('aria-pressed') === 'true'
        this.toggleButton.setAttribute('aria-pressed', String(!isPressed))
    }
}
