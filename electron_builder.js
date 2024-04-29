// @ts-check
/**
 * @type {import('electron-builder').Configuration}
 */
const config = {
    appId: 'io.biblekids.explorers',
    productName: 'Bible-Explorers',
    files: ['!node_modules'],
    icon: './static/favicon.png',
    includeSubNodeModules: false,
    directories: {
        output: 'dist-app',
    },
    nsis: {
        artifactName:
            process.platform == 'win32'
                ? '${productName}-Setup-${version}.${ext}'
                : '${productName}-${version}.${ext}',
    },
    win: {
        target: 'nsis',
        publisherName: 'BCC MEDIA STI',
        legalTrademarks: '(C) 2024 BCC MEDIA STI',
    },
    mac: {
        category: 'public.app-category.game',
        entitlements: 'build/entitlements.mac.plist',
        icon: './static/favicon.icns',
        hardenedRuntime: true,
        darkModeSupport: true,
        gatekeeperAssess: true,
        target: [
            {
                target: 'default',
                arch: 'x64',
            },
            { target: 'default', arch: 'arm64' },
        ],
        notarize: {
            teamId: process.env.APPLE_TEAM_ID || '',
        },
    },
    linux: {
        category: 'Game',
        desktop: {
            Keywords: 'bcc;bible;explorers;brunstad;christian;church;edification;faith;media',
            SingleMainWindow: true,
            StartupWMClass: 'bible-explorers',
            MimeType: 'x-scheme-handler/bible-explorers',
        },
        target: ['AppImage', 'deb'],
    },
    deb: {
        packageName: 'bible-explorers',
        // For questions specific to the Debian package, users can e-mail me.
        // We don't have an author e-mail in the package.json, otherwise that one would be used.
        // For Debian packages such information is mandatory
        maintainer: 'bible-explorers.deb-ACvYJHQajj4ArT1JgO4osw@gmail.com',
        depends: ['libnotify4', 'libxtst6', 'libnss3'],
        recommends: [
            // Most XDG supporting desktop distros will use a trigger installed by this package to automatically register the URI scheme handling.
            // However, the app RUNs without it, and distros are free to provide a different mechanism (or let the user handle it manually).
            // Documentation states: (https://www.debian.org/doc/debian-policy/ch-relationships.html)
            // > This declares a strong, but not absolute, dependency.
            // > The Recommends field should list packages that would be found together with this one in all but unusual installations.
            'desktop-file-utils',
        ],
        packageCategory: 'game',
    },
    publish: [
        {
            provider: 'github',
            owner: 'bcc-code',
            repo: 'bible-explorers',
            releaseType: 'release',
        },
        {
            provider: 's3',
            bucket: 'bccm-static',
            path: 'explorers',
            acl: null,
        },
    ],
}

// To debug the auto update on Mac, you can right click on Bible-Explorers.app and "Show package contents".
// Then open Contents/MacOS/Bible-Explorers, which starts a terminal window with some logs and the Bible-Explorers app as well.
// The terminal window should give an error message telling you what went wrong.

module.exports = config
