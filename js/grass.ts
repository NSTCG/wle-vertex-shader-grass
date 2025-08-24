import {
	Component,
	Material,
	MeshAttribute,
	MeshComponent,
	Object3D,
} from "@wonderlandengine/api";
import {property} from "@wonderlandengine/api/decorators.js";
import {vec3} from "gl-matrix";

const VERTICES_PER_BLADE = 6;
const DEFAULT_VERTEX_LIMIT = 64000; // safety threshold

export class Grass extends Component {
	static TypeName = "Grass";

	// radius of filled circle to cover with blocks (meters)
	@property.float(100.0)
	radius: number;

	// square block side (meters) - aka grid cell size
	@property.float(5.0)
	blockSide: number;

	// blades per block (how many blades inside one block)
	@property.int(500)
	bladesPerBlock: number;

	// blade appearance
	@property.float(0.8)
	bladeHeight: number;
	@property.float(0.4)
	bladeHeightVariation: number;
	@property.float(0.08)
	bladeWidth: number;

	@property.material()
	material: Material;

	// add near your other properties
	@property.bool(false)
	useCircularMask: boolean; // default false => full square grid

	start() {
		this._buildGridBlocks();
	}

	_getHeight(x, z) {
		// Sample height here if needed.for simplicity, return 0
		return 0;
	}

	// color fade from dark base to vivid green tip
	_lerpColor(t) {
		const base = [0.0, 0.0, 0.0];
		const tip = [0.15, 0.65, 0.22];
		const r = base[0] * (1 - t) + tip[0] * t;
		const g = base[1] * (1 - t) + tip[1] * t;
		const b = base[2] * (1 - t) + tip[2] * t;
		return [r, g, b, 1.0];
	}

