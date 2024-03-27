module.exports = {
    packagerConfig: {
        icon: 'static/favicon',
    },
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'bcc-code',
                    name: 'bible-explorers',
                },
                prerelease: false,
                draft: false,
            },
        },
    ],
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
                        entry: 'preload/preload.js',
                        config: 'vite.preload.config.mjs',
                    },
                    {
                        entry: 'main/main.js',
                        config: 'vite.main.config.mjs',
                    },
                    {
                        entry: 'index.html',
                        config: 'vite.main.config.mjs',
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
