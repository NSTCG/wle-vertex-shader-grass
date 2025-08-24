# wle-vertex-shader-grass

An open-source demo for Wonderland Engine showcasing how to use a custom vertex shader to animate a procedurally generated grass field with Perlin noise.

🌱 **Live Demo**: [https://wlevertexshaderdemo.netlify.app/](https://wlevertexshaderdemo.netlify.app/)

---

## ✨ Includes

- A typescript component for runtime procedural grass field generation.
- Vertex shader driven wind effects using Perlin noise.
- A plugin for applying custom vertex shaders to any pipeline.

---

## 🔌 Vertex Shader Plugin

The demo includes a plugin that allows you to apply and customize vertex shaders:

- You can specify the **vertex shader name** and **pipeline name** to apply a vertex shader to any pipeline.
- You can insert your own custom GLSL logic inside the vertex shader file by editing between these markers:

```glsl
/**CUSTOM CODE START */
// your custom shader code here
/**CUSTOM CODE END */
```
