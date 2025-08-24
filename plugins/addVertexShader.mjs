import {data, EditorPlugin, ui} from "@wonderlandengine/editor-api";

export default class UpdatePipelineVertexShaderPlugin extends EditorPlugin {
	/**
	 * Called when the plugin is loaded.
	 * Initializes default names for the vertex shader and pipeline.
	 */
	constructor(editor) {
		super();
		this.editor = editor;
		this.name = "UpdatePipelineVertexShaderPlugin";

		// Default names; these can be changed via the UI.
		this.vertexShaderName = "";
		this.pipelineName = "";
	}

	/**
	 * Draws the plugin UI.
	 * Provides input fields for the vertex shader name and pipeline name,
	 * and buttons to apply or remove the vertex shader from the pipeline.
	 */
	draw() {
		// Input for the vertex shader name.
		this.vertexShaderName =
			ui.inputText("Vertex Shader Name:", this.vertexShaderName) ||
			this.vertexShaderName;

		// Input for the pipeline name.
		this.pipelineName =
			ui.inputText("Pipeline Name:", this.pipelineName) ||
			this.pipelineName;

		// Button to update the pipeline's vertex shader.
		if (ui.button("Apply Vertex Shader to Pipeline")) {
			try {
				// Find the vertex shader's id by its name.
				const shaderId = this.findVertexShaderIdByName(
					this.vertexShaderName,
				);
				// Find the pipeline resource by its name.
				const pipeline = this.findPipelineByName(this.pipelineName);
				// Update the pipeline's viewVertexShader property with the shader id (as a string).
				pipeline.viewVertexShader = String(shaderId);
				ui.label(
					"Pipeline updated successfully with vertex shader id: " +
						shaderId,
				);
			} catch (error) {
				ui.label("Error: " + error.message);
			}
		}

		// Button to remove the vertex shader from the pipeline.
		if (ui.button("Remove Vertex Shader from Pipeline")) {
			try {
				// Find the pipeline resource by its name.
				const pipeline = this.findPipelineByName(this.pipelineName);
				// Remove the vertex shader by clearing the viewVertexShader property.
				pipeline.viewVertexShader = "";
				ui.label("Vertex shader removed from pipeline.");
			} catch (error) {
				ui.label("Error: " + error.message);
			}
		}
	}

	/**
	 * Searches for a vertex shader resource by name.
	 * Iterates over the shaders in data.shaders and returns the id of the shader
	 * that has a matching name and a stage of "vertex".
	 *
	 * @param {string} name - The name of the vertex shader to find.
	 * @returns {string} The id of the vertex shader.
	 * @throws Will throw an error if the vertex shader is not found.
	 */
	findVertexShaderIdByName(name) {
		const shaderKeys = data.shaders.keys();
		for (const id of shaderKeys) {
			const shader = data.shaders[id];
			if (shader.name === name && shader.stage === "vertex") {
				return id;
			}
		}
		throw new Error("Vertex shader not found with name: " + name);
	}

	/**
	 * Searches for a pipeline resource by name.
	 * Iterates over the pipelines in data.pipelines and returns the pipeline
	 * that has a matching name.
	 *
	 * @param {string} name - The name of the pipeline to find.
	 * @returns {object} The pipeline resource.
	 * @throws Will throw an error if the pipeline is not found.
	 */
	findPipelineByName(name) {
		const pipelineKeys = data.pipelines.keys();
		for (const id of pipelineKeys) {
			const pipeline = data.pipelines[id];
			if (pipeline.name === name) {
				return pipeline;
			}
		}
		throw new Error("Pipeline not found with name: " + name);
	}

	/**
	 * Cleanup when the plugin is destroyed.
	 */
	destroy() {
		// Add any necessary cleanup logic here.
	}
}
