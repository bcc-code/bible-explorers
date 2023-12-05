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
      'textures/cubeMap/C_Front_v2.png',
    ],
  },
  {
    name: 'controlRoom',
    type: 'gltfModel',
    path: 'models/ControlRoom-new.gltf',
  },
  {
    name: 'baked',
    type: 'texture',
    path: 'textures/baking_v6.png',
  },
  {
    name: 'screen_default',
    type: 'texture',
    path: 'textures/screen_default.jpg',
  },
  {
    name: 'map_default',
    type: 'texture',
    path: 'textures/map_default.jpg',
  },
  {
    name: 'code_default',
    type: 'texture',
    path: 'textures/code_default.jpg',
  },
  {
    name: 'iris',
    type: 'videoTexture',
    path: 'textures/iris_idle_v3.mp4',
  },
  {
    name: 'screen_hud',
    type: 'texture',
    path: 'textures/screen_hud.jpg',
  },
  // Maze game
  {
    name: 'glitch',
    type: 'gltfModel',
    path: 'games/maze/GLITCH_LowPoly_v05.gltf',
  },
  {
    name: 'glitch_baked',
    type: 'texture',
    path: 'games/maze/glitch_v02.jpg',
  },
  {
    name: 'cubeMapTop',
    type: 'texture',
    path: 'games/maze/cubeMap/c_top.png',
  },
  {
    name: 'cubeMapSide',
    type: 'texture',
    path: 'games/maze/cubeMap/c_side.png',
  },
  {
    name: 'floor',
    type: 'texture',
    path: 'games/maze/TexturesCom_OutdoorFloor4_512_albedo.png',
  },
  {
    name: 'mazeBox',
    type: 'gltfModel',
    path: 'games/maze/BibleBox_OpenAnimation.gltf',
  },
  {
    name: 'mazeBoxBaked',
    type: 'texture',
    path: 'games/maze/BibleBoxTexture_Baked_V02.png',
  },
  {
    name: 'instructions',
    type: 'texture',
    path: 'games/maze/instructions.png',
  },
];
