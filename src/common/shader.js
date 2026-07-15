class Shader {

    constructor() {
        this.shaderProgram = gl.createProgram();
        this.uniforms = new Map();
        this.attributes = new Map();
        this.unknownAttributes = [];
    }

    /**
     * compileShader() - Compile Vertex or Fragment shader and attach to shader program object 
     * @param  {[String]} shaderIdentifier [Name to identify the shader]
     * @param  {[Boolean]} isVert [Shader to be compiled, if isVert is true the provide vertex shader]
     * @param  {[String]} shaderSource [Shader Source to be compiled]
     * @return  Compiled shader Object
     */
    compileShader(shaderIdentifier, isVert, shaderSource) {
        const shader = gl.createShader(isVert ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

        if (!compiled) {
            // output surrounding source code
            let info = "";
            const messages = gl.getShaderInfoLog(shader).split("\n");
            for (const message of messages) {
                const matches = message.match(/(WARNING|ERROR): ([0-9]*):([0-9]*):(.*)/i);
                if (matches && matches.length == 5) {
                    const lineNumber = parseInt(matches[3]) - 1;
                    const lines = shaderSource.split("\n");

                    info += `${matches[1]}: ${shaderIdentifier}:${lineNumber}: ${matches[4]}`;

                    for (let i = Math.max(0, lineNumber - 2); i < Math.min(lines.length, lineNumber + 3); i++) {
                        if (lineNumber === i) {
                            info += "->";
                        }
                        info += "\t" + lines[i] + "\n";
                    }
                }
                else {
                    info += message + "\n";
                }
            }

            throw new Error("Could not compile WebGL shaderProgram '" + shaderIdentifier + "': " + info);
        }
        else
        {
            gl.attachShader(this.shaderProgram, shader);
        }
        return shader;
    }

    getAttributeLocation(name) {
        const loc = this.attributes.get(name);
        if (loc === undefined) {
            if (this.unknownAttributes.find(n => n === name) === undefined) {
                console.warn("Attribute '%s' does not exist", name);
                this.unknownAttributes.push(name);
            }
            return -1;
        }
        return loc;
    }

    /**
     * linkProgram() - Compiile Vertex or Fragment shader 
     * @return Linked Program object
     */
    linkProgram() {
        // shader program
        gl.linkProgram(this.shaderProgram);

        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            var info = gl.getProgramInfoLog(this.shaderProgram);
            throw new Error('Could not link WebGL shaderProgram. \n\n' + info);
        }

        if (this.shaderProgram !== undefined) {
            const uniformCount = gl.getProgramParameter(this.shaderProgram, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; ++i) {
                const info = gl.getActiveUniform(this.shaderProgram, i);
                const loc = gl.getUniformLocation(this.shaderProgram, info.name);
                this.uniforms.set(info.name, { type: info.type, loc: loc });
            }

            const attribCount = gl.getProgramParameter(this.shaderProgram, gl.ACTIVE_ATTRIBUTES);
            for (let i = 0; i < attribCount; ++i) {
                const info = gl.getActiveAttrib(this.shaderProgram, i);
                const loc = gl.getAttribLocation(this.shaderProgram, info.name);
                this.attributes.set(info.name, loc);
            }
        }

        return this.shaderProgram;
    }

    /**
     * setUniform() - Compiile Vertex or Fragment shader 
    *  @param  {[String]} uniformName [Name of the uniform matching corresponding shader]
     * @param  value [Value to be passed]
     * @return {[void]}
     */
    setUniform(uniformName, value) {
        const uniform = this.uniforms.get(uniformName);

        if (uniform !== undefined) {
            switch (uniform.type) {
                case gl.FLOAT:
                    {
                        if (Array.isArray(value) || value instanceof Float32Array) {
                            gl.uniform1fv(uniform.loc, value);
                        } else {
                            gl.uniform1f(uniform.loc, value);
                        }
                        break;
                    }
                case gl.FLOAT_VEC2: gl.uniform2fv(uniform.loc, value); break;
                case gl.FLOAT_VEC3: gl.uniform3fv(uniform.loc, value); break;
                case gl.FLOAT_VEC4: gl.uniform4fv(uniform.loc, value); break;

                case gl.INT:
                    {
                        if (Array.isArray(value) || value instanceof Uint32Array || value instanceof Int32Array) {
                            gl.uniform1iv(uniform.loc, value);
                        } else {
                            gl.uniform1i(uniform.loc, value);
                        }
                        break;
                    }
                case gl.INT_VEC2: gl.uniform2iv(uniform.loc, value); break;
                case gl.INT_VEC3: gl.uniform3iv(uniform.loc, value); break;
                case gl.INT_VEC4: gl.uniform4iv(uniform.loc, value); break;

                case gl.FLOAT_MAT2: gl.uniformMatrix2fv(uniform.loc, false, value); break;
                case gl.FLOAT_MAT3: gl.uniformMatrix3fv(uniform.loc, false, value); break;
                case gl.FLOAT_MAT4: gl.uniformMatrix4fv(uniform.loc, false, value); break;
            }
        }
        else {
            console.warn("Unkown uniform: " + uniformName);
        }
    }

    deleteShaders()
    {
        if (this.shaderProgram > 0) {
            gl.useProgram(this.shaderProgram);
    
            var shaderObjects = gl.getAttachedShaders(this.shaderProgram);
            for (let i = 0; i < shaderObjects.length; i++) {
                gl.detachShader(this.shaderProgram, shaderObjects[i]);
                gl.deleteShader(shaderObjects[i]);
                shaderObjects[i] = null;
            }
            gl.useProgram(null);
            gl.deleteProgram(this.shaderProgram);
            this.shaderProgram = null;
        }
    }
}
