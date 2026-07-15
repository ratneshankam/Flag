const YAW = -90.0;
const PITCH = 0.0;
const SPEED = 1.0;
const MOUSE_SENSITIVITY = 0.1;
const ZOOM = 45.0;
var DELTA = 0.5;

const cameraMovement = {
    FORWARD: 0,
    BACKWARD: 1,
    LEFT: 2,
    RIGHT: 3,
    UP: 4,
    DOWN: 5,
}





class CameraUpdated {
    position;
    front;
    up;
    right;
    worldup;

    yaw;
    pitch;

    movementSpeed;
    mouseSensitivity;
    zoom;

    splinePoints;
    splineFrontVectors;
    splineIndex;
    splineT;
    splineSpeed;

    // Niraj -- Camera -- Start
    // --- New fields for Bezier animation ---
    bezierEyePoints;
    bezierCenterPoints;
    bezierUpVectors;
    bezierStartTime;
    bezierDuration;
    bezierAnimating;
    // Niraj -- Camera -- End

    constructor(position, worldup, yaw, pitch) {
        this.position = new Float32Array(position);
        this.front = new Float32Array(3);        
        this.up = new Float32Array(3);
        this.right = new Float32Array(3);
        this.worldup = new Float32Array(worldup);

        this.yaw = YAW;
        this.pitch = pitch;

        this.movementSpeed = SPEED;
        this.mouseSensitivity = MOUSE_SENSITIVITY;
        this.zoom = ZOOM;

        // Initialize spline variables
        this.splinePoints = [];
        this.splineFrontVectors = [];
        this.splineIndex = 0;
        this.splineT = 0;
        this.splineSpeed = 0.005; // Adjust speed as necessary



        // Niraj -- Camera -- Start
        // initialize bezier fields
        this.bezierEyePoints = [];
        this.bezierCenterPoints = [];
        this.bezierUpVectors = [];
        this.bezierStartTime = 0;
        this.bezierDuration = 0;
        this.bezierAnimating = false;
        // Niraj -- Camera -- End 

        this.updateCameraVectors();
    }

    getFrontVector() {
        return (this.front);
    }

    updateCameraVectors() {
        var tempFront = new Float32Array(3);
        tempFront[0] = Math.cos(degToRad(this.yaw * Math.cos(degToRad(this.pitch))));
        tempFront[1] = Math.sin(degToRad(this.pitch));
        tempFront[2] = Math.sin(degToRad(this.yaw * Math.cos(degToRad(this.pitch))));

        vec3.normalize(this.front, tempFront);
        vec3.cross(this.right, this.front, this.worldup);
        vec3.normalize(this.right, this.right);
        vec3.cross(this.up, this.right, this.front);
        vec3.normalize(this.up, this.up);
    }

    getViewMatrix() {
        var add = new Float32Array(3);

        add[0] = this.position[0] + this.front[0];
        add[1] = this.position[1] + this.front[1];
        add[2] = this.position[2] + this.front[2];

        let targetViewMatrix = mat4.create();

        mat4.lookAt(targetViewMatrix, this.position, add, this.up);

        return (targetViewMatrix);
    }

    processKeyBoard(camDirection, deltaTime) {
        var velocity = this.movementSpeed * deltaTime;
        switch (camDirection) {
            case cameraMovement.FORWARD:
                this.position[0] += velocity * deltaTime * this.front[0];
                this.position[1] += velocity * deltaTime * this.front[1];
                this.position[2] += velocity * deltaTime * this.front[2];
                break;

            case cameraMovement.BACKWARD:
                this.position[0] -= velocity * deltaTime * this.front[0];
                this.position[1] -= velocity * deltaTime * this.front[1];
                this.position[2] -= velocity * deltaTime * this.front[2];
                break;

            case cameraMovement.UP:
                this.position[0] += velocity * deltaTime * this.up[0];
                this.position[1] += velocity * deltaTime * this.up[1];
                this.position[2] += velocity * deltaTime * this.up[2];
                break;

            case cameraMovement.DOWN:
                this.position[0] -= velocity * deltaTime * this.up[0];
                this.position[1] -= velocity * deltaTime * this.up[1];
                this.position[2] -= velocity * deltaTime * this.up[2];
                break;

            case cameraMovement.LEFT:
                this.position[0] += velocity * deltaTime * this.right[0];
                this.position[1] += velocity * deltaTime * this.right[1];
                this.position[2] += velocity * deltaTime * this.right[2];
                break;

            case cameraMovement.RIGHT:
                this.position[0] -= velocity * deltaTime * this.right[0];
                this.position[1] -= velocity * deltaTime * this.right[1];
                this.position[2] -= velocity * deltaTime * this.right[2];
                break;

            default:
                break;
        }
    }

