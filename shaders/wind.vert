/** wind.vert */


#ifdef WEBGL
#ifdef MULTIDRAW
#extension GL_ANGLE_multi_draw : require
#endif
#endif

#define USE_LIGHTS


precision highp float;

/* Normal and tangent are float16, but we transform them with highp quats
 * anyway so do the conversion as early as possible */
layout(location = 0) in highp vec3 inPosition;
#ifdef TEXTURE_COORDS
layout(location = 1) in highp vec2 inTextureCoords;
#endif
#ifdef COLOR
layout(location = 2) in mediump vec4 inColor;  // Vertex color, with red channel determining heightFactor
#endif
#ifdef TANGENT
layout(location = 3) in highp vec4 inTangent;
#endif
#ifndef MULTIDRAW
layout(location = 4) in mediump uint inObjectId;
#endif
#ifdef NORMAL
layout(location = 5) in highp vec3 inNormal;
#endif

#ifdef TEXTURE_COORDS_1
layout(location = 10) in highp vec2 inTextureCoords1;
#endif

#include "lib/Quaternion.glsl"

#ifdef POSITION_WORLD
out highp vec3 fragPositionWorld;
#endif
#ifdef POSITION_VIEW
out highp vec3 fragPositionView;
#endif
#ifdef TEXTURE_COORDS
out highp vec2 fragTextureCoords;
#endif
#ifdef TEXTURE_COORDS_1
out highp vec2 fragTextureCoords1;
#endif

#ifdef COLOR
out mediump vec4 fragColor;
#endif

#ifdef TANGENT
out mediump vec4 fragTangent;
#endif
#ifdef OBJECT_ID
flat out mediump uint fragObjectId;
#endif
#ifdef MATERIAL_ID
flat out mediump uint fragMaterialId;
#endif
#ifdef NORMAL
out mediump vec3 fragNormal;
#endif
#ifdef BARYCENTRIC
out mediump vec3 fragBarycentric;
#endif

#include "lib/Uniforms.glsl"

// Uniforms for lights (remove this if you dont use it.Temperorily added to get time variable via light (hack))
uniform Lights {
    highp vec3 lightPositionsWorld[NUM_LIGHTS];
    highp vec3 lightDirectionsWorld[NUM_LIGHTS];
    mediump vec4 lightColors[NUM_LIGHTS];
    highp vec4 lightParameters[NUM_LIGHTS];
};

void main() {


    /* Temporaries since we have no out variables */
    #ifndef POSITION_WORLD
    highp vec3 fragPositionWorld;
    #endif
    #ifndef POSITION_VIEW
    highp vec3 fragPositionView;
    #endif
    #ifndef OBJECT_ID
    mediump uint fragObjectId;
    #endif

    #ifdef MULTIDRAW
    fragObjectId = uint(gl_DrawID); /* idOffset not needed! */
    #else
    fragObjectId = inObjectId;
    #endif

    ivec2 idx = 2*ivec2((int(fragObjectId)) & OBJECTS_PER_ROW_MASK, int(fragObjectId >> OBJECTS_PER_ROW_LOG2));
    highp vec4 transform[2] = vec4[](
        texelFetchOffset(transformations, idx, 0, ivec2(0, 0)),
        texelFetchOffset(transformations, idx, 0, ivec2(1, 0)));
    highp vec4 scaling =
        texelFetchOffset(transformations, idx, 0, ivec2(0, 1));
    #ifdef MATERIAL_ID
    fragMaterialId = uint(scaling.w);
    #endif

    /* Transformed vertex position */
    fragPositionWorld = quat2_transformPoint(Quat2(transform[0], transform[1]), scaling.xyz*inPosition);
    fragPositionView = quat2_transformPoint(Quat2(worldToView[0], worldToView[1]), fragPositionWorld);

    /* Transformed normal vector */
    #ifdef NORMAL
    fragNormal = normalize(quat_transformVector(transform[0], scaling.xyz*inNormal));
    #endif

    #ifdef TANGENT
    fragTangent = vec4(normalize(quat_transformVector(transform[0], scaling.xyz*inTangent.xyz)), inTangent.w);
    #endif


    /**CUSTOM CODE START */
    
    // local time (uses first light's x position as time.)
    //For this to work : ensure you have atleast light component (preferebly sun), and move that object in runtime via js)
    //TODO replace it with a uniform once wle supports per pipeline inputs
    float _time = lightPositionsWorld[0][0];

    // local parameters 
    float smallAmp  = 5.6;
    float smallFreq = 0.5;
    float smallSpeed= 1.5;

    // ---------- Small scale wind ----------
    vec2 smallNoiseCoord = vec2(fragPositionWorld.x, fragPositionWorld.z) * smallFreq + vec2(_time * smallSpeed);

    // Inline perlinNoise for smallNoiseCoord
    vec2 st = smallNoiseCoord;
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453123);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453123);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453123);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453123);

    vec2 u = f * f * (3.0 - 2.0 * f);
    float smallNoise = mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;

    vec2 smallWindOffset = vec2(smallNoise, smallNoise) * smallAmp;

    // default target height
    float height = 4.0;
    float windInfluence = smoothstep(0.0, height, fragPositionWorld.y);

    // If vertex color is used, sample height based on vertex color
    #ifdef COLOR
    windInfluence = inColor.g * 0.1;
    #endif

    vec2 combinedWindOffset = smallWindOffset * windInfluence;

    // Apply horizontal displacement only (as in original)
    fragPositionWorld.x += combinedWindOffset.x;
    fragPositionWorld.z += combinedWindOffset.y;

    /**CUSTOM CODE END*/



    
    // Transform position to view coordinates
    fragPositionView = quat2_transformPoint(Quat2(worldToView[0], worldToView[1]), fragPositionWorld);

    #ifdef PARABOLOID
    highp float dist = -fragPositionView.z;
    // Calculate and set the X and Y coordinates
    gl_Position.xyz = normalize(fragPositionView.xyz);
    gl_Position.xy /= 1.0 - gl_Position.z;
    // Calculate and set the Z and W coordinates
    gl_Position.z = (dist - cameraParams.z) / (cameraParams.w - cameraParams.z);
    gl_Position.z = gl_Position.z * 2.0 - 1.0;
    gl_Position.w = 1.0;
    #else
    /* Transform the position */
    gl_Position = projectionMatrix*vec4(fragPositionView, 1.0f);

    #ifdef TEXTURE_COORDS
    /* Texture coordinates, if needed */
    fragTextureCoords = inTextureCoords;
    #endif

    #ifdef TEXTURE_COORDS_1
    fragTextureCoords1 = inTextureCoords1;
    #endif

    #ifdef COLOR
    fragColor = inColor;
    #endif


    #ifdef BARYCENTRIC
    /* Barycentric without dynamic indexed vector, which is emulated on WebGL */
    fragBarycentric[0] = float(gl_VertexID % 3 == 0)*1.0;
    fragBarycentric[1] = float(gl_VertexID % 3 == 1)*1.0;
    fragBarycentric[2] = float(gl_VertexID % 3 == 2)*1.0;
    #endif
}
