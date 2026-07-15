class Scene2 {
    constructor() {
        this.sceneCam = new CameraUpdated([0.0, 0.0, 4.0], [0.0, 1.0, 0.0], 0.0, 0.0);
        this.deltaTime = 0;
        this.sceneComplete = false;
        var images = ["./resources/textures/cubemap/right.jpg",
            "./resources/textures/cubemap/left.jpg",
            "./resources/textures/cubemap/top.jpg",
            "./resources/textures/cubemap/bottom.jpg",
            "./resources/textures/cubemap/front.jpg",
            "./resources/textures/cubemap/back.jpg"];
        this.cubemap = new CubeMap(images);
        this.terrain = new Terrain();
        this.flagScene = new FlagScene();
    }

    init() {
        this.cubemap.init();
        this.terrain.init();
        this.flagScene.init();
        this.projectionMatrix = mat4.create();
        mat4.perspective(
            this.projectionMatrix,
            glMatrix.toRadian(45.0),
            canvas.width / canvas.height,
            0.1,
            100.0
        );
    
        this.sceneCam.startBezierTransition([0, 1.6, 5],
            [0, 1.6, -10],
            [0, 1.6, -25],
            [0, 1.6, 4],
            [0, 1.6, -11],
            [0, 1.6, -31],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0], 10000
        );
        FlagToggle = false;
    }

    render() {
        var translationMatrix = mat4.create();
        var rotationMatrix = mat4.create();
        var modelMatrix = mat4.create();
        mat4.translate(translationMatrix, translationMatrix, [-5.0, -7.0, -35.0]); mat4.rotate(rotationMatrix, rotationMatrix, 350.3, [0.0, 1.0, 0.0]);
        mat4.multiply(modelMatrix, translationMatrix, rotationMatrix);
    
        gl.disable(gl.DEPTH_TEST);
        this.cubemap.render();
        this.terrain.render(this.sceneCam.getViewMatrix());
        gl.enable(gl.DEPTH_TEST);
        this.flagScene.render(this.sceneCam.getViewMatrix());
    
    
        if (this.deltaTime < 700) {
            this.deltaTime++;
        } else {
            this.sceneComplete = true;
        }
    }

    update() {
        this.sceneCam.updateBezier();
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
    
    
        if (this.cubemap)
            this.cubemap.uninit();
    }
}