    cameraMouse(x_offset, y_offset) {

        x_offset *= MOUSE_SENSITIVITY;
        y_offset *= MOUSE_SENSITIVITY;

        this.pitch -= y_offset;
        this.yaw -= x_offset;

        //wrap pitch (0 to 89.0) and (0 to -89.0)
        if (this.pitch > 89.0) {
            this.pitch = 89.0;
        }
        else if (this.pitch < -89.0) {
            this.pitch = -89.0;
        }

        this.updateCameraVectors();
    }

    cameraKeyDown(event) {
        switch (event.keyCode) {
            case 84: //T toggle
                FlagToggle = !FlagToggle;
                console.log("Flag Toggle: " + FlagToggle);
                break;
            case 87: //W , forward
                this.processKeyBoard(cameraMovement.FORWARD, DELTA);
                break;

            case 83: //S, backward
                this.processKeyBoard(cameraMovement.BACKWARD, DELTA);
                break;

            case 65: //A, left
                this.processKeyBoard(cameraMovement.LEFT, DELTA);
                break;

            case 68: //D right
                this.processKeyBoard(cameraMovement.RIGHT, DELTA);
                break;

            case 81://Q up
                this.processKeyBoard(cameraMovement.DOWN, DELTA);
                break;

            case 69: //E down
                this.processKeyBoard(cameraMovement.UP, DELTA);
                break;
            case 67: //C print camera position and front
                console.log("Position = [" + parseFloat(this.position[0]).toFixed(3) + "," + parseFloat(this.position[1]).toFixed(3) + "," + parseFloat(this.position[1]).toFixed(3) + "]");
                console.log("Front = [" + parseFloat(this.front[0]).toFixed(3) + "," + parseFloat(this.front[1]).toFixed(3) + "," + parseFloat(this.front[2]).toFixed(3) + "]");
            break;

            default:
                break;
        }
    }

    // Spline functions
    addSplinePoint(point, frontVector) {
        this.splinePoints.push(new Float32Array(point));
        this.splineFrontVectors.push(new Float32Array(frontVector));
    }

    clearSplinePoints() {
        this.splinePoints = [];
        this.splineFrontVectors = [];
        this.splineIndex = 0;
        this.splineT = 0;
    }

    updateSpline(deltaTime) {
        if (this.splinePoints.length < 4) return; // Need at least 4 points for Catmull-Rom spline

        this.splineT += this.splineSpeed * deltaTime;

        if (this.splineT > 1.0) {
            this.splineT = 0.0;
            this.splineIndex++;
            if (this.splineIndex >= this.splinePoints.length - 3) {
                this.splineIndex = 0;
            }
        }

        var p0 = this.splinePoints[this.splineIndex];
        var p1 = this.splinePoints[this.splineIndex + 1];
        var p2 = this.splinePoints[this.splineIndex + 2];
        var p3 = this.splinePoints[this.splineIndex + 3];

        var f0 = this.splineFrontVectors[this.splineIndex];
        var f1 = this.splineFrontVectors[this.splineIndex + 1];
        var f2 = this.splineFrontVectors[this.splineIndex + 2];
        var f3 = this.splineFrontVectors[this.splineIndex + 3];

        this.position = this.catmullRomSpline(p0, p1, p2, p3, this.splineT);
        this.front = this.catmullRomSpline(f0, f1, f2, f3, this.splineT);
        this.updateCameraVectors();
    }

    catmullRomSpline(p0, p1, p2, p3, t) {
        var t2 = t * t;
        var t3 = t2 * t;

        var v0 = (p2[0] - p0[0]) * 0.5;
        var v1 = (p3[0] - p1[0]) * 0.5;
        var x = (2 * p1[0] - 2 * p2[0] + v0 + v1) * t3 + (-3 * p1[0] + 3 * p2[0] - 2 * v0 - v1) * t2 + v0 * t + p1[0];

        v0 = (p2[1] - p0[1]) * 0.5;
        v1 = (p3[1] - p1[1]) * 0.5;
        var y = (2 * p1[1] - 2 * p2[1] + v0 + v1) * t3 + (-3 * p1[1] + 3 * p2[1] - 2 * v0 - v1) * t2 + v0 * t + p1[1];

        v0 = (p2[2] - p0[2]) * 0.5;
        v1 = (p3[2] - p1[2]) * 0.5;
        var z = (2 * p1[2] - 2 * p2[2] + v0 + v1) * t3 + (-3 * p1[2] + 3 * p2[2] - 2 * v0 - v1) * t2 + v0 * t + p1[2];

        return new Float32Array([x, y, z]);
    }




    // Niraj -- Camera -- Start
    // --- New method: start a quadratic Bezier camera transition ---
    // startBezierTransition(p0, p1, p2, durationMs) {
    //     this.bezierPoints = [new Float32Array(p0), new Float32Array(p1), new Float32Array(p2)];
    //     this.bezierStartTime = performance.now();
    //     this.bezierDuration = durationMs;
    //     this.bezierAnimating = true;
    // }
    
