export default [
    {
        name: 'controlRoom',
        type: 'gltfModel',
        path: 'models/controlroom.glb'
    },
    {
        name: 'UVChecker',
        type: 'texture',
        path: 'textures/UV_checker_Map_byValle.jpg'
    },
    {
        name: 'screen_16x10',
        type: 'texture',
        path: 'textures/screen-16x10.png'
    },

    {
        name: 'screen_16x9_5',
        type: 'texture',
        path: 'textures/screen-16x9_5.png'
    },
    {
        name: 'environmentMapTexture',
        type: 'cubeTexture',
        path: [
            'textures/envMap/px-min.png',
            'textures/envMap/nx-min.png',
            'textures/envMap/py-min.png',
            'textures/envMap/ny-min.png',
            'textures/envMap/pz-min.png',
            'textures/envMap/nz-min.png'
        ]
    }
]