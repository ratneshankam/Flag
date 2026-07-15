class FlagScene {
    constructor() {
        // code
 
        // webGL Related variables
        this.MyAttributes =
        {
            KP_ATTRIBUTE_POSITION: 0,
            KP_ATTRIBUTE_TEXCOORD: 1,
        };
        this.shaderProgramObject = null;
        this.MVPUniform;
        this.vao = null;
        this.vao_pole = null;
        this.vbo = null;
        this.vbo_pole = null;
        this.vbo_texcoord = null;
        this.textureSamplerUniform = null;
        this.texture_smiley = null;

        this.MVPMatrixUniform;
        this.modelMatrixUniform;
        this.perspectiveProjectionMatrix;

        // wave effect variables
        this.waveEffect = false;
        this.waveStartTime = 0;
        this.waveDuration = 3.0;
        this.waveDistance = 2.0;

        this.texture_smiley = loadTexture("./resources/textures/cubemap/Flag_of_India.png");

        this.mesh = null;
    }


    init() {
        // code

        // VERTEX SHADER
        var vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
        var vertexShaderSourceCode =
            `#version 300 es
            in vec3 aPosition;
            in vec2 aTexCoord;

            uniform mat4 uMVPMatrix;
            uniform float time;

            out vec2 vTexCoord;
            out float vShade;

            
            void main(void)
            {
            if (time <= 0.0) {
                vShade = 0.6;
                vTexCoord = aTexCoord;
                gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
                return;
            }
                float x01 = (aPosition.x + 1.0) * 0.5;   // 0 = pole, 1 = free end
                float y01 = (aPosition.y + 1.0) * 0.5;

                // main wind wave
                float w1 = sin(x01 * 6.0 - time * 2.0);
                // fine ripples
                float w2 = sin(x01 * 18.0 - time * 6.0 + y01 * 3.0) * 0.2;

                // turbulence noise (fake)
                float w3 = sin(x01 * 3.0 + time * 1.5 + sin(y01 * 5.0)) * 0.2;

                // stiffness falloff from pole
                float stiffness = pow(x01, 1.3);

                // edge curl (rolling at tip)
                float curl = pow(x01, 3.0) * 0.1;

                float wave = (w1 + w2 + w3) * stiffness;

                vec3 pos = aPosition;
                pos.z += wave;
                pos.y += wave * 0.15;
                pos.x += curl * wave;   // curling forward

                vShade = 0.6 + wave * 1.8;
                vTexCoord = aTexCoord;

                gl_Position = uMVPMatrix * vec4(pos, 1.0);
            }`;
        gl.shaderSource(vertexShaderObject, vertexShaderSourceCode);
        gl.compileShader(vertexShaderObject);

        if (gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS) == false) {
            var error = gl.getShaderInfoLog(vertexShaderObject);
            if (error.length > 0) {
                alert(error);
                uninitialize();
            }
        }
        else {
            console.log("Vertex Shader Compilation Succesful\n");
        }

        // FRAGMENT SHADER
        var fragmentShaderobject = gl.createShader(gl.FRAGMENT_SHADER);
        var fragmentShaderSourceCode =
            `#version 300 es
            precision mediump float;

            in vec2 vTexCoord;
            in float vShade;

            uniform sampler2D uTextureSampler;
            out vec4 FragColor;

            void main(void)
            {
                vec3 color = texture(uTextureSampler, vTexCoord).rgb;
                float light = 0.8 + vShade * 1.5;
                FragColor = vec4(color * light, 1.0);
            }`;
        // Reference 
        // "uv.y = uv.y + sin(uv.x * 10.0 + time * 1.0) * 0.1;\n"+
        gl.shaderSource(fragmentShaderobject, fragmentShaderSourceCode);
        gl.compileShader(fragmentShaderobject);
        if (gl.getShaderParameter(fragmentShaderobject, gl.COMPILE_STATUS) == false) {
            var error = gl.getShaderInfoLog(fragmentShaderobject);
            if (error.length > 0) {
                alert(error);
                uninitialize();
            }
        }
        else {
            console.log("Fragment Shader Compilation Succesful\n");
        }

        this.shaderProgramObject = gl.createProgram();
        gl.attachShader(this.shaderProgramObject, vertexShaderObject);
        gl.attachShader(this.shaderProgramObject, fragmentShaderobject);

        // Prelink Attribute binding
        gl.bindAttribLocation(this.shaderProgramObject, this.MyAttributes.KP_ATTRIBUTE_POSITION, "aPosition");
        gl.bindAttribLocation(this.shaderProgramObject, this.MyAttributes.KP_ATTRIBUTE_TEXCOORD, "aTexCoord");

        // Link
        gl.linkProgram(this.shaderProgramObject);

        if (gl.getProgramParameter(this.shaderProgramObject, gl.LINK_STATUS) == false) {
            var error = gl.getProgramInfoLog(this.shaderProgramObject);
            if (error.length > 0) {
                alert(error);
                uninitialize();
            }
        }
        else {
            console.log("Shader Program Link Successfully\n");
        }


        // Get Uniform Locations
        this.MVPUniform = gl.getUniformLocation(this.shaderProgramObject, "uMVPMatrix");
        this.textureSamplerUniform = gl.getUniformLocation(this.shaderProgramObject, "uTextureSampler");
        

        // provide Position - Color - normal 
        var square_position = new Float32Array([
            1.0, 1.0, 0.0,
            -1.0, 1.0, 0.0,
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0]);
        var pole_position = new Float32Array([
            0.2, 2.0, 0.0,
            0.0, 2.0, 0.0,
            0.0, -4.0, 0.0,
            0.2, -4.0, 0.0]);
        var square_texcoord = new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0]);

        // FLAG
        this.mesh = this.createFlagMesh(40, 20);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Positions
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.mesh.pos, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        // Texcoords
        this.vbo_uv = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_uv);
        gl.bufferData(gl.ARRAY_BUFFER, this.mesh.uv, gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);

        // Indices
        this.ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.mesh.idx, gl.STATIC_DRAW);

        gl.bindVertexArray(null);


        // POLE
        this.vao_pole = gl.createVertexArray();
        gl.bindVertexArray(this.vao_pole);

        // position of Pole
        this.vbo_pole = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_pole);

        gl.bufferData(gl.ARRAY_BUFFER, pole_position, gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.MyAttributes.KP_ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.MyAttributes.KP_ATTRIBUTE_POSITION);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);  //unbind vbo_pole position 
        gl.bindVertexArray(null); // unbind vao_pole

        // Enable Depth
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        // gl.enable(gl.CULL_FACE); // To enable culling
        
        // clear color
        gl.clearColor(0.20, 0.20, 0.20, 1.0);

        this.waveEffect = !this.waveEffect;

        // initialize perspective Matrix
        this.perspectiveProjectionMatrix = mat4.create();

        // set perspective projection
        mat4.perspective(this.perspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 0.1, 100.0);
    }

    createFlagMesh(w, h) {
        let positions = [];
        let texcoords = [];
        let indices = [];

        for (let y = 0; y <= h; y++) {
            for (let x = 0; x <= w; x++) {
                let u = x / w;
                let v = y / h;

                positions.push(u * 2.0 - 1.0, v * 2.0 - 1.0, 0.0);
                texcoords.push(u, 1.0 - v);
            }
        }

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let i = y * (w + 1) + x;

                indices.push(i, i + 1, i + w + 1);
                indices.push(i + 1, i + w + 2, i + w + 1);
            }
        }

        return {
            pos: new Float32Array(positions),
            uv: new Float32Array(texcoords),
            idx: new Uint16Array(indices)
        };

    }



    render() {
        // code
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.shaderProgramObject);

        // transformation
        var time = performance.now() / 1000.0;

        var modelViewMatrix = mat4.create();
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, translationMatrix, [0.0, 1.30, -6.0]);

        modelViewMatrix = translationMatrix;

        var modelViewprojectionMatrix = mat4.create();
        // still order is imp, first perspec..matrix then modelviewmat
        mat4.multiply(modelViewprojectionMatrix, this.perspectiveProjectionMatrix, modelViewMatrix);

        gl.uniform1f(gl.getUniformLocation(this.shaderProgramObject, "time"), time);
        gl.uniform1i(gl.getUniformLocation(this.shaderProgramObject, "wave"), this.waveEffect ? 1 : 0);
        gl.uniformMatrix4fv(this.MVPUniform, false, modelViewprojectionMatrix);

        // texture binding
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_smiley);
        gl.uniform1i(this.textureSamplerUniform, 0);

                
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.mesh.idx.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null); // unbind vao
        gl.bindTexture(gl.TEXTURE_2D, null);    // unbind texture Flag


        // Pole
        modelViewMatrix = mat4.identity(modelViewMatrix);
        translationMatrix = mat4.identity(translationMatrix);
        modelViewprojectionMatrix = mat4.identity(modelViewprojectionMatrix);
        mat4.translate(translationMatrix, translationMatrix, [-1.00, 0.0, -5.0]);
        modelViewMatrix = translationMatrix;
        mat4.multiply(modelViewprojectionMatrix, this.perspectiveProjectionMatrix, modelViewMatrix);
        gl.uniform1f(gl.getUniformLocation(this.shaderProgramObject, "time"), 0.0);
        gl.uniformMatrix4fv(this.MVPUniform, false, modelViewprojectionMatrix);
        gl.bindVertexArray(this.vao_pole);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        gl.bindVertexArray(null); // unbind vao

        gl.useProgram(null);

    }

    update() {
        // code
    }

     events(event, x_offset, y_offset) {
        if (event.type === 'keydown') {
            // this.sceneCam.cameraKeyDown(event);
        } else if (event.type === 'mousedown' || event.type === 'mousemove') {
            // this.sceneCam.cameraMouse(x_offset, y_offset);
        }
    }

    uninit() {
        // code
        if (this.vao) {
            gl.deleteVertexArray(this.vao);
            this.vao = null;
        }
        if (this.vbo) {
            gl.deleteBuffer(this.vbo);
            this.vbo = null;
        }
        if (this.shaderProgramObject) {
            if (this.fragmentShaderobject) {
                gl.detachShader(this.shaderProgramObject, this.fragmentShaderobject);
                gl.deleteShader(this.fragmentShaderobject);
                this.fragmentShaderobject = null;
            }
            if (this.vertexShaderObject) {
                gl.detachShader(this.shaderProgramObject, this.vertexShaderObject);
                gl.deleteShader(this.vertexShaderObject);
                this.vertexShaderObject = null;
            }
            gl.deleteProgram(this.shaderProgramObject);
            this.shaderProgramObject = null;
        }
    }
}





