class CubeMap {
    constructor(image_Names) {
        this.textureCubeMap = loadCubeMap(image_Names);

        this.shader = new Shader();

        this.shader.compileShader("cubemap", true, loadFile("./src/shaders/cubemap.vert"));
        this.shader.compileShader("cubemap", false, loadFile("./src/shaders/cubemap.frag"));

        //pre linking
        gl.bindAttribLocation(this.shader.shaderProgram, vertexAttributeEnum.AMC_ATTRIBUTE_POSITION, "aPosition");

        // linking
        this.shader.linkProgram();
        this.vao_sky = null;
        this.vbo_position_sky = null;
    }

    init() {
        // Skybox
        var skyboxVertices = new Float32Array([
            -1.0, 1.0, -1.0,
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            -1.0, 1.0, -1.0,
    
            -1.0, -1.0, 1.0,
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            -1.0, -1.0, 1.0,
    
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,
    
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,
    
            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0,
    
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0
        ]);

        // Vao
        this.vao_sky = gl.createVertexArray();
        gl.bindVertexArray(this.vao_sky);

        // Vbo For Position
        this.vbo_position_sky = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,  this.vbo_position_sky);
        gl.bufferData(gl.ARRAY_BUFFER, skyboxVertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vertexAttributeEnum.AMC_ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 3 * 4, 0);
        gl.enableVertexAttribArray(vertexAttributeEnum.AMC_ATTRIBUTE_POSITION);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);	
        gl.bindVertexArray(null);
    }
    
    render()
    {
        gl.useProgram(this.shader.shaderProgram);
        var modelMatrix = mat4.create();
        var viewMatrix = mat4.create();

        this.shader.setUniform("model", modelMatrix);
        this.shader.setUniform("view", viewMatrix);
        this.shader.setUniform("projection", perspectiveProjectionMatrix);

        // For Texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.textureCubeMap);
        this.shader.setUniform("uTextureSampler2", 0);

        // Bind
        gl.bindVertexArray(this.vao_sky);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        // unbind
        gl.bindVertexArray(null);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

        gl.useProgram(null);
    }

    uninit() {
        if (this.vbo_position_sky) {
            gl.deleteBuffer(this.vbo_position_sky);
            this.vbo_position_sky = null;
        }
        if (this.vao_sky) {
            gl.deleteVertexArray(this.vao_sky);
            this.vao_sky = null;
        }
        if (this.shader.shaderProgram) {
            this.shader.deleteShaders();
        }
    }
}