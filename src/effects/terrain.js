class Terrain {
    constructor() {

        this.shader = new Shader();

        this.shader.compileShader("terrain", true, loadFile("./src/shaders/terrain.vert"));
        this.shader.compileShader("terrain", false, loadFile("./src/shaders/terrain.frag"));

        // Pre linking
        gl.bindAttribLocation(this.shader.shaderProgram, vertexAttributeEnum.AMC_ATTRIBUTE_POSITION, "aPosition");
        gl.bindAttribLocation(this.shader.shaderProgram, vertexAttributeEnum.AMC_ATTRIBUTE_NORMAL, "aNormal");
        gl.bindAttribLocation(this.shader.shaderProgram, vertexAttributeEnum.AMC_ATTRIBUTE_COLOR, "aColor");


        // Linking
        this.shader.linkProgram();

        this.shaderProgObj_terrain = null;
        this.vao_terrain = null;
        this.vbo_position_terrain = null;
        this.vbo_normal_terrain = null;
        this.vbo_color_terrain = null;
        this.terrainVertexCount = 0;

        this.modelMatrixUniform_terrain = null;
        this.viewMatrixUniform_terrain = null;
        this.projectionMatrixUniform_terrain = null;
        this.perspectiveProjectionMatrix_terrain;
    }

    // TERRAIN GENERATION
    generateTerrain(size, divisions) {
        // Code
        var vertices = [];
        var normals = [];
        var colors = [];

        var step = size / divisions;
        var halfSize = size / 2.0;

        // Generate height map first for normal calculation
        var heightMap = [];
        for (var z = 0; z <= divisions; z++) {
            heightMap[z] = [];
            for (var x = 0; x <= divisions; x++) {
                var xPos = x * step - halfSize;
                var zPos = z * step - halfSize;

                var height = 0.0;
                height += Math.sin(xPos * 0.2) * Math.cos(zPos * 0.2) * 1.6;
                height += Math.sin(xPos * 0.4) * Math.cos(zPos * 0.4) * 1.95;
                height += Math.sin(xPos * 0.8) * Math.cos(zPos * 0.8) * 1.2;

                height += (Math.random() - 0.5) * 0.5;

                // Create valleys near center for water
                var distFromCenter = Math.sqrt(xPos * xPos + zPos * zPos);
                if (distFromCenter < 5.0) {
                    height -= (5.0 - distFromCenter) * 0.4;
                }

                heightMap[z][x] = height;
            }
        }

        // Generate vertices with proper normals
        for (var z = 0; z <= divisions; z++) {
            for (var x = 0; x <= divisions; x++) {
                var xPos = x * step - halfSize;
                var zPos = z * step - halfSize;
                var height = heightMap[z][x];

                vertices.push(xPos, height, zPos);

                // Calculate normal using surrounding heights
                var hL = x > 0 ? heightMap[z][x - 1] : height;
                var hR = x < divisions ? heightMap[z][x + 1] : height;
                var hD = z > 0 ? heightMap[z - 1][x] : height;
                var hU = z < divisions ? heightMap[z + 1][x] : height;

                var nx = hL - hR;
                var nz = hD - hU;
                var ny = 2.0;
                var len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                normals.push(nx / len, ny / len, nz / len);

                // Terrain colors
                var slope = Math.abs(nx) + Math.abs(nz);
                if (height < 0.3) {
                    // Grass (green-yellow)
                    // colors.push(0.2 + Math.random() * 0.1, 0.5 + Math.random() * 0.2, 0.1);
                    colors.push(0.4 + Math.random() * 0.1, 0.3 + Math.random() * 0.1, 0.2);
                } 
                else if (slope > 2.5) {
                    // Rocky slopes (brown-gray)
                    colors.push(0.4 + Math.random() * 0.1, 0.3 + Math.random() * 0.1, 0.2);
                } else {
                    // Mixed grass (darker green)
                    colors.push(0.25 + Math.random() * 0.1, 0.45 + Math.random() * 0.15, 0.15);
                    // colors.push(0.4 + Math.random() * 0.1, 0.3 + Math.random() * 0.1, 0.2);
                }
            }
        }

        // Generate indices
        var indices = [];
        for (var z = 0; z < divisions; z++) {
            for (var x = 0; x < divisions; x++) {
                var topLeft = z * (divisions + 1) + x;
                var topRight = topLeft + 1;
                var bottomLeft = (z + 1) * (divisions + 1) + x;
                var bottomRight = bottomLeft + 1;

                indices.push(topLeft, bottomLeft, topRight);
                indices.push(topRight, bottomLeft, bottomRight);
            }
        }

        return {
            vertices: new Float32Array(vertices),
            normals: new Float32Array(normals),
            colors: new Float32Array(colors),
            indices: new Uint16Array(indices),
            vertexCount: indices.length
        };
    }

    init() {
        // Code
        var terrainData = this.generateTerrain(25.0, 60.0);
        this.terrainVertexCount = terrainData.vertexCount;

        // Create VAO and VBOs
        this.vao_terrain = gl.createVertexArray();
        gl.bindVertexArray(this.vao_terrain);

        this.vbo_position_terrain = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_position_terrain);
        gl.bufferData(gl.ARRAY_BUFFER, terrainData.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vertexAttributeEnum.AMC_ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexAttributeEnum.AMC_ATTRIBUTE_POSITION);

        this.vbo_normal_terrain = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_normal_terrain);
        gl.bufferData(gl.ARRAY_BUFFER, terrainData.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vertexAttributeEnum.AMC_ATTRIBUTE_NORMAL, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexAttributeEnum.AMC_ATTRIBUTE_NORMAL);

        this.vbo_color_terrain = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_color_terrain);
        gl.bufferData(gl.ARRAY_BUFFER, terrainData.colors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vertexAttributeEnum.AMC_ATTRIBUTE_COLOR, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexAttributeEnum.AMC_ATTRIBUTE_COLOR);

        var ebo_terrain = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo_terrain);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, terrainData.indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        this.perspectiveProjectionMatrix_terrain = mat4.create();

        mat4.perspective(
            this.perspectiveProjectionMatrix_terrain,
            45.0,
            canvas.width / canvas.height,
            0.1,
            100.0
        );
    }

    render(viewMatrix) {
        // Code
        gl.useProgram(this.shader.shaderProgram);

        // Set matrices
        var modelMatrix = mat4.create();
        // var viewMatrix = mat4.create();
        var scaleMatrix = mat4.create();

        var translateMatrix = mat4.create();
        mat4.translate(translateMatrix, translateMatrix, [0.0, -2.0, -15.0]);
        mat4.scale(scaleMatrix, scaleMatrix, [1.4, 1.4, 1.4]);
        mat4.multiply(modelMatrix, translateMatrix, scaleMatrix);
        // modelMatrix = translateMatrix;

        this.shader.setUniform('uModelMatrix', modelMatrix);
        this.shader.setUniform('uViewMatrix', viewMatrix);
        this.shader.setUniform('uProjectionMatrix', this.perspectiveProjectionMatrix_terrain);

        gl.bindVertexArray(this.vao_terrain);
        gl.drawElements(gl.TRIANGLES, this.terrainVertexCount, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        // Unbind
        gl.bindVertexArray(null);

        gl.useProgram(null);
    }

    update() {
        // Code
    }

    uninit() {
        // Code
    }
}