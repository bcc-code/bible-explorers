export default [
    {
        name: 'controlRoom',
        type: 'gltfModel',
        path: 'models/controlroom_low_v04.glb'
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
        path: 'textures/BIEX_S01_E01_IRIS_SLEEP.webm'
    },
    {
        name: 'BIEX_S01_E01_IRIS_READY',
        type: 'videoTexture',
        path: 'textures/BIEX_S01_E01_IRIS_READY.webm'
    },
    {
        name: 'BIEX_S01_E01_IRIS_SPEAK',
        type: 'videoTexture',
        path: 'textures/BIEX_S01_E01_IRIS_SPEAK.webm'
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
    }
]