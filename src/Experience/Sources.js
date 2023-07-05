export default [
    {
        name: 'cubeMap',
        type: 'cubeTexture',
        path: [
            'textures/cubeMap/C_Left_v2.png',
            'textures/cubeMap/C_Right_v2.png',
            'textures/cubeMap/C_Top_v2.png',
            'textures/cubeMap/C_Down_v2.png',
            'textures/cubeMap/C_Back_v2.png',
            'textures/cubeMap/C_Front_v2.png'
        ]
    },
    {
        name: 'controlRoom',
        type: 'gltfModel',
        path: 'models/Controlroom.glb'
    },
    {
        name: 'baked',
        type: 'texture',
        path: 'textures/baking_v6.png'
    },
    {
        name: 'screen_default',
        type: 'texture',
        path: 'textures/screen_default.jpg'
    },
    {
        name: 'map',
        type: 'videoTexture',
        path: 'textures/map_v2.mp4'
    },
    {
        name: 'codes',
        type: 'videoTexture',
        path: 'textures/codes_v2.mp4'
    },
    {
        name: 'iris',
        type: 'videoTexture',
        path: 'textures/iris_idle_v3.mp4'
    },
    {
        name: 'hud',
        type: 'videoTexture',
        path: 'textures/screen_hud_v2.mp4'
    },
    // Maze game
    {
        name: 'glitch',
        type: 'gltfModel',
        path: 'games/maze/GLITCH_LowPoly_v05.gltf'
    },
    {
        name: 'glitch_baked',
        type: 'texture',
        path: 'games/maze/glitch_v02.jpg'
    },
    {
        name: 'maze_wall',
        type: 'texture',
        path: 'games/maze/brick.png'
    },
    {
        name: 'maze_floor',
        type: 'texture',
        path: 'games/maze/concrete.png'
    },
]