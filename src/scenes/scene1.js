class Scene1 {
    constructor() {
        //position      // up-vector   //yaw //pitch         
        this.sceneCam = new CameraUpdated([0.0, 0.0, 4.0], [0.0, 1.0, 0.0], 0.0, 0.0);
        this.deltatime = 0.0;
        this.sceneComplete = false;

        // list of models
        this.models = [];

        // cubemap images
        var images = ["./resources/textures/cubemap/right.jpg",
            "./resources/textures/cubemap/left.jpg",
            "./resources/textures/cubemap/top.jpg",
            "./resources/textures/cubemap/bottom.jpg",
            "./resources/textures/cubemap/front.jpg",
            "./resources/textures/cubemap/back.jpg"];
        this.cubemap = new CubeMap(images);

        this.terrain = new Terrain();
        this.water = new Water();

        // Fire effect
        this.fireScene = new fireScene();

        // framebuffer
        this.sceneFbo = new Framebuffer();

        this.shader = new Shader();

        this.shader.compileShader("fullsceen", true, loadFile("./src/shaders/fullscreen.vert"));
        this.shader.compileShader("fullsceen", false, loadFile("./src/shaders/simple.frag"));

        // linking
        this.shader.linkProgram();

        this.flagScene = new FlagScene();

        this.timer = 0;
    }
    async loadModelsAsync() {
        const loadPromises = this.models.map(model => {
            this[model.name] = new ModelLoader();
            return this[model.name].loadModel(model.path);
        });

        try {
            await Promise.all(loadPromises);
            console.log('All models loaded successfully');
        } catch (error) {
            console.error('Error loading models:', error);
        }
    }
    init() {
        // initialize all the scene models
        this.models = [
            { name: 'Scene7', path: './resources/models/scene7/funeralScene' },
        ];

        // this.loadModelsAsync();

        // cubemap
        this.cubemap.init();

        // terrain
        this.terrain.init();

        // water
        this.water.init();

        // Fire
        this.fireScene.init();

        // Flag Scene
        this.flagScene.init();

        // Niraj -- Added -- to render fire -- Start
        // Create projection matrix once per frame (or better: once in init and reuse)
        this.projectionMatrix = mat4.create();
        mat4.perspective(
            this.projectionMatrix,
            glMatrix.toRadian(45.0),                // field of view in radians
            canvas.width / canvas.height,          // aspect ratio
            0.1,                                   // near plane
            100.0                                  // far plane
        );
        // Niraj -- Added -- to render fire -- End

        // fbo
        this.sceneFbo.createFBO(1024, 1024);

    //    this.sceneCam.startBezierTransition( 
    //         // Eye (camera position)
    //         [0, 1.6, 5],       // start (back)
    //         [0, 1.6, -10],     // control (same straight line)
    //         [0, 1.6, -25],     // end (far forward)

    //         // Center (look-at target)
    //         [0, 1.6, 4],       
    //         [0, 1.6, -11],     
    //         [0, 1.6, -31],    

    //         // Up vectors
    //         [0, 1, 0],
    //         [0, 1, 0],
    //         [0, 1, 0],

    //         2000 // increase time for long smooth travel (12 sec)
    //     );

        FlagToggle = true;
    }

    render() {

        var translationMatrix = mat4.create();
        var rotationMatrix = mat4.create();
        var modelMatrix = mat4.create();

        mat4.translate(translationMatrix, translationMatrix, [-5.0, -7.0, -35.0]);

        mat4.rotate(rotationMatrix, rotationMatrix, 350.3, [0.0, 1.0, 0.0]);

        mat4.multiply(modelMatrix, translationMatrix, rotationMatrix);

        // bind and render the scene in fbo
         this.sceneFbo.bindFBO();
        /// FBO Rendering starts ///    
        // render cubemap
        gl.disable(gl.DEPTH_TEST);
        this.cubemap.render();
        this.terrain.render(this.sceneCam.getViewMatrix());
        this.water.render(this.sceneCam.getViewMatrix());
        this.flagScene.render(this.sceneCam.getViewMatrix());
        gl.enable(gl.DEPTH_TEST);

        // draw models
        // this.models.forEach(model => {
        //     this[model.name].draw(modelMatrix, this.sceneCam.getViewMatrix());
        // });
        ///  FBO Rendering Ends ///

        // bind the default fbo render scene as normal
        // this.sceneFbo.bindDefaultFBO();
        // gl.useProgram(this.shader.shaderProgram);
        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, this.sceneFbo.fboTexture);
        // this.shader.setUniform("u_textureSampler", 0);

        // gl.drawArrays(gl.TRIANGLES, 0, 6);
        // gl.useProgram(null);

        // mat4.translate(translationMatrix, translationMatrix, [0.0, 6.0, -3.0]);

        // this.fireScene._renderFire(gl, this.fireScene.fire, this.sceneCam.getViewMatrix(), this.projectionMatrix);  // Commented -- Niraj

        // Pass 2: present FBO to default framebuffer
        this.sceneFbo.bindDefaultFBO();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.shader.shaderProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sceneFbo.fboTexture);
        this.shader.setUniform("u_textureSampler", 0);

        // Fullscreen quad
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Cleanup
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.useProgram(null);

        // this.sceneCam.updateBezier();
        // if (!this.sceneComplete) {
        //     this.timer++;
        // }
        // if (this.timer > 100) {
        //     this.sceneComplete = true;
        // }
    }

    update() {
    }

    events(event, x_offset, y_offset) {
        if (event.type === 'keydown') {

            this.sceneCam.cameraKeyDown(event);
        }
        else if (event.type === 'mousedown' || event.type === 'mousemove') {
            this.sceneCam.cameraMouse(x_offset, y_offset);
        }
    }

    uninit() {

        if (this.shader)
            this.shader.deleteShaders();
        if (this.sceneFbo)
            this.sceneFbo.uninit();
        if (this.cubemap)
            this.cubemap.uninit();

        this.models.forEach(model => {
            this[model.name].uninitialize();
        });
    }
}