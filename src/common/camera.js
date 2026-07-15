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

class Camera {
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
}
