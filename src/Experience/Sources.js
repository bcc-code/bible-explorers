export default [
    {
        name: 'cubeMap',
        type: 'cubeTexture',
        path: [
            'textures/envMap/C_Right.png',
            'textures/envMap/C_Left.png',
            'textures/envMap/C_Top.png',
            'textures/envMap/C_Down.png',
            'textures/envMap/C_Back.png',
            'textures/envMap/C_Front.png'
        ]
    },
    {
        name: 'controlRoom',
        type: 'gltfModel',
        path: 'models/Controlroom_lowmodel_1.glb'
    },
    {
        name: 'baked',
        type: 'texture',
        path: 'textures/Baking_v05.png'
    },
    {
        name: 'screen_default',
        type: 'texture',
        path: 'textures/screen_default.jpg'
    },
    {
        name: 'map',
        type: 'videoTexture',
        path: 'textures/map.mp4'
    },
    {
        name: 'codes',
        type: 'videoTexture',
        path: 'textures/codes.mp4'
    },
    {
        name: 'iris',
        type: 'videoTexture',
        path: 'textures/iris.mp4'
    },
    {
        name: 'hud',
        type: 'videoTexture',
        path: 'textures/screen_hud.mp4'
    }
]