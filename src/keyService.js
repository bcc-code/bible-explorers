import { safeStorage } from 'electron'
import Store from 'electron-store'

const store = new Store({
    name: 'bible-explorers',
    watch: true,
    encryptionKey: '12uhpf2u13hr9713gr',
})

export default {
    setToken(key, token) {
        const buffer = safeStorage.encryptString(token)
        store.set(key, buffer.toString('latin1'))
    },

    deleteToken(key) {
        store.delete(key)
    },

    getToken(key) {
        return safeStorage.decryptString(Buffer.from(store.get(key), 'latin1'))
    },
}