	_buildGridBlocks() {
		if (!this.material) {
			console.warn("Grass: no material assigned; skipping creation.");
			return;
		}

		// Determine number of grid cells per axis to approximate radius.
		// We want gridCount * blockSide to be as close as possible to 2*radius.
		let desiredTotal = 2.0 * Math.max(0.0001, this.radius);
		let gridCount = Math.max(1, Math.round(desiredTotal / this.blockSide));

		// Ensure at least 1 cell; recompute actual covered radius so grid is centered.
		const actualTotal = gridCount * this.blockSide;

		console.log(`Grass: actualTotal=${actualTotal}`);
		const actualRadius = actualTotal * 0.5;

		// Log helpful info
		console.log(
			`Grass: radius=${this.radius.toFixed(3)}, blockSide=${this.blockSide.toFixed(3)}, gridCount=${gridCount}, actualRadius=${actualRadius.toFixed(
				3,
			)}`,
		);

		// grid origin offset: center cells around component origin.
		// cell centers range from: -actualRadius + halfSide .. +actualRadius - halfSide
		const halfSide = this.blockSide * 0.5;
		const start = -actualRadius + halfSide;

		// vertex limit check per block
		const vertsPerBlock = this.bladesPerBlock * VERTICES_PER_BLADE;
		if (vertsPerBlock > DEFAULT_VERTEX_LIMIT) {
			console.warn(
				"Grass: bladesPerBlock is high; one block may exceed the GPU vertex limit. Reduce bladesPerBlock.",
			);
		}

		let createdBlocks = 0;

		for (let ix = 0; ix < gridCount; ix++) {
			for (let iz = 0; iz < gridCount; iz++) {
				// compute cell center in local (object) XZ
				const cx = start + ix * this.blockSide;
				const cz = start + iz * this.blockSide;

				// new: only skip cells if the circular mask is specifically requested
				if (this.useCircularMask) {
					const distXZ = Math.hypot(cx, cz);
					if (distXZ > this.radius) continue;
				}

				// create child object for this block (unique objectId)
				const blockObj = this.object.addChild();
				// set block object position in world relative to component object
				blockObj.setPositionLocal([cx, 0, cz]);

				// Build block mesh (vertices are local to blockObj)
				let positions = new Float32Array(vertsPerBlock * 3);
				let normals = new Float32Array(vertsPerBlock * 3);
				let colors = new Float32Array(vertsPerBlock * 4);
				let uvs = new Float32Array(vertsPerBlock * 2);
				let indices = new Uint32Array(this.bladesPerBlock * 6);

				let posOff = 0,
					normOff = 0,
					colOff = 0,
					uvOff = 0,
					idxOff = 0;
				let vCounter = 0;

				for (let b = 0; b < this.bladesPerBlock; b++) {
					// sample position inside the square block (local coordinates relative to block center)
					const lx = Math.random() * this.blockSide - halfSide;
					const lz = Math.random() * this.blockSide - halfSide;

					// compute world coordinates to query terrain
					const compWorldPos = this.object.getPositionWorld();
					const worldX = compWorldPos[0] + cx + lx;
					const worldZ = compWorldPos[2] + cz + lz;
					const baseY = this._getHeight(worldX, worldZ);

					// blade geometry
					const height =
						this.bladeHeight +
						Math.random() * this.bladeHeightVariation;
					const yaw = Math.random() * Math.PI * 2;
					const sinYaw = Math.sin(yaw);
					const cosYaw = Math.cos(yaw);
					const halfW = this.bladeWidth * 0.5;

					const bl = [
						lx + sinYaw * halfW,
						baseY,
						lz - cosYaw * halfW,
					];
					const br = [
						lx - sinYaw * halfW,
						baseY,
						lz + cosYaw * halfW,
					];
					const bend = (Math.random() - 0.5) * 0.6;
					const tip = [
						lx + Math.sin(yaw + bend) * 0.15,
						baseY + height,
						lz - Math.cos(yaw + bend) * 0.15,
					];

					// normal (flat for the tri)
					const e1 = vec3.create();
					const e2 = vec3.create();
					const n = vec3.create();
					vec3.subtract(e1, br, bl);
					vec3.subtract(e2, tip, bl);
					vec3.cross(n, e1, e2);
					vec3.normalize(n, n);

					// --- FRONT TRIANGLE (original) ---
					// store positions
					positions[posOff++] = bl[0];
					positions[posOff++] = bl[1];
					positions[posOff++] = bl[2];
					positions[posOff++] = br[0];
					positions[posOff++] = br[1];
					positions[posOff++] = br[2];
					positions[posOff++] = tip[0];
					positions[posOff++] = tip[1];
					positions[posOff++] = tip[2];

					// normals (front)
					for (let k = 0; k < 3; k++) {
						normals[normOff++] = n[0];
						normals[normOff++] = n[1];
						normals[normOff++] = n[2];
					}

					// colors (base, base, tip)
					const baseColor = this._lerpColor(0.0);
					const tipColor = this._lerpColor(1.0);

					// base-left
					colors[colOff++] = baseColor[0];
					colors[colOff++] = baseColor[1];
					colors[colOff++] = baseColor[2];
					colors[colOff++] = baseColor[3];
					// base-right
					colors[colOff++] = baseColor[0];
					colors[colOff++] = baseColor[1];
					colors[colOff++] = baseColor[2];
					colors[colOff++] = baseColor[3];
					// tip
					colors[colOff++] = tipColor[0];
					colors[colOff++] = tipColor[1];
					colors[colOff++] = tipColor[2];
					colors[colOff++] = tipColor[3];

					// uvs (unused, keep zeros)
					for (let k = 0; k < 3; k++) {
						uvs[uvOff++] = 0.0;
						uvs[uvOff++] = 0.0;
					}

					// front indices (use current vCounter..vCounter+2)
					indices[idxOff++] = vCounter;
					indices[idxOff++] = vCounter + 1;
					indices[idxOff++] = vCounter + 2;
					vCounter += 3;

					// --- BACK TRIANGLE (duplicate vertices, inverted normals, reversed winding) ---
					// duplicate positions again
					positions[posOff++] = bl[0];
					positions[posOff++] = bl[1];
					positions[posOff++] = bl[2];
					positions[posOff++] = br[0];
					positions[posOff++] = br[1];
					positions[posOff++] = br[2];
					positions[posOff++] = tip[0];
					positions[posOff++] = tip[1];
					positions[posOff++] = tip[2];

					// normals (back = -n)
					for (let k = 0; k < 3; k++) {
						normals[normOff++] = -n[0];
						normals[normOff++] = -n[1];
						normals[normOff++] = -n[2];
					}

					// colors (same)
					colors[colOff++] = baseColor[0];
					colors[colOff++] = baseColor[1];
					colors[colOff++] = baseColor[2];
					colors[colOff++] = baseColor[3];
					colors[colOff++] = baseColor[0];
					colors[colOff++] = baseColor[1];
					colors[colOff++] = baseColor[2];
					colors[colOff++] = baseColor[3];
					colors[colOff++] = tipColor[0];
					colors[colOff++] = tipColor[1];
					colors[colOff++] = tipColor[2];
					colors[colOff++] = tipColor[3];

					// uvs duplicates
					for (let k = 0; k < 3; k++) {
						uvs[uvOff++] = 0.0;
						uvs[uvOff++] = 0.0;
					}

					// back indices: the three newly-added vertices are at vCounter..vCounter+2
					// use reversed winding to flip the face: (v, v+2, v+1)
					indices[idxOff++] = vCounter;
					indices[idxOff++] = vCounter + 2;
					indices[idxOff++] = vCounter + 1;
					vCounter += 3;
				}

				// create mesh
				const mesh = this.engine.meshes.create({
					vertexCount: positions.length / 3,
					indexData: indices,
				});

				const posAcc = mesh.attribute(MeshAttribute.Position);
				const colAcc = mesh.attribute(MeshAttribute.Color);
				const uvAcc = mesh.attribute(MeshAttribute.TextureCoordinate);
				const normAcc = mesh.attribute(MeshAttribute.Normal);

				if (!posAcc || !colAcc || !uvAcc || !normAcc) {
					console.error("Grass: missing mesh attributes");
					return;
				}

				posAcc.set(0, positions);
				colAcc.set(0, colors);
				uvAcc.set(0, uvs);
				normAcc.set(0, normals);
				mesh.update();

				positions = null; // free memory
				colors = null;
				uvs = null;
				normals = null;
				indices = null;

				// attach mesh to block object
				blockObj.addComponent(MeshComponent, {
					mesh: mesh,
					material: this.material,
				});

				createdBlocks++;
			}
		}

		console.log(
			`Grass: created ${createdBlocks} blocks (gridCount=${gridCount}, blockSide=${this.blockSide}, bladesPerBlock=${this.bladesPerBlock}).`,
		);
	}
}
