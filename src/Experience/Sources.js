export default [
    {
        name: 'controlRoom',
        type: 'gltfModel',
        path: 'models/controlroom.glb'
    },
    {
        name: 'cameraModel',
        type: 'gltfModel',
        path: 'models/camera.glb'
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
        name: 'matcap',
        type: 'texture',
        path: 'matcaps/matcap2.png'
    },
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
        name: 'BIEX_S01_E01_IRIS_SLEEP',
        type: 'videoTexture',
        path: 'textures/BIEX_S01_E01_IRIS_SLEEP.mp4'
    },
    {
        name: 'BIEX_S01_E01_IRIS_READY',
        type: 'videoTexture',
        path: 'textures/BIEX_S01_E01_IRIS_READY.mp4'
    },
    {
        name: 'BIEX_S01_E01_IRIS_SPEAK',
        type: 'videoTexture',
        path: 'textures/BIEX_S01_E01_IRIS_SPEAK.mp4'
    }
]