    // // --- Helper: quadratic Bezier interpolation ---
    // bezierInterpolate(t, p0, p1, p2) {
    //     const invT = 1 - t;
    //     return new Float32Array([
    //         invT*invT*p0[0] + 2*invT*t*p1[0] + t*t*p2[0],
    //         invT*invT*p0[1] + 2*invT*t*p1[1] + t*t*p2[1],
    //         invT*invT*p0[2] + 2*invT*t*p1[2] + t*t*p2[2]
    //     ]);
    // }
    
    // // --- New method: update camera position along Bezier ---
    // updateBezier() {
    //     if (!this.bezierAnimating) return;
    
    //     const now = performance.now();
    //     const elapsed = now - this.bezierStartTime;
    //     let t = elapsed / this.bezierDuration;
    //     if (t > 1) {
    //         t = 1;
    //         this.bezierAnimating = false;
    //     }
    
    //     const [p0, p1, p2] = this.bezierPoints;
    //     this.position = this.bezierInterpolate(t, p0, p1, p2);
    
    //     // keep looking direction consistent
    //     this.updateCameraVectors();
    // }


    // --- Start a quadratic Bezier camera transition ---
    startBezierTransition(eyeP0, eyeP1, eyeP2,
                          centerP0, centerP1, centerP2,
                          upP0, upP1, upP2,
                          durationMs) {
        this.bezierEyePoints = [new Float32Array(eyeP0), new Float32Array(eyeP1), new Float32Array(eyeP2)];
        this.bezierCenterPoints = [new Float32Array(centerP0), new Float32Array(centerP1), new Float32Array(centerP2)];
        this.bezierUpVectors = [new Float32Array(upP0), new Float32Array(upP1), new Float32Array(upP2)];
        this.bezierStartTime = performance.now();
        this.bezierDuration = durationMs;
        this.bezierAnimating = true;
    }

    // --- Helper: quadratic Bezier interpolation ---
    bezierInterpolate(t, p0, p1, p2) {
        const invT = 1 - t;
        return new Float32Array([
            invT*invT*p0[0] + 2*invT*t*p1[0] + t*t*p2[0],
            invT*invT*p0[1] + 2*invT*t*p1[1] + t*t*p2[1],
            invT*invT*p0[2] + 2*invT*t*p1[2] + t*t*p2[2]
        ]);
    }

    // --- Update camera along Bezier ---
    updateBezier() {
        if (!this.bezierAnimating) return;

        const now = performance.now();
        const elapsed = now - this.bezierStartTime;
        let t = elapsed / this.bezierDuration;
        if (t > 1) {
            t = 1;
            this.bezierAnimating = false;
        }

        const [e0, e1, e2] = this.bezierEyePoints;
        const [c0, c1, c2] = this.bezierCenterPoints;
        const [u0, u1, u2] = this.bezierUpVectors;

        this.position = this.bezierInterpolate(t, e0, e1, e2);
        const newCenter = this.bezierInterpolate(t, c0, c1, c2);
        const newUp = this.bezierInterpolate(t, u0, u1, u2);

        // recompute front vector based on new center
        const frontVec = [
            newCenter[0] - this.position[0],
            newCenter[1] - this.position[1],
            newCenter[2] - this.position[2]
        ];
        vec3.normalize(this.front, frontVec);

        // recompute up vector
        vec3.normalize(this.up, newUp);

        // recompute right vector
        vec3.cross(this.right, this.front, this.up);
        vec3.normalize(this.right, this.right);
    }
    // Niraj -- Camera -- End

}    


/*

// Helper to run a sequence of transitions one after another
function runCircularShot(camera) {
  const segments = [
    {
      eye:  [12.0, 6.0, 12.0],
      ctrl: [18.0, 8.0, 6.0],
      end:  [20.0, 6.0, 0.0]
    },
    {
      eye:  [20.0, 6.0, 0.0],
      ctrl: [22.0, 8.0, -10.0],
      end:  [15.0, 6.0, -20.0]
    },
    {
      eye:  [15.0, 6.0, -20.0],
      ctrl: [0.0, 8.0, -25.0],
      end:  [-15.0, 6.0, -20.0]
    },
    {
      eye:  [-15.0, 6.0, -20.0],
      ctrl: [-22.0, 8.0, -6.0],
      end:  [-12.0, 6.0, 12.0]
    }
  ];

  const center = [[0.000,0.000,-1.000],[0.000,0.000,-1.000],[0.000,0.000,-1.000]];
  const up = [[0,1,0],[0,1,0],[0,1,0]];
  const duration = 2000;

  let index = 0;

  function nextSegment() {
    if (index >= segments.length) return; // finished orbit

    const seg = segments[index];
    camera.startBezierTransition(
      seg.eye, seg.ctrl, seg.end,
      center[0], center[1], center[2],
      up[0], up[1], up[2],
      duration
    );

    // Schedule next segment when this one finishes
    setTimeout(() => {
      index++;
      nextSegment();
    }, duration);
  }

  nextSegment();
}

// Start after 3 seconds
setTimeout(() => {
  runCircularShot(this.scenes[0].sceneCam);
}, 3000);

*/