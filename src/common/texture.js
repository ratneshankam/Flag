// Texture Loading

/**
 * loadTexture() - Loads png texture  
 * @param  {[String]} src [Path or src of the file]
 * @return {[WebGLTexture]} WebGLTexture [Texture]
 */
function loadTexture(src) {
    var texture = gl.createTexture();
    texture.image = new Image();
    texture.image.src = src;
    texture.image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            texture.image
        );
        if (isPowerOf2(texture.image.width) && isPowerOf2(texture.image.height))
            gl.generateMipmap(gl.TEXTURE_2D);
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        }
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    return texture;
}

/**
 * loadCubeMap() - Loads png texture  
 * @param  {[String]} image_Name [Path or src of the cubemap texture files]
 * @return {[WebGLTexture]} WebGLTexture [Texture]
 */
function loadCubeMap(image_Name) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var faces = [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
    for (var i = 0; i < faces.length; i++) {
        var url = image_Name[i];
        var face = faces[i];

        var image = new Image();

        image.onload = function (texture, face, image, url) {
            return function () {

                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.texImage2D(
                    face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            }
        }(texture, face, image, url);
        image.src = url;
    }
    return texture;
}

/**
 * loadColorTexture() - Creates and returns single color as texture value
 * @param  {[Array]} color [Color value to be created as texture]
 * @return {[WebGLTexture]}  WebGLTexture [Returns single color as texture]
 */
function loadColorTexture(color) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(color));
    return texture;
}

/**
 * loadObj() - Load .obj file from given path
 * @param  {[String]} path [.obj file path]
 * @return {[Text]}  Text [Parses and returns textual data from .obj file]
 */


///////////////////////////Model Loading Related/////////////////////

function loadObj(path) {
    // code
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType("text/plain");     // override default type of 'text/xml'
    xmlHttp.open("GET", path, false);
    xmlHttp.send();
    const data = parseObj(xmlHttp.response);
    return (data);
}

function parseObj(text) {
    // variable declarations
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];
    const objColors = [[0, 0, 0]];

    const objVertexData = [objPositions, objTexcoords, objNormals, objColors,];

    let webglVertexData = [
        [],   // positions
        [],   // texcoords
        [],   // normals
        [],   // colors
    ];

    const materialLibs = [];
    const geometries = [];
    let geometry;
    let groups = ['default'];
    let material = 'default';
    let object = 'default';

    // creates new geomtry if no geometry exists
    function newGeometry() {
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
    }

    function setGeometry() {
        if (!geometry) {
            const position = [];
            const texcoord = [];
            const normal = [];
            const color = [];
            webglVertexData = [
                position,
                texcoord,
                normal,
                color,
            ];
            geometry = {
                object,
                groups,
                material,
                data: {
                    position,
                    texcoord,
                    normal,
                    color,
                },
            };
            geometries.push(geometry);          // push all geometries
        }
    }

    function addVertex(vert) {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return;
            }
            const objIndex = parseInt(objIndexStr);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
            if (i === 0 && objColors.length > 1) {
                geometry.data.color.push(...objColors[index]);
            }
        });
    }

    const keywords = {
        v(meshes) {
            if (meshes.length > 3) {                 // adjust colors if vertices are of 4 len
                objPositions.push(meshes.slice(0, 3).map(parseFloat));
                objColors.push(meshes.slice(3).map(parseFloat));
            } else {
                objPositions.push(meshes.map(parseFloat));
            }
        },
        vn(meshes) {
            objNormals.push(meshes.map(parseFloat));
        },
        vt(meshes) {
            objTexcoords.push(meshes.map(parseFloat));
        },
        f(meshes) {
            setGeometry();
            const numTriangles = meshes.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(meshes[0]);
                addVertex(meshes[tri + 1]);
                addVertex(meshes[tri + 2]);
            }
        },
        mtllib(meshes, unparsedArgs) {
            materialLibs.push(unparsedArgs);
        },
        usemtl(meshes, unparsedArgs) {
            material = unparsedArgs;
            newGeometry();
        },
        o(meshes, unparsedArgs) {
            object = unparsedArgs;
            newGeometry();
        },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;    // \w* matches character  
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const meshes = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            continue;
        }
        handler(meshes, unparsedArgs);
    }

    return {
        geometries,
        materialLibs,
    };
}

/**
 * loadMtl() - Load .mtl (material) file from given path
 * @param  {[String]} path [.mtl file path]
 * @return {[Text]}  Text [Parses and returns textual data from .mtl file]
 */
function loadMtl(path) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType("text/plain");     // override default type of 'text/xml'
    xmlHttp.open("GET", path, false);
    xmlHttp.send();
    const mtlData = parseMtl(xmlHttp.response);
    return (mtlData);
}

function parseMtl(text) {
    const materials = {};
    let material;

    const keywords = {
        newmtl(meshes, unparsedArgs) {
            material = {};
            materials[unparsedArgs] = material;
        },

        // shininess
        Ns(meshes) {
            material.shininess = parseFloat(meshes[0]);
        },
        // ambient
        Ka(meshes) {
            material.ambient = meshes.map(parseFloat);
        },
        // diffuse
        Kd(meshes) {
            material.diffuse = meshes.map(parseFloat);
        },
        // specular
        Ks(meshes) {
            material.specular = meshes.map(parseFloat);
        },
        // emissive
        Ke(meshes) {
            material.emissive = meshes.map(parseFloat);
        },
        // diffuse map texture
        map_Kd(meshes, unparsedArgs) {
            const kd_line = unparsedArgs.split(" ");
            const tileFactor = "-s";
            if (tileFactor === kd_line[0]) {
                material.difTileX = kd_line[1];
                material.difTileY = kd_line[2];
                material.difTileZ = kd_line[3];
                material.diffuseMap = kd_line[4];
            }
            else {
                material.difTileX = 1.0;
                material.difTileY = 1.0;
                material.difTileZ = 1.0;
                material.diffuseMap = parseMapArgs(unparsedArgs);
            }
        },
        // specular map texture
        map_Ns(meshes, unparsedArgs) {
            material.specularMap = parseMapArgs(unparsedArgs);
        },
        // normal map texture
        map_Bump(meshes, unparsedArgs) {
            const mapBump_line = unparsedArgs.split(" ");
            const bumpFactor = "-bm";
            if (bumpFactor === mapBump_line[0]) {
                material.bumpFactor = mapBump_line[1];
                material.normalMap = mapBump_line[2];
            }
            else {
                material.bumpFactor = 0.0;
                material.normalMap = parseMapArgs(unparsedArgs);
            }

        },
        Ni(meshes) {
            material.opticalDensity = parseFloat(meshes[0]);
        },
        d(meshes) {
            material.opacity = parseFloat(meshes[0]);
        },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const meshes = line.split(' ').slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            continue;
        }
        handler(meshes, unparsedArgs);
    }
    return materials;
}

function parseMapArgs(unparsedArgs) {
    // TODO: handle options
    return unparsedArgs;
}

