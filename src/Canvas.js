var canvas = null;
var bFullscreen = false;
var canvas_original_width;
var canvas_original_height;

var gFpsCounter = null;
var camMove = false;
var firstMouse = true;

var requestAnimationFrame = window.requestAnimationFrame ||         // Chrome
    window.mozRequestAnimationFrame ||      // Mozilla
    window.webkitRequestAnimationFrame ||   // Safari
    window.oRequestAnimationFrame ||        // Opera
    window.msRequestAnimationFrame;         // Edge

function main() {
    // Code
    // Get canvas
    canvas = document.getElementById("WebGLDemo");
    if (!canvas) {
        console.error("Failed to obtain canvas");
        return;
    }
    console.log("Successfully obtained canvas");

    // Backup canvas dimensions
    canvas_original_width = canvas.width;
    canvas_original_height = canvas.height;

    // Initialize
    initialize();

    // Resize (warmup resize)
    resize();

    // Display
    display();

    // Add keyboard and mouse event listeners
    window.addEventListener("keydown", keyDown, false);
    window.addEventListener("mousemove", mouseMove, false);
    window.addEventListener("mouseup", mouseButton, false);
    window.addEventListener("resize", resize, false);

    const fps = document.getElementById("fps");
    if (fps) {
        gFpsCounter = new FPSCounter(fps);
    }
}

function toggleFullscreen() {
    const fullscreenElement = document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;

    if (!fullscreenElement) {
        if (canvas.requestFullscreen) canvas.requestFullscreen();
        else if (canvas.mozRequestFullScreen) canvas.mozRequestFullScreen();
        else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen();
        else if (canvas.msRequestFullscreen) canvas.msRequestFullscreen();
        bFullscreen = true;
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        bFullscreen = false;
    }
}

function initialize() {
    // code
    // Get Web 2.0 context from canvas
    gl = canvas.getContext("webgl2");
    if (!gl)
        console.error("Failed to obtain WebGL 2.0 context");
    else
        console.log("Successfully obtained WebGL 2.0 context");

    // Set viewport width and height of context
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;;

    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    // add scenes here
    // scenes.push(new openingScene());
    // scenes.push(new RiverScene());
    // scenes.push(new SphereMap("./resources/textures/cubemap/saturn.jpg"));
    // scenes.push(new testScene());
    // scenes.push(new FlagScene());
    scenes.push(new Scene2());
    scenes.push(new Scene3());
    // scenes.push(new Scene4());

    scenes.forEach(scene => {
        scene.init();
    });

    audio = new Audio('./resources/audio/SaareJahanSeAchaOnSitar.wav');

    perspectiveProjectionMatrix = mat4.create();

    // toggleFullscreen();

    FlagToggle = false;
    timer = 0;
}

function resize() {
    // code
    if (bFullscreen == true) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    else {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;
    }

    if (canvas.height == 0)
        canvas.height = 1;

    gl.viewport(0, 0, canvas.width, canvas.height);
    mat4.perspective(perspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 0.1, 10000.0);
}

function display() {
    // code
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (timer > 100) 
    { 
        if (currentScene < 3) {
            let scene = scenes[currentScene];
            if (!scene.sceneComplete) {
                scene.render();
            } else {
                scenes.push(new Scene2());
                currentScene++;
            }
        }
    }
    else {
        timer++;
    }

    if (gFpsCounter) {
        gFpsCounter.update();
    }

    update();

    // Double buffer emulation
    requestAnimationFrame(display, canvas);

}

function update() {
    // code
    scenes.forEach(scene => {
        scene.update();
    });
}

// Keyboard event listener
function keyDown(event) {
    // Code
    scenes.forEach(scene => {
        scene.events(event, 0, 0);
    });
    switch (event.keyCode) {
        case 27:
            uninitialize();
            window.close();
            break;
        case 70:
            toggleFullscreen();
            audio.play();
            break;
        case 80: // P --> play the audio
            audio.play();
            break;
        case 48: // 0 --> pause the audio
            audio.pause();
            break;
        case 49: // (1) --> seek audio
            audioSeekFactor -= 2;
            audio.fastSeek(audioSeekFactor);
            break;
        case 50: // (2) --> seek audio
            audioSeekFactor += 2;
            if (audioSeekFactor <= 0)
                audioSeekFactor = 0;
            audio.fastSeek(audioSeekFactor);
            break;
    }
}

// Mouse move event listener
function mouseMove(event) {

    var x_pos = event.offsetX;
    var y_pos = event.offsetY;

    if (firstMouse) {
        lastX = x_pos;
        lastY = y_pos;
        firstMouse = false;
    }

    var x_offset = x_pos - lastX;
    var y_offset = lastY - y_pos;

    lastX = x_pos;
    lastY = y_pos;

    if (camMove == false) {
        x_offset = event.clientX / canvas.width * 2 - 1;
        y_offset = (event.clientY / canvas.height * 2 - 1) * -1;
    }
    if (camMove == true) {
        scenes.forEach(scene => {
            scene.events(event, x_offset, y_offset);
        });
    }
}
// Mouse button event listener
function mouseButton(event) {
    switch (event.button) {

        // left click
        case 0:
            camMove = true;
            break;
        // middle button click
        case 1:
            camMove = false;
            break;

        default:
            break;
    }
}

function uninitialize() {
    // code
    if (scenes.length > 0) {
        scenes.forEach(scene => {
            scene.uninit();
        });
    }

    window.removeEventListener("keydown", keyDown, false);
    window.removeEventListener("mousemove", mouseMove, false);
    window.removeEventListener("mouseup", mouseButton, false);
    window.removeEventListener("resize", resize, false);
}

