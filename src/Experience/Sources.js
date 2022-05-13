export default [
    {
        name: 'environmentMap',
        type: 'cubeTexture',
        path: [
            'textures/envMap/px-min.png',
            'textures/envMap/nx-min.png',
            'textures/envMap/py-min.png',
            'textures/envMap/ny-min.png',
            'textures/envMap/pz-min.png',
            'textures/envMap/nz-min.png'
        ]
    },
    {
        name: 'controlRoom',
        type: 'gltfModel',
        path: 'models/Controlroom_low_v11.glb'
    },
    {
        name: 'baked',
        type: 'texture',
        path: 'textures/baked_v4.jpg'
    },
    {
        name: 'screen_default',
        type: 'texture',
        path: 'textures/screen_default.jpg'
    },
    {
        name: 'map',
        type: 'videoTexture',
        path: 'textures/map.webm'
    },
    {
        name: 'codes',
        type: 'videoTexture',
        path: 'textures/codes.webm'
    },
    {
        name: 'iris',
        type: 'videoTexture',
        path: 'textures/iris.mp4'
    }
]