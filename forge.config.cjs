module.exports = {
    packagerConfig: {
        icon: 'static/favicon',
    },
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                iconUrl: 'https://explorers.biblekids.io/favicon.ico',
                setupIcon: 'static/favicon.ico',
            },
        },
        {
            name: '@electron-forge/maker-dmg',
            config: {
                icon: 'static/favicon.icns',
            },
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                options: {
                    icon: 'static/favicon.png',
                },
            },
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-vite',
            config: {
                build: [
                    {
                        entry: 'index.html',
                        config: 'vite.main.config.mjs',
                    },
                    {
                        entry: 'main.js',
                        config: 'vite.main.config.mjs',
                    },
                    {
                        entry: 'preload.js',
                        config: 'vite.preload.config.mjs',
                    },
                ],
                renderer: [
                    {
                        name: 'main_window',
                        config: 'vite.renderer.config.mjs',
                    },
                ],
            },
        },
    ],
}
