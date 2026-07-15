// WebGL Related Variables

const vertexAttributeEnum =
{
    AMC_ATTRIBUTE_POSITION: 0,
    AMC_ATTRIBUTE_TEXTURE0: 1,
    AMC_ATTRIBUTE_NORMAL: 2,
    AMC_ATTRIBUTE_COLOR: 3,
    AMC_ATTRIBUTE_TANGENT: 4

}


var soundtrack = null;

var audioSeekFactor = 0;

var scenes = [];

// var sceneCam = new CameraUpdated([0.0, 0.0, 4.0], [0.0, 1.0, 0.0], 0.0, 0.0);

var FlagToggle = true;

var currentScene = 0;

var perspectiveProjectionMatrix;


// File Loading

/**
 * loadFile() - Loads textual file from local  
 * @param  {[String]} path [Path of the file]
 * @return {[Text]} Text [Textual data from the file]
 */
function loadFile(path) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType("text/plain");
    xmlHttp.open("GET", path, false);
    xmlHttp.send();

    return (xmlHttp.response);
}


/**
 * degToRad() - Convert degree to radians.
 * @param  {[Float]} number []
 * @return {[Float]}   [Degree]
 */
function degToRad(degree) {
    return (degree * Math.PI / 180.0)
}


/**
 * isPowerOf2() - To check if number is of power 2.
 * @param  {[Integer]} number []
 * @return {[Boolean]}   [Returns true if number is of power 2]
 */
function isPowerOf2(number) {
    return (number & (number - 1)) === 0;
}


/**
 * Creates a frames-per-second counter which displays its output as
 * text in a given element on the web page.
 * @param {!Element} outputElement The HTML element on the web page in
 *   which to write the current frames per second.
 * @param {!number} opt_numSamples The number of samples to take
 *   between each update of the frames-per-second.
 */
function FPSCounter(outputElement, opt_numSamples) {
    this.outputElement_ = outputElement;
    this.startTime_ = new Date();
    if (opt_numSamples) {
        this.numSamples_ = opt_numSamples;
    } else {
        this.numSamples_ = 200;
    }
    this.curSample_ = 0;
    this.curFPS_ = 0;
}


/**
 * Updates this FPSCounter.
 * @return {boolean} whether this FPS counter actually updated this tick.
 */
FPSCounter.prototype.update = function () {
    if (++this.curSample_ >= this.numSamples_) {
        var curTime = new Date();
        var startTime = this.startTime_;
        var diff = curTime.getTime() - startTime.getTime();
        this.curFPS_ = (1000.0 * this.numSamples_ / diff);
        var str = "" + this.curFPS_.toFixed(1) + " frames per second";
        this.outputElement_.innerHTML = str;
        this.curSample_ = 0;
        this.startTime_ = curTime;
        return true;
    }
    return false;
};


/**
 * Gets the most recent FPS measurement.
 * @return {number} the most recent FPS measurement.
 */
FPSCounter.prototype.getFPS = function () {
    return this.curFPS_;
};


FPSCounter.prototype.reset = function () {
    this.curSample_ = 0;
    this.curFPS_ = 0;
}

