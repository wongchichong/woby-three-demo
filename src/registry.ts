import type { JSX } from 'woby'

export interface DemoEntry {
    id: string
    name: string
    category: string
    component: () => Promise<{ default: () => JSX.Element }>
    thumbnail?: string
}

export interface CategoryEntry {
    id: string
    name: string
    demos: DemoEntry[]
}

export const categories: CategoryEntry[] = [
    {
        id: 'basics',
        name: 'Basics',
        demos: [
            { id: 'webgl_plane', name: 'Plane', category: 'basics', component: () => import('./Plane') },
            { id: 'webgl_boxes', name: '3 Boxes + Click', category: 'basics', component: () => import('./Box3') },
            { id: 'webgl_boxes_click', name: 'Boxes + Click', category: 'basics', component: () => import('./Box2Click') },
            { id: 'webgl_static_text', name: 'Box + Static Text', category: 'basics', component: () => import('./BoxStaticText') },
            { id: 'webgl_html_text', name: 'Box + HTML Text', category: 'basics', component: () => import('./BoxHtmlText') },
            { id: 'webgl_group', name: 'Group', category: 'basics', component: () => import('./group') },
            { id: 'webgl_object3d', name: 'Object3D Add', category: 'basics', component: () => import('./Object3dAdd') },
        ]
    },
    {
        id: 'lines',
        name: 'Lines',
        demos: [
            { id: 'webgl_simple_line', name: 'Simple Line', category: 'lines', component: () => import('./SimpleLine') },
            { id: 'webgl_fat_lines', name: 'Fat Lines', category: 'lines', component: () => import('./FatLines') },
            { id: 'webgl_line3', name: 'Line Segments', category: 'lines', component: () => import('./Line3') },
            { id: 'webgl_d_lines', name: 'D Lines', category: 'lines', component: () => import('./DLine') },
            { id: 'webgl_fat_lines_advanced', name: 'Fat Lines Advanced', category: 'lines', component: () => import('./WebGLFatLines') },
            { id: 'webgl_lines', name: 'Lines', category: 'lines', component: () => import('./WebGLLines') },
            { id: 'webgl_lines_dashed', name: 'Dashed Lines', category: 'lines', component: () => import('./WebGLLinesDashed') },
        ]
    },
    {
        id: 'effects',
        name: 'Effects',
        demos: [
            { id: 'webgl_effects_anaglyph', name: 'Anaglyph', category: 'effects', component: () => import('./WebGLEffectsAnaglyph') },
            { id: 'webgl_effects_stereo', name: 'Stereo', category: 'effects', component: () => import('./WebGLEffectsStereo') },
            { id: 'webgl_effects_stereo2', name: 'Stereo 2', category: 'effects', component: () => import('./WebGLEffectsStereo2') },
            { id: 'webgl_effects_stereo3', name: 'Stereo 3', category: 'effects', component: () => import('./WebGLEffectsStereo3') },
            { id: 'webgl_effects_parallaxbarrier', name: 'Parallax Barrier', category: 'effects', component: () => import('./WebGLEffectsParallaxBarrier') },
            { id: 'webgl_effects_ascii', name: 'ASCII Effect', category: 'effects', component: () => import('./WebGLEffectsAscii') },
        ]
    },
    {
        id: 'animation',
        name: 'Animation',
        demos: [
            { id: 'webgl_animation_keyframe', name: 'Animation Keyframe', category: 'animation', component: () => import('./AnimationKeyframe') },
            { id: 'webgl_animation_particles', name: 'Animation Particles', category: 'animation', component: () => import('./AnimationParticles') },
            { id: 'webgl_animation_keyframes', name: 'Animation Keyframes', category: 'animation', component: () => import('./AnimationKeyframes') },
            { id: 'webgl_animation_skinning', name: 'Animation Skinning', category: 'animation', component: () => import('./AnimationSkinning') },
            { id: 'webgl_morph_targets', name: 'Morph Targets', category: 'animation', component: () => import('./WebGLMorphTargets') },
            { id: 'webgl_animation_skinning_blending', name: 'Skinning Blending', category: 'animation', component: () => import('./WebGLAnimationSkinningBlending') },
        ]
    },
    {
        id: 'geometries',
        name: 'Geometries',
        demos: [
            { id: 'webgl_geometries', name: 'All Geometries', category: 'geometries', component: () => import('./Geometries') },
            { id: 'webgl_text_geometry', name: 'Text Geometry', category: 'geometries', component: () => import('./TextGeometry') },
            { id: 'webgl_geometry_cube', name: 'Geometry Cube', category: 'geometries', component: () => import('./WebGLGeometryCube') },
            { id: 'webgl_geometries_showcase', name: 'All Geometries Showcase', category: 'geometries', component: () => import('./WebGLGeometries') },
            { id: 'webgl_geometry_shapes', name: 'Geometry Shapes', category: 'geometries', component: () => import('./WebGLGeometryShapes') },
            { id: 'webgl_geometry_cube2', name: 'Simple Cube', category: 'geometries', component: () => import('./WebGLGeometryCube2') },
            { id: 'webgl_geometry_lathe', name: 'Geometry Lathe', category: 'geometries', component: () => import('./WebGLGeometryLathe') },
            { id: 'webgl_geometry_teapot', name: 'Utah Teapot', category: 'geometries', component: () => import('./WebGLGeometryTeapot') },
            { id: 'webgl_geometry_convex', name: 'Convex Geometry', category: 'geometries', component: () => import('./WebGLGeometryConvex') },
            { id: 'webgl_geometry_extrude_shapes', name: 'Extrude Shapes', category: 'geometries', component: () => import('./WebGLGeometryExtrudeShapes') },
            { id: 'webgl_geometry_csg', name: 'CSG Geometry', category: 'geometries', component: () => import('./WebGLGeometryCSG') },
            { id: 'webgl_geometry_colors', name: 'Vertex Colors', category: 'geometries', component: () => import('./WebGLGeometryColors') },
            { id: 'webgl_geometry_colors_lut', name: 'Color Lookup Table', category: 'geometries', component: () => import('./WebGLGeometryColorsLookuptable') },
            { id: 'webgl_geometry_minecraft', name: 'Minecraft Terrain', category: 'geometries', component: () => import('./WebGLGeometryMinecraft') },
            { id: 'webgl_geometry_spline_editor', name: 'Spline Editor', category: 'geometries', component: () => import('./WebGLGeometrySplineEditor') },
            { id: 'webgl_geometry_text_stroke', name: 'Text Stroke', category: 'geometries', component: () => import('./WebGLGeometryTextStroke') },
        ]
    },
    {
        id: 'materials',
        name: 'Materials',
        demos: [
            { id: 'webgl_materials', name: 'Physical Materials', category: 'materials', component: () => import('./Materials') },
            { id: 'webgl_materials_all', name: 'All Materials', category: 'materials', component: () => import('./WebGLMaterials') },
            { id: 'webgl_materials_physical', name: 'Physical Materials Advanced', category: 'materials', component: () => import('./WebGLMaterialsPhysical') },
            { id: 'webgl_materials_normal', name: 'Normal Materials', category: 'materials', component: () => import('./WebGLMaterialsNormal') },
            { id: 'webgl_materials_colors', name: 'Material Colors', category: 'materials', component: () => import('./WebGLMaterialsColors') },
            { id: 'webgl_materials_transparency', name: 'Transparency', category: 'materials', component: () => import('./WebGLMaterialsTransparency') },
            { id: 'webgl_normal_map', name: 'Normal Map', category: 'materials', component: () => import('./WebGLNormalMap') },
            { id: 'webgl_materials_blending', name: 'Blending', category: 'materials', component: () => import('./WebGLMaterialsBlending') },
            { id: 'webgl_materials_matcap', name: 'Matcap', category: 'materials', component: () => import('./WebGLMaterialsMatcap') },
            { id: 'webgl_materials_cubemap', name: 'Cubemap Reflection', category: 'materials', component: () => import('./WebGLMaterialsCubemap') },
            { id: 'webgl_materials_car', name: 'Car Materials', category: 'materials', component: () => import('./WebGLMaterialsCar') },
            { id: 'webgl_materials_normalmap', name: 'Normal Map', category: 'materials', component: () => import('./WebGLMaterialsNormalmap') },
            { id: 'webgl_materials_physical_clearcoat', name: 'Clearcoat', category: 'materials', component: () => import('./WebGLMaterialsPhysicalClearcoat') },
            { id: 'webgl_materials_physical_transmission', name: 'Transmission', category: 'materials', component: () => import('./WebGLMaterialsPhysicalTransmission') },
            { id: 'webgl_materials_channels', name: 'Channels', category: 'materials', component: () => import('./WebGLMaterialsChannels') },
            { id: 'webgl_materials_cubemap_dynamic', name: 'Dynamic Cubemap', category: 'materials', component: () => import('./WebGLMaterialsCubemapDynamic') },
        ]
    },
    {
        id: 'textures',
        name: 'Textures',
        demos: [
            { id: 'webgl_textures_cube', name: 'Textures Cube', category: 'textures', component: () => import('./WebGLTexturesCube') },
            { id: 'webgl_uvs', name: 'UVs', category: 'textures', component: () => import('./WebGLUVs') },
        ]
    },
    {
        id: 'alpha',
        name: 'Alpha',
        demos: [
            { id: 'webgl_alpha', name: 'Alpha', category: 'alpha', component: () => import('./WebGLAlpha') },
        ]
    },
    {
        id: 'clipping',
        name: 'Clipping',
        demos: [
            { id: 'webgl_clipping', name: 'Clipping', category: 'clipping', component: () => import('./WebGLClipping') },
            { id: 'webgl_clipping_advanced', name: 'Clipping Advanced', category: 'clipping', component: () => import('./WebGLClippingAdvanced') },
            { id: 'webgl_clipping_intersection', name: 'Clipping Intersection', category: 'clipping', component: () => import('./WebGLClippingIntersection') },
        ]
    },
    {
        id: 'wireframes',
        name: 'Wireframes',
        demos: [
            { id: 'webgl_wireframes', name: 'Wireframes', category: 'wireframes', component: () => import('./WebGLWireframes') },
        ]
    },
    {
        id: 'particles',
        name: 'Particles',
        demos: [
            { id: 'webgl_particles', name: 'Particles', category: 'particles', component: () => import('./WebGLParticles') },
            { id: 'webgl_particles_buffer', name: 'Particles Buffer', category: 'particles', component: () => import('./ParticlesBuffer') },
            { id: 'webgl_points_sprites', name: 'Points Sprites', category: 'particles', component: () => import('./WebGLPointsSprites') },
            { id: 'webgl_points_dynamic', name: 'Points Dynamic', category: 'particles', component: () => import('./WebGLPointsDynamic') },
            { id: 'webgl_points_waves', name: 'Points Waves', category: 'particles', component: () => import('./WebGLPointsWaves') },
        ]
    },
    {
        id: 'fog',
        name: 'Fog',
        demos: [
            { id: 'webgl_fog', name: 'Fog', category: 'fog', component: () => import('./WebGLFog') },
        ]
    },
    {
        id: 'shadows',
        name: 'Shadows',
        demos: [
            { id: 'webgl_shadowmap', name: 'Shadow Map', category: 'shadows', component: () => import('./ShadowMap') },
            { id: 'webgl_shadowmap_advanced', name: 'Shadow Map Advanced', category: 'shadows', component: () => import('./WebGLShadowMap') },
            { id: 'webgl_shadow_contact', name: 'Shadow Contact', category: 'shadows', component: () => import('./WebGLShadowContact') },
            { id: 'webgl_shadows', name: 'Shadows', category: 'shadows', component: () => import('./WebGLShadows') },
            { id: 'webgl_shadowmap_pointlight', name: 'PointLight Shadows', category: 'shadows', component: () => import('./WebGLShadowmapPointlight') },
            { id: 'webgl_shadowmap_vsm', name: 'VSM Shadows', category: 'shadows', component: () => import('./WebGLShadowmapVSM') },
        ]
    },
    {
        id: 'lights',
        name: 'Lights',
        demos: [
            { id: 'webgl_lights', name: 'Physical Lights', category: 'lights', component: () => import('./WebGLLights') },
            { id: 'webgl_lights_rectarea', name: 'RectArea Lights', category: 'lights', component: () => import('./WebGLLightsRectArea') },
            { id: 'webgl_lights_spotlight', name: 'Spotlight', category: 'lights', component: () => import('./WebGLLightsSpotlight') },
            { id: 'webgl_lightprobe', name: 'Light Probe', category: 'lights', component: () => import('./WebGLLightprobe') },
        ]
    },
    {
        id: 'cameras',
        name: 'Cameras',
        demos: [
            { id: 'webgl_camera', name: 'Camera', category: 'cameras', component: () => import('./WebGLCamera') },
            { id: 'webgl_camera_array', name: 'Camera Array', category: 'cameras', component: () => import('./WebGLCameraArray') },
        ]
    },
    {
        id: 'loaders',
        name: 'Loaders',
        demos: [
            { id: 'webgl_loader_gltf', name: 'GLTF', category: 'loaders', component: () => import('./GLTF') },
            { id: 'webgl_loader_gltf_anisotropy', name: 'GLTF Anisotropy', category: 'loaders', component: () => import('./GltfAnisotropy') },
            { id: 'webgl_loader_gltf_demo', name: 'GLTF Demo', category: 'loaders', component: () => import('./WebGLLoaderGLTF') },
            { id: 'webgl_loader_gltf_2', name: 'GLTF 2', category: 'loaders', component: () => import('./WebGLLoaderGLTF2') },
            { id: 'webgl_loader_obj', name: 'OBJ Loader', category: 'loaders', component: () => import('./WebGLLoaderOBJ') },
            { id: 'webgl_loader_draco', name: 'Draco Loader', category: 'loaders', component: () => import('./WebGLLoaderDraco') },
            { id: 'webgl_loader_fbx', name: 'FBX Loader', category: 'loaders', component: () => import('./WebGLLoaderFBX') },
            { id: 'webgl_loader_ply', name: 'PLY Loader', category: 'loaders', component: () => import('./WebGLLoaderPLY') },
            { id: 'webgl_loader_collada', name: 'Collada Loader', category: 'loaders', component: () => import('./WebGLLoaderCollada') },
            { id: 'webgl_loader_pcd', name: 'PCD Loader', category: 'loaders', component: () => import('./WebGLLoaderPCD') },
            { id: 'webgl_loader_vrml', name: 'VRML Loader', category: 'loaders', component: () => import('./WebGLLoaderVRML') },
            { id: 'webgl_loader_stl', name: 'STL Loader', category: 'loaders', component: () => import('./WebGLLoaderSTL') },
            { id: 'webgl_loader_3mf', name: '3MF Loader', category: 'loaders', component: () => import('./WebGLLoader3MF') },
            { id: 'webgl_loader_bvh', name: 'BVH Loader', category: 'loaders', component: () => import('./WebGLLoaderBVH') },
            { id: 'webgl_loader_gcode', name: 'GCode Loader', category: 'loaders', component: () => import('./WebGLLoaderGCode') },
            { id: 'webgl_loader_svg', name: 'SVG Loader', category: 'loaders', component: () => import('./WebGLLoaderSVG') },
            { id: 'webgl_loader_ttf', name: 'TTF Loader', category: 'loaders', component: () => import('./WebGLLoaderTTF') },
            { id: 'webgl_loader_pdb', name: 'PDB Loader', category: 'loaders', component: () => import('./WebGLLoaderPDB') },
            { id: 'webgl_loader_xyz', name: 'XYZ Loader', category: 'loaders', component: () => import('./WebGLLoaderXYZ') },
            { id: 'webgl_loader_3ds', name: '3DS Loader', category: 'loaders', component: () => import('./WebGLLoader3DS') },
            { id: 'webgl_loader_3dm', name: '3DM Loader', category: 'loaders', component: () => import('./WebGLLoader3DM') },
            { id: 'webgl_loader_amf', name: 'AMF Loader', category: 'loaders', component: () => import('./WebGLLoaderAMF') },
            { id: 'webgl_loader_kmz', name: 'KMZ Loader', category: 'loaders', component: () => import('./WebGLLoaderKMZ') },
            { id: 'webgl_loader_lwo', name: 'LWO Loader', category: 'loaders', component: () => import('./WebGLLoaderLWO') },
            { id: 'webgl_loader_md2', name: 'MD2 Loader', category: 'loaders', component: () => import('./WebGLLoaderMD2') },
            { id: 'webgl_loader_nrrd', name: 'NRRD Loader', category: 'loaders', component: () => import('./WebGLLoaderNRRD') },
            { id: 'webgl_loader_vox', name: 'VOX Loader', category: 'loaders', component: () => import('./WebGLLoaderVOX') },
        ]
    },
    {
        id: 'postprocessing',
        name: 'Postprocessing',
        demos: [
            { id: 'webgl_postprocessing', name: 'Unreal Bloom', category: 'postprocessing', component: () => import('./Postprocessing') },
            { id: 'webgl_postprocessing_demo', name: 'Postprocessing Demo', category: 'postprocessing', component: () => import('./WebGLPostprocessing') },
            { id: 'webgl_postprocessing_film', name: 'Film Effect', category: 'postprocessing', component: () => import('./PostprocessingFilm') },
            { id: 'webgl_postprocessing_ssao', name: 'SSAO', category: 'postprocessing', component: () => import('./WebGLPostprocessingSSAO') },
            { id: 'webgl_postprocessing_fxaa', name: 'FXAA', category: 'postprocessing', component: () => import('./WebGLPostprocessingFXAA') },
            { id: 'webgl_postprocessing_bokeh', name: 'Bokeh DOF', category: 'postprocessing', component: () => import('./WebGLPostprocessingBokeh') },
            { id: 'webgl_postprocessing_smaa', name: 'SMAA', category: 'postprocessing', component: () => import('./WebGLPostprocessingSMAA') },
            { id: 'webgl_postprocessing_vignette', name: 'Vignette', category: 'postprocessing', component: () => import('./WebGLPostprocessingVignette') },
            { id: 'webgl_color_grading', name: 'Color Grading', category: 'postprocessing', component: () => import('./WebGLColorGrading') },
            { id: 'webgl_postprocessing_dof', name: 'Depth of Field', category: 'postprocessing', component: () => import('./WebGLPostprocessingDOF') },
            { id: 'webgl_postprocessing_godrays', name: 'God Rays', category: 'postprocessing', component: () => import('./WebGLPostprocessingGodRays') },
            { id: 'webgl_postprocessing_outline', name: 'Outline', category: 'postprocessing', component: () => import('./WebGLPostprocessingOutline') },
            { id: 'webgl_postprocessing_ssr', name: 'Screen Space Reflections', category: 'postprocessing', component: () => import('./WebGLPostprocessingSSR') },
            { id: 'webgl_postprocessing_transition', name: 'Scene Transition', category: 'postprocessing', component: () => import('./WebGLPostprocessingTransition') },
            { id: 'webgl_postprocessing_glitch', name: 'Glitch', category: 'postprocessing', component: () => import('./WebGLPostprocessingGlitch') },
            { id: 'webgl_postprocessing_pixel', name: 'Pixel', category: 'postprocessing', component: () => import('./WebGLPostprocessingPixel') },
            { id: 'webgl_postprocessing_afterimage', name: 'Afterimage', category: 'postprocessing', component: () => import('./WebGLPostprocessingAfterimage') },
            { id: 'webgl_postprocessing_taa', name: 'TAA', category: 'postprocessing', component: () => import('./WebGLPostprocessingTAA') },
            { id: 'webgl_postprocessing_temporal', name: 'Temporal AA', category: 'postprocessing', component: () => import('./WebGLPostprocessingTemporal') },
            { id: 'webgl_postprocessing_chromatic', name: 'Chromatic Aberration', category: 'postprocessing', component: () => import('./WebGLPostprocessingChromatic') },
            { id: 'webgl_postprocessing_depth', name: 'Depth Effect', category: 'postprocessing', component: () => import('./WebGLPostprocessingDepth') },
            { id: 'webgl_postprocessing_nodes', name: 'Node-based Effects', category: 'postprocessing', component: () => import('./WebGLPostprocessingNodes') },
            { id: 'webgl_postprocessing_advanced', name: 'Advanced', category: 'postprocessing', component: () => import('./WebGLPostprocessingAdvanced') },
        ]
    },
    {
        id: 'environment',
        name: 'Environment',
        demos: [
            { id: 'webgl_sky', name: 'Sky', category: 'environment', component: () => import('./Sky') },
            { id: 'webgl_water', name: 'Water', category: 'environment', component: () => import('./Water') },
            { id: 'webgl_shaders_sky', name: 'Sky Shader', category: 'environment', component: () => import('./WebGLShadersSky') },
            { id: 'webgl_panorama_equirectangular', name: 'Equirectangular Panorama', category: 'environment', component: () => import('./WebGLPanoramaEquirectangular') },
        ]
    },
    {
        id: 'objects',
        name: 'Objects',
        demos: [
            { id: 'webgl_reflector', name: 'Reflector', category: 'objects', component: () => import('./Reflector') },
            { id: 'webgl_mirror', name: 'Mirror', category: 'objects', component: () => import('./WebGLMirror') },
            { id: 'webgl_lensflares', name: 'Lens Flares', category: 'objects', component: () => import('./WebGLLensflares') },
        ]
    },
    {
        id: 'instancing',
        name: 'Instancing',
        demos: [
            { id: 'webgl_instancing', name: 'Instancing', category: 'instancing', component: () => import('./Instancing') },
            { id: 'webgl_instancing_performance', name: 'Instancing Performance', category: 'instancing', component: () => import('./WebGLInstancingPerformance') },
            { id: 'webgl_instancing_animated', name: 'Instancing Animated', category: 'instancing', component: () => import('./WebGLInstancingAnimated') },
            { id: 'webgl_instancing_billboards', name: 'Instancing Billboards', category: 'instancing', component: () => import('./WebGLInstancingBillboards') },
            { id: 'webgl_instancing_scatter', name: 'Instancing Scatter', category: 'instancing', component: () => import('./WebGLInstancingScatter') },
            { id: 'webgl_instancing_morph', name: 'Instancing Morph', category: 'instancing', component: () => import('./WebGLInstancingMorph') },
            { id: 'webgl_instancing_dynamic', name: 'Instancing Dynamic', category: 'instancing', component: () => import('./WebGLInstancingDynamic') },
            { id: 'webgl_instancing_raycast', name: 'Instancing Raycast', category: 'instancing', component: () => import('./WebGLInstancingRaycast') },
        ]
    },
    {
        id: 'interactive',
        name: 'Interactive',
        demos: [
            { id: 'webgl_interactive_cubes', name: 'Interactive Cubes', category: 'interactive', component: () => import('./WebGLInteractiveCubes') },
            { id: 'webgl_interactive_cubes_raycaster', name: 'Interactive Cubes Raycaster', category: 'interactive', component: () => import('./WebGLInteractiveCubesRaycast') },
            { id: 'webgl_interactive_voxelpainter', name: 'Voxel Painter', category: 'interactive', component: () => import('./WebGLInteractiveVoxelpainter') },
            { id: 'webgl_interactive_buffer_geometry', name: 'Interactive BufferGeometry', category: 'interactive', component: () => import('./WebGLInteractiveBufferGeometry') },
            { id: 'webgl_interactive_cubes_gpu', name: 'Interactive Cubes GPU', category: 'interactive', component: () => import('./WebGLInteractiveCubesGPU') },
            { id: 'webgl_interactive_cubes_ortho', name: 'Interactive Cubes Ortho', category: 'interactive', component: () => import('./WebGLInteractiveCubesOrtho') },
            { id: 'webgl_interactive_lines', name: 'Interactive Lines', category: 'interactive', component: () => import('./WebGLInteractiveLines') },
            { id: 'webgl_interactive_raycasting_points', name: 'Interactive Raycasting Points', category: 'interactive', component: () => import('./WebGLInteractiveRaycastingPoints') },
        ]
    },
    {
        id: 'sprites',
        name: 'Sprites',
        demos: [
            { id: 'webgl_sprites', name: 'Sprites', category: 'sprites', component: () => import('./WebGLSprites') },
        ]
    },
    {
        id: 'buffergeometry',
        name: 'BufferGeometry',
        demos: [
            { id: 'webgl_buffergeometry', name: 'BufferGeometry', category: 'buffergeometry', component: () => import('./WebGLBufferGeometry') },
        ]
    },
    {
        id: 'css3d',
        name: 'CSS3D',
        demos: [
            { id: 'css3d_periodictable', name: 'Periodic Table', category: 'css3d', component: () => import('./css3d_periodictable') },
            { id: 'webgl_css3d', name: 'WebGL + CSS3D', category: 'css3d', component: () => import('./webgl_css3d') },
            { id: 'webgl_css3d_demo', name: 'CSS3D Demo', category: 'css3d', component: () => import('./WebGLCSS3D') },
        ]
    },
    {
        id: 'reflection',
        name: 'Reflection',
        demos: [
            { id: 'webgl_reflection', name: 'Reflection', category: 'reflection', component: () => import('./WebGLReflection') },
        ]
    },
    {
        id: 'canvas_texture',
        name: 'Canvas Texture',
        demos: [
            { id: 'webgl_canvas_texture', name: 'Canvas Texture', category: 'canvas_texture', component: () => import('./WebGLCanvasTexture') },
        ]
    },
    {
        id: 'toon',
        name: 'Toon',
        demos: [
            { id: 'webgl_toon', name: 'Toon Shading', category: 'toon', component: () => import('./WebGLToon') },
        ]
    },
    {
        id: 'svg',
        name: 'SVG',
        demos: [
            { id: 'webgl_svg', name: 'SVG Shapes', category: 'svg', component: () => import('./WebGLSVG') },
        ]
    },
    {
        id: 'webgpu',
        name: 'WebGPU',
        demos: [
            { id: 'webgl_webgpu', name: 'WebGPU Style', category: 'webgpu', component: () => import('./WebGLWebGPU') },
        ]
    },
    {
        id: 'point_cloud',
        name: 'Point Cloud',
        demos: [
            { id: 'webgl_point_cloud', name: 'Point Cloud', category: 'point_cloud', component: () => import('./WebGLPointCloud') },
        ]
    },
    {
        id: 'terrain',
        name: 'Terrain',
        demos: [
            { id: 'webgl_terrain', name: 'Terrain', category: 'terrain', component: () => import('./WebGLTerrain') },
        ]
    },
    {
        id: 'custom_shader',
        name: 'Custom Shader',
        demos: [
            { id: 'webgl_custom_shader', name: 'Custom Shader', category: 'custom_shader', component: () => import('./WebGLCustomShader') },
        ]
    },
    {
        id: 'physics',
        name: 'Physics',
        demos: [
            { id: 'webgl_physics', name: 'Physics', category: 'physics', component: () => import('./WebGLPhysics') },
            { id: 'physics_ammo_break', name: 'Ammo.js Breakable', category: 'physics', component: () => import('./PhysicsAmmoBreak') },
            { id: 'physics_ammo_cloth', name: 'Ammo.js Cloth', category: 'physics', component: () => import('./PhysicsAmmoCloth') },
            { id: 'physics_rapier_basic', name: 'Rapier Basic', category: 'physics', component: () => import('./PhysicsRapierBasic') },
            { id: 'physics_rapier_instancing', name: 'Rapier Instancing', category: 'physics', component: () => import('./PhysicsRapierInstancing') },
            { id: 'physics_rapier_joints', name: 'Rapier Joints', category: 'physics', component: () => import('./PhysicsRapierJoints') },
        ]
    },
    {
        id: 'audio',
        name: 'Audio',
        demos: [
            { id: 'webgl_audio', name: 'Audio Visualizer', category: 'audio', component: () => import('./WebGLAudio') },
        ]
    },
    {
        id: 'css2d',
        name: 'CSS2D',
        demos: [
            { id: 'webgl_css2d', name: 'CSS2D Renderer', category: 'css2d', component: () => import('./WebGLCSS2D') },
        ]
    },
    {
        id: 'vr',
        name: 'VR',
        demos: [
            { id: 'webgl_vr', name: 'VR Experience', category: 'vr', component: () => import('./WebGLVR') },
        ]
    },
    {
        id: 'webxr',
        name: 'WebXR',
        demos: [
            { id: 'webgl_webxr', name: 'WebXR', category: 'webxr', component: () => import('./WebGLWebXR') },
            { id: 'webgl_webxr_ar', name: 'WebXR AR', category: 'webxr', component: () => import('./WebGLWebXRAR') },
            { id: 'webgl_webxr_vr', name: 'WebXR VR', category: 'webxr', component: () => import('./WebGLWebXRVR') },
            { id: 'webgl_webxr_hit_test', name: 'WebXR Hit Test', category: 'webxr', component: () => import('./WebGLWebXRHitTest') },
            { id: 'webgl_webxr_anchors', name: 'WebXR Anchors', category: 'webxr', component: () => import('./WebGLWebXRAnchors') },
            { id: 'webgl_webxr_layers', name: 'WebXR Layers', category: 'webxr', component: () => import('./WebGLWebXRLayers') },
            { id: 'webxr_ar_cones', name: 'WebXR AR Cones', category: 'webxr', component: () => import('./WebXRARCones') },
            { id: 'webxr_ar_plane_detection', name: 'WebXR AR Plane Detection', category: 'webxr', component: () => import('./WebXRARPlaneDetection') },
            { id: 'webxr_vr_ballshooter', name: 'WebXR VR Ball Shooter', category: 'webxr', component: () => import('./WebXRVRBallshooter') },
            { id: 'webxr_vr_paint', name: 'WebXR VR Paint', category: 'webxr', component: () => import('./WebXRVRPaint') },
            { id: 'webxr_sandbox', name: 'WebXR Sandbox', category: 'webxr', component: () => import('./WebXRSandbox') },
        ]
    },
    {
        id: 'advanced',
        name: 'Advanced',
        demos: [
            { id: 'webgl_batch_lod_bvh', name: 'Batch LOD BVH', category: 'advanced', component: () => import('./BatchLodBvh') },
            { id: 'webgl_useframe_test', name: 'UseFrame Test', category: 'advanced', component: () => import('./UseFrameTest') },
            { id: 'webgl_lod', name: 'Level of Detail', category: 'advanced', component: () => import('./WebGLLOD') },
            { id: 'webgl_decals', name: 'Decals', category: 'advanced', component: () => import('./WebGLDecals') },
            { id: 'webgl_modifier_simplify', name: 'Simplify Modifier', category: 'advanced', component: () => import('./WebGLModifierSimplify') },
            { id: 'webgl_helpers', name: 'Helpers', category: 'advanced', component: () => import('./WebGLHelpers') },
            { id: 'webgl_multiple_geometries', name: 'Multiple Geometries', category: 'advanced', component: () => import('./WebGLMultipleGeometries') },
            { id: 'webgl_tone_mapping', name: 'Tone Mapping', category: 'advanced', component: () => import('./WebGLToneMapping') },
            { id: 'webgl_shader_lava', name: 'Lava Shader', category: 'advanced', component: () => import('./WebGLShaderLava') },
            { id: 'webgl_shaders_ocean', name: 'Ocean Shader', category: 'advanced', component: () => import('./WebGLShadersOcean') },
        ]
    },
    {
        id: 'controls',
        name: 'Controls',
        demos: [
            { id: 'misc_controls_transform', name: 'Transform Controls', category: 'controls', component: () => import('./MiscControlsTransform') },
        ]
    },
]

// Flattened list for search
export const allDemos: DemoEntry[] = categories.flatMap(c => c.demos)
