"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Ui=Ops.Ui || {};
Ops.Anim=Ops.Anim || {};
Ops.Html=Ops.Html || {};
Ops.Math=Ops.Math || {};
Ops.Vars=Ops.Vars || {};
Ops.Array=Ops.Array || {};
Ops.Value=Ops.Value || {};
Ops.Cables=Ops.Cables || {};
Ops.String=Ops.String || {};
Ops.Boolean=Ops.Boolean || {};
Ops.Devices=Ops.Devices || {};
Ops.Sidebar=Ops.Sidebar || {};
Ops.Gl.Phong=Ops.Gl.Phong || {};
Ops.WebAudio=Ops.WebAudio || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Deprecated=Ops.Deprecated || {};
Ops.Devices.Mouse=Ops.Devices.Mouse || {};
Ops.Deprecated.Array=Ops.Deprecated.Array || {};
Ops.Devices.Keyboard=Ops.Devices.Keyboard || {};
Ops.Gl.ShaderEffects=Ops.Gl.ShaderEffects || {};
Ops.Deprecated.Json3d=Ops.Deprecated.Json3d || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};
Ops.Gl.TextureEffects.Noise=Ops.Gl.TextureEffects.Noise || {};



// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    fpsLimit = op.inValue("FPS Limit", 0),
    trigger = op.outTrigger("trigger"),
    width = op.outNumber("width"),
    height = op.outNumber("height"),
    reduceFocusFPS = op.inValueBool("Reduce FPS not focussed", true),
    reduceLoadingFPS = op.inValueBool("Reduce FPS loading"),
    clear = op.inValueBool("Clear", true),
    clearAlpha = op.inValueBool("ClearAlpha", true),
    fullscreen = op.inValueBool("Fullscreen Button", false),
    active = op.inValueBool("Active", true),
    hdpi = op.inValueBool("Hires Displays", false),
    inUnit = op.inSwitch("Pixel Unit", ["Display", "CSS"], "Display");

op.onAnimFrame = render;
hdpi.onChange = function ()
{
    if (hdpi.get()) op.patch.cgl.pixelDensity = window.devicePixelRatio;
    else op.patch.cgl.pixelDensity = 1;

    op.patch.cgl.updateSize();
    if (CABLES.UI) gui.setLayout();

    // inUnit.setUiAttribs({ "greyout": !hdpi.get() });

    // if (!hdpi.get())inUnit.set("CSS");
    // else inUnit.set("Display");
};

active.onChange = function ()
{
    op.patch.removeOnAnimFrame(op);

    if (active.get())
    {
        op.setUiAttrib({ "extendTitle": "" });
        op.onAnimFrame = render;
        op.patch.addOnAnimFrame(op);
        op.log("adding again!");
    }
    else
    {
        op.setUiAttrib({ "extendTitle": "Inactive" });
    }
};

const cgl = op.patch.cgl;
let rframes = 0;
let rframeStart = 0;

if (!op.patch.cgl) op.uiAttr({ "error": "No webgl cgl context" });

const identTranslate = vec3.create();
vec3.set(identTranslate, 0, 0, 0);
const identTranslateView = vec3.create();
vec3.set(identTranslateView, 0, 0, -2);

fullscreen.onChange = updateFullscreenButton;
setTimeout(updateFullscreenButton, 100);
let fsElement = null;

let winhasFocus = true;
let winVisible = true;

window.addEventListener("blur", () => { winhasFocus = false; });
window.addEventListener("focus", () => { winhasFocus = true; });
document.addEventListener("visibilitychange", () => { winVisible = !document.hidden; });
testMultiMainloop();

inUnit.onChange = () =>
{
    width.set(0);
    height.set(0);
};

function getFpsLimit()
{
    if (reduceLoadingFPS.get() && op.patch.loading.getProgress() < 1.0) return 5;

    if (reduceFocusFPS.get())
    {
        if (!winVisible) return 10;
        if (!winhasFocus) return 30;
    }

    return fpsLimit.get();
}

function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if (fsElement)fsElement.style.display = "block";
    }

    function onMouseLeave()
    {
        if (fsElement)fsElement.style.display = "none";
    }

    op.patch.cgl.canvas.addEventListener("mouseleave", onMouseLeave);
    op.patch.cgl.canvas.addEventListener("mouseenter", onMouseEnter);

    if (fullscreen.get())
    {
        if (!fsElement)
        {
            fsElement = document.createElement("div");

            const container = op.patch.cgl.canvas.parentElement;
            if (container)container.appendChild(fsElement);

            fsElement.addEventListener("mouseenter", onMouseEnter);
            fsElement.addEventListener("click", function (e)
            {
                if (CABLES.UI && !e.shiftKey) gui.cycleFullscreen();
                else cgl.fullScreen();
            });
        }

        fsElement.style.padding = "10px";
        fsElement.style.position = "absolute";
        fsElement.style.right = "5px";
        fsElement.style.top = "5px";
        fsElement.style.width = "20px";
        fsElement.style.height = "20px";
        fsElement.style.cursor = "pointer";
        fsElement.style["border-radius"] = "40px";
        fsElement.style.background = "#444";
        fsElement.style["z-index"] = "9999";
        fsElement.style.display = "none";
        fsElement.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" id=\"Capa_1\" x=\"0px\" y=\"0px\" viewBox=\"0 0 490 490\" style=\"width:20px;height:20px;\" xml:space=\"preserve\" width=\"512px\" height=\"512px\"><g><path d=\"M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z\" fill=\"#FFFFFF\"/><path d=\"M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z\" fill=\"#FFFFFF\"/><path d=\"M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z\" fill=\"#FFFFFF\"/><path d=\"M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z\" fill=\"#FFFFFF\"/></g></svg>";
    }
    else
    {
        if (fsElement)
        {
            fsElement.style.display = "none";
            fsElement.remove();
            fsElement = null;
        }
    }
}

op.onDelete = function ()
{
    cgl.gl.clearColor(0, 0, 0, 0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
};

function render(time)
{
    if (!active.get()) return;
    if (cgl.aborted || cgl.canvas.clientWidth === 0 || cgl.canvas.clientHeight === 0) return;

    op.patch.cg = cgl;

    const startTime = performance.now();

    op.patch.config.fpsLimit = getFpsLimit();

    if (cgl.canvasWidth == -1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if (cgl.canvasWidth != width.get() || cgl.canvasHeight != height.get())
    {
        let div = 1;
        if (inUnit.get() == "CSS")div = op.patch.cgl.pixelDensity;

        width.set(cgl.canvasWidth / div);
        height.set(cgl.canvasHeight / div);
    }

    if (CABLES.now() - rframeStart > 1000)
    {
        CGL.fpsReport = CGL.fpsReport || [];
        if (op.patch.loading.getProgress() >= 1.0 && rframeStart !== 0)CGL.fpsReport.push(rframes);
        rframes = 0;
        rframeStart = CABLES.now();
    }
    CGL.MESH.lastShader = null;
    CGL.MESH.lastMesh = null;

    cgl.renderStart(cgl, identTranslate, identTranslateView);

    if (clear.get())
    {
        cgl.gl.clearColor(0, 0, 0, 1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();

    if (CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

    if (CGL.Texture.previewTexture)
    {
        if (!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer = new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);

    op.patch.cg = null;

    if (clearAlpha.get())
    {
        cgl.gl.clearColor(1, 1, 1, 1);
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);
    }

    if (!cgl.frameStore.phong)cgl.frameStore.phong = {};
    rframes++;

    op.patch.cgl.profileData.profileMainloopMs = performance.now() - startTime;
}

function testMultiMainloop()
{
    setTimeout(
        () =>
        {
            if (op.patch.getOpsByObjName(op.name).length > 1)
            {
                op.setUiError("multimainloop", "there should only be one mainloop op!");
                op.patch.addEventListener("onOpDelete", testMultiMainloop);
            }
            else op.setUiError("multimainloop", null, 1);
        }, 500);
}


};

Ops.Gl.MainLoop.prototype = new CABLES.Op();
CABLES.OPS["b0472a1d-db16-4ba6-8787-f300fbdc77bb"]={f:Ops.Gl.MainLoop,objName:"Ops.Gl.MainLoop"};




// **************************************************************
// 
// Ops.Gl.Matrix.OrbitControls
// 
// **************************************************************

Ops.Gl.Matrix.OrbitControls = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render = op.inTrigger("render"),
    minDist = op.inValueFloat("min distance"),
    maxDist = op.inValueFloat("max distance"),

    minRotY = op.inValue("min rot y", 0),
    maxRotY = op.inValue("max rot y", 0),

    initialRadius = op.inValue("initial radius", 0),
    initialAxis = op.inValueSlider("initial axis y"),
    initialX = op.inValueSlider("initial axis x"),

    mul = op.inValueFloat("mul"),
    smoothness = op.inValueSlider("Smoothness", 1.0),
    speedX = op.inValue("Speed X", 1),
    speedY = op.inValue("Speed Y", 1),

    active = op.inValueBool("Active", true),

    allowPanning = op.inValueBool("Allow Panning", true),
    allowZooming = op.inValueBool("Allow Zooming", true),
    allowRotation = op.inValueBool("Allow Rotation", true),
    restricted = op.inValueBool("restricted", true),

    trigger = op.outTrigger("trigger"),
    outRadius = op.outNumber("radius"),
    outXDeg = op.outNumber("Rot X"),
    outYDeg = op.outNumber("Rot Y"),

    inReset = op.inTriggerButton("Reset");

op.setPortGroup("Initial Values", [initialAxis, initialX, initialRadius]);
op.setPortGroup("Interaction", [mul, smoothness, speedX, speedY]);
op.setPortGroup("Boundaries", [minRotY, maxRotY, minDist, maxDist]);

mul.set(1);
minDist.set(0.05);
maxDist.set(99999);

inReset.onTriggered = reset;

let eye = vec3.create();
const vUp = vec3.create();
const vCenter = vec3.create();
const viewMatrix = mat4.create();
const tempViewMatrix = mat4.create();
const vOffset = vec3.create();
const finalEyeAbs = vec3.create();

initialAxis.set(0.5);

let mouseDown = false;
let radius = 5;
outRadius.set(radius);

let lastMouseX = 0, lastMouseY = 0;
let percX = 0, percY = 0;

vec3.set(vCenter, 0, 0, 0);
vec3.set(vUp, 0, 1, 0);

const tempEye = vec3.create();
const finalEye = vec3.create();
const tempCenter = vec3.create();
const finalCenter = vec3.create();

let px = 0;
let py = 0;

let divisor = 1;
let element = null;
updateSmoothness();

op.onDelete = unbind;

const halfCircle = Math.PI;
const fullCircle = Math.PI * 2;

function reset()
{
    let off = 0;

    if (px % fullCircle < -halfCircle)
    {
        off = -fullCircle;
        px %= -fullCircle;
    }
    else
    if (px % fullCircle > halfCircle)
    {
        off = fullCircle;
        px %= fullCircle;
    }
    else px %= fullCircle;

    py %= (Math.PI);

    vec3.set(vOffset, 0, 0, 0);
    vec3.set(vCenter, 0, 0, 0);
    vec3.set(vUp, 0, 1, 0);

    percX = (initialX.get() * Math.PI * 2 + off);
    percY = (initialAxis.get() - 0.5);

    radius = initialRadius.get();
    eye = circlePos(percY);
}

function updateSmoothness()
{
    divisor = smoothness.get() * 10 + 1.0;
}

smoothness.onChange = updateSmoothness;

let initializing = true;

function ip(val, goal)
{
    if (initializing) return goal;
    return val + (goal - val) / divisor;
}

let lastPy = 0;
const lastPx = 0;

render.onTriggered = function ()
{
    const cgl = op.patch.cg;

    if (!element)
    {
        setElement(cgl.canvas);
        bind();
    }

    cgl.pushViewMatrix();

    px = ip(px, percX);
    py = ip(py, percY);

    let degY = (py + 0.5) * 180;

    if (minRotY.get() !== 0 && degY < minRotY.get())
    {
        degY = minRotY.get();
        py = lastPy;
    }
    else if (maxRotY.get() !== 0 && degY > maxRotY.get())
    {
        degY = maxRotY.get();
        py = lastPy;
    }
    else
    {
        lastPy = py;
    }

    const degX = (px) * CGL.RAD2DEG;

    outYDeg.set(degY);
    outXDeg.set(degX);

    circlePosi(eye, py);

    vec3.add(tempEye, eye, vOffset);
    vec3.add(tempCenter, vCenter, vOffset);

    finalEye[0] = ip(finalEye[0], tempEye[0]);
    finalEye[1] = ip(finalEye[1], tempEye[1]);
    finalEye[2] = ip(finalEye[2], tempEye[2]);

    finalCenter[0] = ip(finalCenter[0], tempCenter[0]);
    finalCenter[1] = ip(finalCenter[1], tempCenter[1]);
    finalCenter[2] = ip(finalCenter[2], tempCenter[2]);

    const empty = vec3.create();

    mat4.lookAt(viewMatrix, finalEye, finalCenter, vUp);
    mat4.rotate(viewMatrix, viewMatrix, px, vUp);

    // finaly multiply current scene viewmatrix
    mat4.multiply(cgl.vMatrix, cgl.vMatrix, viewMatrix);

    trigger.trigger();
    cgl.popViewMatrix();
    initializing = false;
};

function circlePosi(vec, perc)
{
    const mmul = mul.get();
    if (radius < minDist.get() * mmul) radius = minDist.get() * mmul;
    if (radius > maxDist.get() * mmul) radius = maxDist.get() * mmul;

    outRadius.set(radius * mmul);

    let i = 0, degInRad = 0;

    degInRad = 360 * perc / 2 * CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad) * radius * mmul,
        Math.sin(degInRad) * radius * mmul,
        0);
    return vec;
}

function circlePos(perc)
{
    const mmul = mul.get();
    if (radius < minDist.get() * mmul)radius = minDist.get() * mmul;
    if (radius > maxDist.get() * mmul)radius = maxDist.get() * mmul;

    outRadius.set(radius * mmul);

    let i = 0, degInRad = 0;
    const vec = vec3.create();
    degInRad = 360 * perc / 2 * CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad) * radius * mmul,
        Math.sin(degInRad) * radius * mmul,
        0);
    return vec;
}

function onmousemove(event)
{
    if (!mouseDown) return;

    const x = event.clientX;
    const y = event.clientY;

    let movementX = (x - lastMouseX);
    let movementY = (y - lastMouseY);

    movementX *= speedX.get();
    movementY *= speedY.get();

    if (event.buttons == 2 && allowPanning.get())
    {
        vOffset[2] += movementX * 0.01 * mul.get();
        vOffset[1] += movementY * 0.01 * mul.get();
    }
    else
    if (event.buttons == 4 && allowZooming.get())
    {
        radius += movementY * 0.05;
        eye = circlePos(percY);
    }
    else
    {
        if (allowRotation.get())
        {
            percX += movementX * 0.003;
            percY += movementY * 0.002;

            if (restricted.get())
            {
                if (percY > 0.5)percY = 0.5;
                if (percY < -0.5)percY = -0.5;
            }
        }
    }

    lastMouseX = x;
    lastMouseY = y;
}

function onMouseDown(event)
{
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    mouseDown = true;

    try { element.setPointerCapture(event.pointerId); }
    catch (e) {}
}

function onMouseUp(e)
{
    mouseDown = false;
    // cgl.canvas.style.cursor='url(/ui/img/rotate.png),pointer';

    try { element.releasePointerCapture(e.pointerId); }
    catch (e) {}
}

function lockChange()
{
    const el = op.patch.cg.canvas;

    if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
    {
        document.addEventListener("mousemove", onmousemove, false);
    }
}

function onMouseEnter(e)
{
    // cgl.canvas.style.cursor='url(/ui/img/rotate.png),pointer';
}

initialRadius.onChange = function ()
{
    radius = initialRadius.get();
    reset();
};

initialX.onChange = function ()
{
    px = percX = (initialX.get() * Math.PI * 2);
};

initialAxis.onChange = function ()
{
    py = percY = (initialAxis.get() - 0.5);
    eye = circlePos(percY);
};

const onMouseWheel = function (event)
{
    if (allowZooming.get())
    {
        const delta = CGL.getWheelSpeed(event) * 0.06;
        radius += (parseFloat(delta)) * 1.2;

        eye = circlePos(percY);
    }
};

const ontouchstart = function (event)
{
    if (event.touches && event.touches.length > 0) onMouseDown(event.touches[0]);
};

const ontouchend = function (event)
{
    onMouseUp();
};

const ontouchmove = function (event)
{
    if (event.touches && event.touches.length > 0) onmousemove(event.touches[0]);
};

active.onChange = function ()
{
    if (active.get())bind();
    else unbind();
};

function setElement(ele)
{
    unbind();
    element = ele;
    bind();
}

function bind()
{
    if (!element) return;

    element.addEventListener("pointermove", onmousemove);
    element.addEventListener("pointerdown", onMouseDown);
    element.addEventListener("pointerup", onMouseUp);
    element.addEventListener("pointerleave", onMouseUp);
    element.addEventListener("pointerenter", onMouseEnter);
    element.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    element.addEventListener("wheel", onMouseWheel, { "passive": true });
}

function unbind()
{
    if (!element) return;

    element.removeEventListener("pointermove", onmousemove);
    element.removeEventListener("pointerdown", onMouseDown);
    element.removeEventListener("pointerup", onMouseUp);
    element.removeEventListener("pointerleave", onMouseUp);
    element.removeEventListener("pointerenter", onMouseUp);
    element.removeEventListener("wheel", onMouseWheel);
}

eye = circlePos(0);

initialX.set(0.25);
initialRadius.set(0.05);


};

Ops.Gl.Matrix.OrbitControls.prototype = new CABLES.Op();
CABLES.OPS["eaf4f7ce-08a3-4d1b-b9f4-ebc0b7b1cde1"]={f:Ops.Gl.Matrix.OrbitControls,objName:"Ops.Gl.Matrix.OrbitControls"};




// **************************************************************
// 
// Ops.Gl.ClearColor
// 
// **************************************************************

Ops.Gl.ClearColor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    r = op.inFloatSlider("r", 0.1),
    g = op.inFloatSlider("g", 0.1),
    b = op.inFloatSlider("b", 0.1),
    a = op.inFloatSlider("a", 1);

r.setUiAttribs({ "colorPick": true });

const cgl = op.patch.cgl;

render.onTriggered = function ()
{
    cgl.gl.clearColor(r.get(), g.get(), b.get(), a.get());
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    trigger.trigger();
};


};

Ops.Gl.ClearColor.prototype = new CABLES.Op();
CABLES.OPS["19b441eb-9f63-4f35-ba08-b87841517c4d"]={f:Ops.Gl.ClearColor,objName:"Ops.Gl.ClearColor"};




// **************************************************************
// 
// Ops.Gl.Meshes.Sphere_v2
// 
// **************************************************************

Ops.Gl.Meshes.Sphere_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    TAU = Math.PI * 2,
    cgl = op.patch.cgl,
    inTrigger = op.inTrigger("render"),
    inRadius = op.inValue("radius", 0.5),
    inStacks = op.inValue("stacks", 32),
    inSlices = op.inValue("slices", 32),
    inStacklimit = op.inValueSlider("Filloffset", 1),
    inDraw = op.inValueBool("Render", true),
    outTrigger = op.outTrigger("trigger"),
    outGeometry = op.outObject("geometry", null, "geometry"),
    UP = vec3.fromValues(0, 1, 0),
    RIGHT = vec3.fromValues(1, 0, 0);

let
    geom = new CGL.Geometry("Sphere"),
    tmpNormal = vec3.create(),
    tmpVec = vec3.create(),
    needsRebuild = true,
    mesh;

function buildMesh()
{
    const
        stacks = Math.ceil(Math.max(inStacks.get(), 2)),
        slices = Math.ceil(Math.max(inSlices.get(), 3)),
        stackLimit = Math.min(Math.max(inStacklimit.get() * stacks, 1), stacks),
        radius = inRadius.get();
    let
        positions = [],
        texcoords = [],
        normals = [],
        tangents = [],
        biTangents = [],
        indices = [],
        x, y, z, d, t, a,
        o, u, v, i, j;
    for (i = o = 0; i < stacks + 1; i++)
    {
        v = (i / stacks - 0.5) * Math.PI;
        y = Math.sin(v);
        a = Math.cos(v);
        // for (j = 0; j < slices+1; j++) {
        for (j = slices; j >= 0; j--)
        {
            u = (j / slices) * TAU;
            x = Math.cos(u) * a;
            z = Math.sin(u) * a;

            positions.push(x * radius, y * radius, z * radius);
            // texcoords.push(i/(stacks+1),j/slices);
            texcoords.push(j / slices, i / (stacks + 1));

            d = Math.sqrt(x * x + y * y + z * z);
            normals.push(
                tmpNormal[0] = x / d,
                tmpNormal[1] = y / d,
                tmpNormal[2] = z / d
            );

            if (y == d) t = RIGHT;
            else t = UP;
            vec3.cross(tmpVec, tmpNormal, t);
            vec3.normalize(tmpVec, tmpVec);
            Array.prototype.push.apply(tangents, tmpVec);
            vec3.cross(tmpVec, tmpVec, tmpNormal);
            Array.prototype.push.apply(biTangents, tmpVec);
        }
        if (i == 0 || i > stackLimit) continue;
        for (j = 0; j < slices; j++, o++)
        {
            indices.push(
                o, o + 1, o + slices + 1,
                o + 1, o + slices + 2, o + slices + 1
            );
        }
        o++;
    }

    // set geometry
    geom.clear();
    geom.vertices = positions;
    geom.texCoords = texcoords;
    geom.vertexNormals = normals;
    geom.tangents = tangents;
    geom.biTangents = biTangents;
    geom.verticesIndices = indices;

    outGeometry.set(null);
    outGeometry.set(geom);

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);

    needsRebuild = false;
}

// set event handlers
inTrigger.onTriggered = function ()
{
    if (needsRebuild) buildMesh();
    if (inDraw.get()) mesh.render(cgl.getShader());
    outTrigger.trigger();
};

inStacks.onChange =
inSlices.onChange =
inStacklimit.onChange =
inRadius.onChange = function ()
{
    // only calculate once, even after multiple settings could were changed
    needsRebuild = true;
};

// set lifecycle handlers
op.onDelete = function () { if (mesh)mesh.dispose(); };


};

Ops.Gl.Meshes.Sphere_v2.prototype = new CABLES.Op();
CABLES.OPS["450b4d68-2278-4d9f-9849-0abdfa37ef69"]={f:Ops.Gl.Meshes.Sphere_v2,objName:"Ops.Gl.Meshes.Sphere_v2"};




// **************************************************************
// 
// Ops.Gl.Shader.BasicMaterial_v3
// 
// **************************************************************

Ops.Gl.Shader.BasicMaterial_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"basicmaterial_frag":"{{MODULES_HEAD}}\n\nIN vec2 texCoord;\n\n#ifdef VERTEX_COLORS\nIN vec4 vertCol;\n#endif\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoordOrig;\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D tex;\n    #endif\n    #ifdef HAS_TEXTURE_OPACITY\n        UNI sampler2D texOpacity;\n   #endif\n#endif\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n    vec4 col=color;\n\n\n    #ifdef HAS_TEXTURES\n        vec2 uv=texCoord;\n\n        #ifdef CROP_TEXCOORDS\n            if(uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) discard;\n        #endif\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n            col=texture(tex,uv);\n\n            #ifdef COLORIZE_TEXTURE\n                col.r*=color.r;\n                col.g*=color.g;\n                col.b*=color.b;\n            #endif\n        #endif\n        col.a*=color.a;\n        #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                uv=texCoordOrig;\n            #endif\n            #ifdef ALPHA_MASK_IALPHA\n                col.a*=1.0-texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_ALPHA\n                col.a*=texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_LUMI\n                col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,uv).rgb);\n            #endif\n            #ifdef ALPHA_MASK_R\n                col.a*=texture(texOpacity,uv).r;\n            #endif\n            #ifdef ALPHA_MASK_G\n                col.a*=texture(texOpacity,uv).g;\n            #endif\n            #ifdef ALPHA_MASK_B\n                col.a*=texture(texOpacity,uv).b;\n            #endif\n            // #endif\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef DISCARDTRANS\n        if(col.a<0.2) discard;\n    #endif\n\n    #ifdef VERTEX_COLORS\n        col*=vertCol;\n    #endif\n\n    outColor = col;\n}\n","basicmaterial_vert":"\n{{MODULES_HEAD}}\n\n// OUT vec3 norm;\nOUT vec2 texCoord;\nOUT vec2 texCoordOrig;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifdef HAS_TEXTURES\n    UNI float diffuseRepeatX;\n    UNI float diffuseRepeatY;\n    UNI float texOffsetX;\n    UNI float texOffsetY;\n#endif\n\n#ifdef VERTEX_COLORS\n    in vec4 attrVertColor;\n    out vec4 vertCol;\n\n#endif\n\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n\n    norm=attrVertNormal;\n    texCoordOrig=attrTexCoord;\n    texCoord=attrTexCoord;\n    #ifdef HAS_TEXTURES\n        texCoord.x=texCoord.x*diffuseRepeatX+texOffsetX;\n        texCoord.y=(1.0-texCoord.y)*diffuseRepeatY+texOffsetY;\n    #endif\n\n    #ifdef VERTEX_COLORS\n        vertCol=attrVertColor;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.0);\n\n    #ifdef BILLBOARD\n       vec3 position=vPosition;\n       mvMatrix=viewMatrix*modelMatrix;\n\n       gl_Position = projMatrix * mvMatrix * vec4((\n           position.x * vec3(\n               mvMatrix[0][0],\n               mvMatrix[1][0],\n               mvMatrix[2][0] ) +\n           position.y * vec3(\n               mvMatrix[0][1],\n               mvMatrix[1][1],\n               mvMatrix[2][1]) ), 1.0);\n    #endif\n\n    {{MODULE_VERTEX_POSITION}}\n\n    #ifndef BILLBOARD\n        mvMatrix=viewMatrix * mMatrix;\n    #endif\n\n\n    #ifndef BILLBOARD\n        // gl_Position = projMatrix * viewMatrix * modelMatrix * pos;\n        gl_Position = projMatrix * mvMatrix * pos;\n    #endif\n}\n",};
const render = op.inTrigger("render");

const trigger = op.outTrigger("trigger");
const shaderOut = op.outObject("shader", null, "shader");

shaderOut.ignoreValueSerialize = true;

op.toWorkPortsNeedToBeLinked(render);

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "basicmaterialnew");
shader.addAttribute({ "type": "vec3", "name": "vPosition" });
shader.addAttribute({ "type": "vec2", "name": "attrTexCoord" });
shader.addAttribute({ "type": "vec3", "name": "attrVertNormal", "nameFrag": "norm" });
shader.addAttribute({ "type": "float", "name": "attrVertIndex" });

shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);

shader.setSource(attachments.basicmaterial_vert, attachments.basicmaterial_frag);

shaderOut.set(shader);

render.onTriggered = doRender;

// rgba colors
const r = op.inValueSlider("r", Math.random());
const g = op.inValueSlider("g", Math.random());
const b = op.inValueSlider("b", Math.random());
const a = op.inValueSlider("a", 1);
r.setUiAttribs({ "colorPick": true });

// const uniColor=new CGL.Uniform(shader,'4f','color',r,g,b,a);
const colUni = shader.addUniformFrag("4f", "color", r, g, b, a);

shader.uniformColorDiffuse = colUni;

// diffuse outTexture

const diffuseTexture = op.inTexture("texture");
let diffuseTextureUniform = null;
diffuseTexture.onChange = updateDiffuseTexture;

const colorizeTexture = op.inValueBool("colorizeTexture", false);
const vertexColors = op.inValueBool("Vertex Colors", false);

// opacity texture
const textureOpacity = op.inTexture("textureOpacity");
let textureOpacityUniform = null;

const alphaMaskSource = op.inSwitch("Alpha Mask Source", ["Luminance", "R", "G", "B", "A", "1-A"], "Luminance");
alphaMaskSource.setUiAttribs({ "greyout": true });
textureOpacity.onChange = updateOpacity;

const texCoordAlpha = op.inValueBool("Opacity TexCoords Transform", false);
const discardTransPxl = op.inValueBool("Discard Transparent Pixels");

// texture coords
const
    diffuseRepeatX = op.inValue("diffuseRepeatX", 1),
    diffuseRepeatY = op.inValue("diffuseRepeatY", 1),
    diffuseOffsetX = op.inValue("Tex Offset X", 0),
    diffuseOffsetY = op.inValue("Tex Offset Y", 0),
    cropRepeat = op.inBool("Crop TexCoords", false);

shader.addUniformFrag("f", "diffuseRepeatX", diffuseRepeatX);
shader.addUniformFrag("f", "diffuseRepeatY", diffuseRepeatY);
shader.addUniformFrag("f", "texOffsetX", diffuseOffsetX);
shader.addUniformFrag("f", "texOffsetY", diffuseOffsetY);

const doBillboard = op.inValueBool("billboard", false);

alphaMaskSource.onChange =
    doBillboard.onChange =
    discardTransPxl.onChange =
    texCoordAlpha.onChange =
    cropRepeat.onChange =
    vertexColors.onChange =
    colorizeTexture.onChange = updateDefines;

op.setPortGroup("Color", [r, g, b, a]);
op.setPortGroup("Color Texture", [diffuseTexture, vertexColors, colorizeTexture]);
op.setPortGroup("Opacity", [textureOpacity, alphaMaskSource, discardTransPxl, texCoordAlpha]);
op.setPortGroup("Texture Transform", [diffuseRepeatX, diffuseRepeatY, diffuseOffsetX, diffuseOffsetY, cropRepeat]);

updateOpacity();
updateDiffuseTexture();

op.preRender = function ()
{
    shader.bind();
    doRender();
};

function doRender()
{
    if (!shader) return;

    cgl.pushShader(shader);
    shader.popTextures();

    if (diffuseTextureUniform && diffuseTexture.get()) shader.pushTexture(diffuseTextureUniform, diffuseTexture.get());
    if (textureOpacityUniform && textureOpacity.get()) shader.pushTexture(textureOpacityUniform, textureOpacity.get());

    trigger.trigger();

    cgl.popShader();
}

function updateOpacity()
{
    if (textureOpacity.get())
    {
        if (textureOpacityUniform !== null) return;
        shader.removeUniform("texOpacity");
        shader.define("HAS_TEXTURE_OPACITY");
        if (!textureOpacityUniform)textureOpacityUniform = new CGL.Uniform(shader, "t", "texOpacity");

        alphaMaskSource.setUiAttribs({ "greyout": false });
        texCoordAlpha.setUiAttribs({ "greyout": false });
    }
    else
    {
        shader.removeUniform("texOpacity");
        shader.removeDefine("HAS_TEXTURE_OPACITY");
        textureOpacityUniform = null;

        alphaMaskSource.setUiAttribs({ "greyout": true });
        texCoordAlpha.setUiAttribs({ "greyout": true });
    }

    updateDefines();
}

function updateDiffuseTexture()
{
    if (diffuseTexture.get())
    {
        if (!shader.hasDefine("HAS_TEXTURE_DIFFUSE"))shader.define("HAS_TEXTURE_DIFFUSE");
        if (!diffuseTextureUniform)diffuseTextureUniform = new CGL.Uniform(shader, "t", "texDiffuse");

        diffuseRepeatX.setUiAttribs({ "greyout": false });
        diffuseRepeatY.setUiAttribs({ "greyout": false });
        diffuseOffsetX.setUiAttribs({ "greyout": false });
        diffuseOffsetY.setUiAttribs({ "greyout": false });
        colorizeTexture.setUiAttribs({ "greyout": false });
    }
    else
    {
        shader.removeUniform("texDiffuse");
        shader.removeDefine("HAS_TEXTURE_DIFFUSE");
        diffuseTextureUniform = null;

        diffuseRepeatX.setUiAttribs({ "greyout": true });
        diffuseRepeatY.setUiAttribs({ "greyout": true });
        diffuseOffsetX.setUiAttribs({ "greyout": true });
        diffuseOffsetY.setUiAttribs({ "greyout": true });
        colorizeTexture.setUiAttribs({ "greyout": true });
    }
}

function updateDefines()
{
    shader.toggleDefine("VERTEX_COLORS", vertexColors.get());
    shader.toggleDefine("CROP_TEXCOORDS", cropRepeat.get());
    shader.toggleDefine("COLORIZE_TEXTURE", colorizeTexture.get());
    shader.toggleDefine("TRANSFORMALPHATEXCOORDS", texCoordAlpha.get());
    shader.toggleDefine("DISCARDTRANS", discardTransPxl.get());
    shader.toggleDefine("BILLBOARD", doBillboard.get());

    shader.toggleDefine("ALPHA_MASK_ALPHA", alphaMaskSource.get() == "A");
    shader.toggleDefine("ALPHA_MASK_IALPHA", alphaMaskSource.get() == "1-A");
    shader.toggleDefine("ALPHA_MASK_LUMI", alphaMaskSource.get() == "Luminance");
    shader.toggleDefine("ALPHA_MASK_R", alphaMaskSource.get() == "R");
    shader.toggleDefine("ALPHA_MASK_G", alphaMaskSource.get() == "G");
    shader.toggleDefine("ALPHA_MASK_B", alphaMaskSource.get() == "B");
}


};

Ops.Gl.Shader.BasicMaterial_v3.prototype = new CABLES.Op();
CABLES.OPS["ec55d252-3843-41b1-b731-0482dbd9e72b"]={f:Ops.Gl.Shader.BasicMaterial_v3,objName:"Ops.Gl.Shader.BasicMaterial_v3"};




// **************************************************************
// 
// Ops.Sequence
// 
// **************************************************************

Ops.Sequence = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("exe"),
    cleanup = op.inTriggerButton("Clean up connections");

const
    exes = [],
    triggers = [],
    num = 16;

let updateTimeout = null;

exe.onTriggered = triggerAll;
cleanup.onTriggered = clean;
cleanup.setUiAttribs({ "hidePort": true });
cleanup.setUiAttribs({ "hideParam": true });

for (let i = 0; i < num; i++)
{
    const p = op.outTrigger("trigger " + i);
    triggers.push(p);
    p.onLinkChanged = updateButton;

    if (i < num - 1)
    {
        let newExe = op.inTrigger("exe " + i);
        newExe.onTriggered = triggerAll;
        exes.push(newExe);
    }
}

function updateButton()
{
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() =>
    {
        let show = false;
        for (let i = 0; i < triggers.length; i++)
            if (triggers[i].links.length > 1) show = true;

        cleanup.setUiAttribs({ "hideParam": !show });

        if (op.isCurrentUiOp()) op.refreshParams();
    }, 60);
}

function triggerAll()
{
    for (let i = 0; i < triggers.length; i++) triggers[i].trigger();
}

function clean()
{
    let count = 0;
    for (let i = 0; i < triggers.length; i++)
    {
        let removeLinks = [];

        if (triggers[i].links.length > 1)
            for (let j = 1; j < triggers[i].links.length; j++)
            {
                while (triggers[count].links.length > 0) count++;

                removeLinks.push(triggers[i].links[j]);
                const otherPort = triggers[i].links[j].getOtherPort(triggers[i]);
                op.patch.link(op, "trigger " + count, otherPort.parent, otherPort.name);
                count++;
            }

        for (let j = 0; j < removeLinks.length; j++) removeLinks[j].remove();
    }
    updateButton();
}


};

Ops.Sequence.prototype = new CABLES.Op();
CABLES.OPS["a466bc1f-06e9-4595-8849-bffb9fe22f99"]={f:Ops.Sequence,objName:"Ops.Sequence"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ImageCompose_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.ImageCompose_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"imgcomp_frag":"UNI float a;\nvoid main()\n{\n   outColor= vec4(0.0,0.0,0.0,a);\n}\n",};
const
    render = op.inTrigger("Render"),
    useVPSize = op.inBool("Use viewport size", true),
    width = op.inValueInt("Width", 640),
    height = op.inValueInt("Height", 480),
    tfilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"], "linear"),
    twrap = op.inValueSelect("Wrap", ["clamp to edge", "repeat", "mirrored repeat"], "repeat"),
    fpTexture = op.inValueBool("HDR"),
    inTransp = op.inValueBool("Transparent", false),

    trigger = op.outTrigger("Next"),
    texOut = op.outTexture("texture_out"),
    outRatio = op.outValue("Aspect Ratio");

const cgl = op.patch.cgl;
op.setPortGroup("Texture Size", [useVPSize, width, height]);
op.setPortGroup("Texture Settings", [twrap, tfilter, fpTexture, inTransp]);

texOut.set(CGL.Texture.getEmptyTexture(cgl, fpTexture.get()));
let effect = null;
let tex = null;
let w = 8, h = 8;

const prevViewPort = [0, 0, 0, 0];
let reInitEffect = true;

// const bgShader = new CGL.Shader(cgl, "imgcompose bg");
// bgShader.setSource(bgShader.getDefaultVertexShader(), attachments.imgcomp_frag);

// const uniAlpha = new CGL.Uniform(bgShader, "f", "a", !inTransp.get());

let selectedFilter = CGL.Texture.FILTER_LINEAR;
let selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

const fps = 0;
const fpsStart = 0;

twrap.onChange = onWrapChange;
tfilter.onChange = onFilterChange;

render.onTriggered = op.preRender = doRender;

onFilterChange();
onWrapChange();
updateSizePorts();

// inTransp.onChange = () =>
// {
//     uniAlpha.setValue(!inTransp.get());
// };

function initEffect()
{
    if (effect)effect.delete();
    if (tex)tex.delete();

    if (fpTexture.get() && tfilter.get() == "mipmap") op.setUiError("fpmipmap", "Don't use mipmap and HDR at the same time, many systems do not support this.");
    else op.setUiError("fpmipmap", null);

    effect = new CGL.TextureEffect(cgl, { "isFloatingPointTexture": fpTexture.get() });

    tex = new CGL.Texture(cgl,
        {
            "name": "image_compose_v2_" + op.id,
            "isFloatingPointTexture": fpTexture.get(),
            "filter": selectedFilter,
            "wrap": selectedWrap,
            "width": Math.ceil(width.get()),
            "height": Math.ceil(height.get()),
        });

    effect.setSourceTexture(tex);
    texOut.set(CGL.Texture.getEmptyTexture(cgl, fpTexture.get()));

    reInitEffect = false;
}

fpTexture.onChange = function ()
{
    reInitEffect = true;
};

function updateResolution()
{
    if (!effect)initEffect();

    if (useVPSize.get())
    {
        w = cgl.getViewPort()[2];
        h = cgl.getViewPort()[3];
    }
    else
    {
        w = Math.ceil(width.get());
        h = Math.ceil(height.get());
    }

    outRatio.set(w / h);

    if ((w != tex.width || h != tex.height) && (w !== 0 && h !== 0))
    {
        // height.set(h);
        // width.set(w);
        tex.setSize(w, h);

        effect.setSourceTexture(tex);
        texOut.set(CGL.Texture.getEmptyTexture(cgl, fpTexture.get()));
        texOut.set(tex);
    }

    // if (texOut.get() && selectedFilter != CGL.Texture.FILTER_NEAREST)
    // {
    //     if (!texOut.get().isPowerOfTwo()) op.setUiError("hintnpot", "texture dimensions not power of two! - texture filtering when scaling will not work on ios devices.", 0);
    //     else op.setUiError("hintnpot", null, 0);
    // }
    // else op.setUiError("hintnpot", null, 0);
}

function updateSizePorts()
{
    width.setUiAttribs({ "greyout": useVPSize.get() });
    height.setUiAttribs({ "greyout": useVPSize.get() });
}

useVPSize.onChange = function ()
{
    updateSizePorts();
};

op.preRender = function ()
{
    doRender();
    // bgShader.bind();
};

function doRender()
{
    if (!effect || reInitEffect) initEffect();

    const vp = cgl.getViewPort();
    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    cgl.pushBlend(false);

    updateResolution();

    const oldEffect = cgl.currentTextureEffect;
    cgl.currentTextureEffect = effect;
    cgl.currentTextureEffect.width = width.get();
    cgl.currentTextureEffect.height = height.get();
    effect.setSourceTexture(tex);

    let bgTex = CGL.Texture.getBlackTexture(cgl);
    if (inTransp.get())bgTex = CGL.Texture.getEmptyTexture(cgl, fpTexture.get());

    effect.startEffect(bgTex);

    // cgl.pushShader(bgShader);
    // cgl.currentTextureEffect.bind();
    // cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);
    // cgl.currentTextureEffect.finish();
    // cgl.popShader();

    trigger.trigger();

    texOut.set(effect.getCurrentSourceTexture());

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);

    cgl.popBlend(false);
    cgl.currentTextureEffect = oldEffect;
}

function onWrapChange()
{
    if (twrap.get() == "repeat") selectedWrap = CGL.Texture.WRAP_REPEAT;
    if (twrap.get() == "mirrored repeat") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (twrap.get() == "clamp to edge") selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reInitEffect = true;
    // updateResolution();
}

function onFilterChange()
{
    if (tfilter.get() == "nearest") selectedFilter = CGL.Texture.FILTER_NEAREST;
    if (tfilter.get() == "linear") selectedFilter = CGL.Texture.FILTER_LINEAR;
    if (tfilter.get() == "mipmap") selectedFilter = CGL.Texture.FILTER_MIPMAP;

    reInitEffect = true;
    // updateResolution();
}


};

Ops.Gl.TextureEffects.ImageCompose_v2.prototype = new CABLES.Op();
CABLES.OPS["a5b43d4c-a9ea-4eaf-9ed0-f257d222659d"]={f:Ops.Gl.TextureEffects.ImageCompose_v2,objName:"Ops.Gl.TextureEffects.ImageCompose_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Noise.PerlinNoise
// 
// **************************************************************

Ops.Gl.TextureEffects.Noise.PerlinNoise = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"perlinnoise3d_frag":"UNI float z;\nUNI float x;\nUNI float y;\nUNI float scale;\nUNI float rangeMul;\nUNI float harmonics;\nUNI float aspect;\n\nIN vec2 texCoord;\nUNI sampler2D tex;\n\n#ifdef HAS_TEX_OFFSETMAP\n    UNI sampler2D texOffsetZ;\n    UNI float offMul;\n#endif\n\n#ifdef HAS_TEX_MASK\n    UNI sampler2D texMask;\n#endif\n\nUNI float amount;\n\n{{CGL.BLENDMODES}}\n\n\nfloat Interpolation_C2( float x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }   //  6x^5-15x^4+10x^3\t( Quintic Curve.  As used by Perlin in Improved Noise.  http://mrl.nyu.edu/~perlin/paper445.pdf )\nvec2 Interpolation_C2( vec2 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec3 Interpolation_C2( vec3 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec4 Interpolation_C2( vec4 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec4 Interpolation_C2_InterpAndDeriv( vec2 x ) { return x.xyxy * x.xyxy * ( x.xyxy * ( x.xyxy * ( x.xyxy * vec2( 6.0, 0.0 ).xxyy + vec2( -15.0, 30.0 ).xxyy ) + vec2( 10.0, -60.0 ).xxyy ) + vec2( 0.0, 30.0 ).xxyy ); }\nvec3 Interpolation_C2_Deriv( vec3 x ) { return x * x * (x * (x * 30.0 - 60.0) + 30.0); }\n\n\nvoid FAST32_hash_3D( vec3 gridcell, out vec4 lowz_hash, out vec4 highz_hash )\t//\tgenerates a random number for each of the 8 cell corners\n{\n    //    gridcell is assumed to be an integer coordinate\n\n    //\tTODO: \tthese constants need tweaked to find the best possible noise.\n    //\t\t\tprobably requires some kind of brute force computational searching or something....\n    const vec2 OFFSET = vec2( 50.0, 161.0 );\n    const float DOMAIN = 69.0;\n    const float SOMELARGEFLOAT = 635.298681;\n    const float ZINC = 48.500388;\n\n    //\ttruncate the domain\n    gridcell.xyz = gridcell.xyz - floor(gridcell.xyz * ( 1.0 / DOMAIN )) * DOMAIN;\n    vec3 gridcell_inc1 = step( gridcell, vec3( DOMAIN - 1.5 ) ) * ( gridcell + 1.0 );\n\n    //\tcalculate the noise\n    vec4 P = vec4( gridcell.xy, gridcell_inc1.xy ) + OFFSET.xyxy;\n    P *= P;\n    P = P.xzxz * P.yyww;\n    highz_hash.xy = vec2( 1.0 / ( SOMELARGEFLOAT + vec2( gridcell.z, gridcell_inc1.z ) * ZINC ) );\n    lowz_hash = fract( P * highz_hash.xxxx );\n    highz_hash = fract( P * highz_hash.yyyy );\n}\n\n\n\n\nvoid FAST32_hash_3D( \tvec3 gridcell,\n                        out vec4 lowz_hash_0,\n                        out vec4 lowz_hash_1,\n                        out vec4 lowz_hash_2,\n                        out vec4 highz_hash_0,\n                        out vec4 highz_hash_1,\n                        out vec4 highz_hash_2\t)\t\t//\tgenerates 3 random numbers for each of the 8 cell corners\n{\n    //    gridcell is assumed to be an integer coordinate\n\n    //\tTODO: \tthese constants need tweaked to find the best possible noise.\n    //\t\t\tprobably requires some kind of brute force computational searching or something....\n    const vec2 OFFSET = vec2( 50.0, 161.0 );\n    const float DOMAIN = 69.0;\n    const vec3 SOMELARGEFLOATS = vec3( 635.298681, 682.357502, 668.926525 );\n    const vec3 ZINC = vec3( 48.500388, 65.294118, 63.934599 );\n\n    //\ttruncate the domain\n    gridcell.xyz = gridcell.xyz - floor(gridcell.xyz * ( 1.0 / DOMAIN )) * DOMAIN;\n    vec3 gridcell_inc1 = step( gridcell, vec3( DOMAIN - 1.5 ) ) * ( gridcell + 1.0 );\n\n    //\tcalculate the noise\n    vec4 P = vec4( gridcell.xy, gridcell_inc1.xy ) + OFFSET.xyxy;\n    P *= P;\n    P = P.xzxz * P.yyww;\n    vec3 lowz_mod = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + gridcell.zzz * ZINC.xyz ) );\n    vec3 highz_mod = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + gridcell_inc1.zzz * ZINC.xyz ) );\n    lowz_hash_0 = fract( P * lowz_mod.xxxx );\n    highz_hash_0 = fract( P * highz_mod.xxxx );\n    lowz_hash_1 = fract( P * lowz_mod.yyyy );\n    highz_hash_1 = fract( P * highz_mod.yyyy );\n    lowz_hash_2 = fract( P * lowz_mod.zzzz );\n    highz_hash_2 = fract( P * highz_mod.zzzz );\n}\nfloat Falloff_Xsq_C1( float xsq ) { xsq = 1.0 - xsq; return xsq*xsq; }\t// ( 1.0 - x*x )^2   ( Used by Humus for lighting falloff in Just Cause 2.  GPUPro 1 )\nfloat Falloff_Xsq_C2( float xsq ) { xsq = 1.0 - xsq; return xsq*xsq*xsq; }\t// ( 1.0 - x*x )^3.   NOTE: 2nd derivative is 0.0 at x=1.0, but non-zero at x=0.0\nvec4 Falloff_Xsq_C2( vec4 xsq ) { xsq = 1.0 - xsq; return xsq*xsq*xsq; }\n\n\n//\n//\tPerlin Noise 3D  ( gradient noise )\n//\tReturn value range of -1.0->1.0\n//\thttp://briansharpe.files.wordpress.com/2011/11/perlinsample.jpg\n//\nfloat Perlin3D( vec3 P )\n{\n    //\testablish our grid cell and unit position\n    vec3 Pi = floor(P);\n    vec3 Pf = P - Pi;\n    vec3 Pf_min1 = Pf - 1.0;\n\n#if 1\n    //\n    //\tclassic noise.\n    //\trequires 3 random values per point.  with an efficent hash function will run faster than improved noise\n    //\n\n    //\tcalculate the hash.\n    //\t( various hashing methods listed in order of speed )\n    vec4 hashx0, hashy0, hashz0, hashx1, hashy1, hashz1;\n    FAST32_hash_3D( Pi, hashx0, hashy0, hashz0, hashx1, hashy1, hashz1 );\n    //SGPP_hash_3D( Pi, hashx0, hashy0, hashz0, hashx1, hashy1, hashz1 );\n\n    //\tcalculate the gradients\n    vec4 grad_x0 = hashx0 - 0.49999;\n    vec4 grad_y0 = hashy0 - 0.49999;\n    vec4 grad_z0 = hashz0 - 0.49999;\n    vec4 grad_x1 = hashx1 - 0.49999;\n    vec4 grad_y1 = hashy1 - 0.49999;\n    vec4 grad_z1 = hashz1 - 0.49999;\n    vec4 grad_results_0 = inversesqrt( grad_x0 * grad_x0 + grad_y0 * grad_y0 + grad_z0 * grad_z0 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x0 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y0 + Pf.zzzz * grad_z0 );\n    vec4 grad_results_1 = inversesqrt( grad_x1 * grad_x1 + grad_y1 * grad_y1 + grad_z1 * grad_z1 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x1 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y1 + Pf_min1.zzzz * grad_z1 );\n\n#if 1\n    //\tClassic Perlin Interpolation\n    vec3 blend = Interpolation_C2( Pf );\n    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );\n    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );\n    float final = dot( res0, blend2.zxzx * blend2.wwyy );\n    final *= 1.1547005383792515290182975610039;\t\t//\t(optionally) scale things to a strict -1.0->1.0 range    *= 1.0/sqrt(0.75)\n    return final;\n#else\n    //\tClassic Perlin Surflet\n    //\thttp://briansharpe.wordpress.com/2012/03/09/modifications-to-classic-perlin-noise/\n    Pf *= Pf;\n    Pf_min1 *= Pf_min1;\n    vec4 vecs_len_sq = vec4( Pf.x, Pf_min1.x, Pf.x, Pf_min1.x ) + vec4( Pf.yy, Pf_min1.yy );\n    float final = dot( Falloff_Xsq_C2( min( vec4( 1.0 ), vecs_len_sq + Pf.zzzz ) ), grad_results_0 ) + dot( Falloff_Xsq_C2( min( vec4( 1.0 ), vecs_len_sq + Pf_min1.zzzz ) ), grad_results_1 );\n    final *= 2.3703703703703703703703703703704;\t\t//\t(optionally) scale things to a strict -1.0->1.0 range    *= 1.0/cube(0.75)\n    return final;\n#endif\n\n#else\n    //\n    //\timproved noise.\n    //\trequires 1 random value per point.  Will run faster than classic noise if a slow hashing function is used\n    //\n\n    //\tcalculate the hash.\n    //\t( various hashing methods listed in order of speed )\n    vec4 hash_lowz, hash_highz;\n    FAST32_hash_3D( Pi, hash_lowz, hash_highz );\n    //BBS_hash_3D( Pi, hash_lowz, hash_highz );\n    //SGPP_hash_3D( Pi, hash_lowz, hash_highz );\n\n    //\n    //\t\"improved\" noise using 8 corner gradients.  Faster than the 12 mid-edge point method.\n    //\tKen mentions using diagonals like this can cause \"clumping\", but we'll live with that.\n    //\t[1,1,1]  [-1,1,1]  [1,-1,1]  [-1,-1,1]\n    //\t[1,1,-1] [-1,1,-1] [1,-1,-1] [-1,-1,-1]\n    //\n    hash_lowz -= 0.5;\n    vec4 grad_results_0_0 = vec2( Pf.x, Pf_min1.x ).xyxy * sign( hash_lowz );\n    hash_lowz = abs( hash_lowz ) - 0.25;\n    vec4 grad_results_0_1 = vec2( Pf.y, Pf_min1.y ).xxyy * sign( hash_lowz );\n    vec4 grad_results_0_2 = Pf.zzzz * sign( abs( hash_lowz ) - 0.125 );\n    vec4 grad_results_0 = grad_results_0_0 + grad_results_0_1 + grad_results_0_2;\n\n    hash_highz -= 0.5;\n    vec4 grad_results_1_0 = vec2( Pf.x, Pf_min1.x ).xyxy * sign( hash_highz );\n    hash_highz = abs( hash_highz ) - 0.25;\n    vec4 grad_results_1_1 = vec2( Pf.y, Pf_min1.y ).xxyy * sign( hash_highz );\n    vec4 grad_results_1_2 = Pf_min1.zzzz * sign( abs( hash_highz ) - 0.125 );\n    vec4 grad_results_1 = grad_results_1_0 + grad_results_1_1 + grad_results_1_2;\n\n    //\tblend the gradients and return\n    vec3 blend = Interpolation_C2( Pf );\n    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );\n    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );\n    return dot( res0, blend2.zxzx * blend2.wwyy ) * (2.0 / 3.0);\t//\t(optionally) mult by (2.0/3.0) to scale to a strict -1.0->1.0 range\n#endif\n}\n\nvoid main()\n{\n    vec4 base=texture(tex,texCoord);\n    vec2 p=vec2(texCoord.x-0.5,texCoord.y-0.5);\n\n    p=p*scale;\n    p=vec2(p.x+0.5-x,p.y+0.5-y);\n\n\n\n    vec3 offset;\n    #ifdef HAS_TEX_OFFSETMAP\n        vec4 offMap=texture(texOffsetZ,texCoord);\n\n        #ifdef OFFSET_X_R\n            offset.x=offMap.r;\n        #endif\n        #ifdef OFFSET_X_G\n            offset.x=offMap.g;\n        #endif\n        #ifdef OFFSET_X_B\n            offset.x=offMap.b;\n        #endif\n\n        #ifdef OFFSET_Y_R\n            offset.y=offMap.r;\n        #endif\n        #ifdef OFFSET_Y_G\n            offset.y=offMap.g;\n        #endif\n        #ifdef OFFSET_Y_B\n            offset.y=offMap.b;\n        #endif\n\n        #ifdef OFFSET_Z_R\n            offset.z=offMap.r;\n        #endif\n        #ifdef OFFSET_Z_G\n            offset.z=offMap.g;\n        #endif\n        #ifdef OFFSET_Z_B\n            offset.z=offMap.b;\n        #endif\n        offset*=offMul;\n    #endif\n\n\n\n    float aa=texture(tex,texCoord).r;\n    // float v=(Perlin3D(vec3(p.x,p.y,z)+offset));\n\n\n    float v = 0.0;\n    p.x*=aspect;\n\n    v+=Perlin3D(vec3(p.x,p.y,z)+offset);\n\n    if (harmonics >= 2.0) v += Perlin3D(vec3(p.x,p.y,z)*2.2+offset) * 0.5;\n    if (harmonics >= 3.0) v += Perlin3D(vec3(p.x,p.y,z)*4.3+offset) * 0.25;\n    if (harmonics >= 4.0) v += Perlin3D(vec3(p.x,p.y,z)*8.4+offset) * 0.125;\n    if (harmonics >= 5.0) v += Perlin3D(vec3(p.x,p.y,z)*16.5+offset) * 0.0625;\n\n\n    v*=rangeMul;\n    v=v*0.5+0.5;\n    float v2=v;\n    float v3=v;\n\n    #ifdef RGB\n        v2=Perlin3D(vec3(p.x*2.0,p.y*2.0,z))*0.5+0.5;\n        v3=Perlin3D(vec3(p.x*3.0,p.y*3.0,z))*0.5+0.5;\n    #endif\n\n    vec4 col=vec4(v,v2,v3,1.0);\n\n    float str=1.0;\n    #ifdef HAS_TEX_MASK\n        str=texture(texMask,texCoord).r;\n    #endif\n\n    col=cgl_blend(base,col,amount*str);\n\n\n    #ifdef NO_CHANNEL_R\n        col.r=base.r;\n    #endif\n    #ifdef NO_CHANNEL_G\n        col.g=base.g;\n    #endif\n    #ifdef NO_CHANNEL_B\n        col.b=base.b;\n    #endif\n\n\n\n    outColor=col;\n}\n",};
const
    render = op.inTrigger("render"),
    inTexMask = op.inTexture("Mask"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op),
    maskAlpha = CGL.TextureEffect.AddBlendAlphaMask(op),

    amount = op.inValueSlider("Amount", 1),
    inMode = op.inSwitch("Color", ["Mono", "RGB", "R", "G", "B"], "Mono"),
    scale = op.inValue("Scale", 22),
    inAspect = op.inBool("Aspect", false),
    rangeMul = op.inValue("Multiply", 1),
    inHarmonics = op.inSwitch("Harmonics", ["1", "2", "3", "4", "5"], "1"),
    x = op.inValue("X", 0),
    y = op.inValue("Y", 0),
    z = op.inValue("Z", 0),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "perlinnoise");

op.setPortGroup("Position", [x, y, z]);

shader.setSource(shader.getDefaultVertexShader(), attachments.perlinnoise3d_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    textureUniformOffZ = new CGL.Uniform(shader, "t", "texOffsetZ", 1),
    textureUniformMask = new CGL.Uniform(shader, "t", "texMask", 2),

    uniZ = new CGL.Uniform(shader, "f", "z", z),
    uniX = new CGL.Uniform(shader, "f", "x", x),
    uniY = new CGL.Uniform(shader, "f", "y", y),
    uniScale = new CGL.Uniform(shader, "f", "scale", scale),
    amountUniform = new CGL.Uniform(shader, "f", "amount", amount),
    rangeMulUniform = new CGL.Uniform(shader, "f", "rangeMul", rangeMul);

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount, maskAlpha);

// offsetMap

const
    inTexOffsetZ = op.inTexture("Offset"),
    inOffsetMul = op.inFloat("Offset Multiply", 1),
    offsetX = op.inSwitch("Offset X", ["None", "R", "G", "B"], "None"),
    offsetY = op.inSwitch("Offset Y", ["None", "R", "G", "B"], "None"),
    offsetZ = op.inSwitch("Offset Z", ["None", "R", "G", "B"], "R");

op.setPortGroup("Offset Map", [inTexOffsetZ, offsetZ, offsetY, offsetX, inOffsetMul]);

const uniOffMul = new CGL.Uniform(shader, "f", "offMul", inOffsetMul);

const uniAspect = new CGL.Uniform(shader, "f", "aspect", 1);
const uniHarmonics = new CGL.Uniform(shader, "f", "harmonics", 0);
inHarmonics.onChange = () =>
{
    uniHarmonics.setValue(parseFloat(inHarmonics.get()));
};

offsetX.onChange =
offsetY.onChange =
offsetZ.onChange =
inTexMask.onChange =
inMode.onChange =
inTexOffsetZ.onChange = updateDefines;
updateDefines();

function updateDefines()
{
    shader.toggleDefine("NO_CHANNEL_R", inMode.get() == "G" || inMode.get() == "B");
    shader.toggleDefine("NO_CHANNEL_G", inMode.get() == "R" || inMode.get() == "B");
    shader.toggleDefine("NO_CHANNEL_B", inMode.get() == "R" || inMode.get() == "G");

    shader.toggleDefine("HAS_TEX_OFFSETMAP", inTexOffsetZ.get());
    shader.toggleDefine("HAS_TEX_MASK", inTexMask.get());

    shader.toggleDefine("OFFSET_X_R", offsetX.get() == "R");
    shader.toggleDefine("OFFSET_X_G", offsetX.get() == "G");
    shader.toggleDefine("OFFSET_X_B", offsetX.get() == "B");

    shader.toggleDefine("OFFSET_Y_R", offsetY.get() == "R");
    shader.toggleDefine("OFFSET_Y_G", offsetY.get() == "G");
    shader.toggleDefine("OFFSET_Y_B", offsetY.get() == "B");

    shader.toggleDefine("OFFSET_Z_R", offsetZ.get() == "R");
    shader.toggleDefine("OFFSET_Z_G", offsetZ.get() == "G");
    shader.toggleDefine("OFFSET_Z_B", offsetZ.get() == "B");

    offsetX.setUiAttribs({ "greyout": !inTexOffsetZ.isLinked() });
    offsetY.setUiAttribs({ "greyout": !inTexOffsetZ.isLinked() });
    offsetZ.setUiAttribs({ "greyout": !inTexOffsetZ.isLinked() });
    inOffsetMul.setUiAttribs({ "greyout": !inTexOffsetZ.isLinked() });

    shader.toggleDefine("RGB", inMode.get() == "RGB");
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    if (inAspect.get()) uniAspect.setValue(cgl.currentTextureEffect.getWidth() / cgl.currentTextureEffect.getHeight());
    else uniAspect.setValue(1);

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);
    if (inTexOffsetZ.get()) cgl.setTexture(1, inTexOffsetZ.get().tex);
    if (inTexMask.get()) cgl.setTexture(2, inTexMask.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Noise.PerlinNoise.prototype = new CABLES.Op();
CABLES.OPS["446442ba-1a7e-4c71-bb43-b12005aa6511"]={f:Ops.Gl.TextureEffects.Noise.PerlinNoise,objName:"Ops.Gl.TextureEffects.Noise.PerlinNoise"};




// **************************************************************
// 
// Ops.Anim.Timer_v2
// 
// **************************************************************

Ops.Anim.Timer_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inSpeed = op.inValue("Speed", 1),
    playPause = op.inValueBool("Play", true),
    reset = op.inTriggerButton("Reset"),
    inSyncTimeline = op.inValueBool("Sync to timeline", false),
    outTime = op.outNumber("Time");

op.setPortGroup("Controls", [playPause, reset, inSpeed]);

const timer = new CABLES.Timer();
let lastTime = null;
let time = 0;
let syncTimeline = false;

playPause.onChange = setState;
setState();

function setState()
{
    if (playPause.get())
    {
        timer.play();
        op.patch.addOnAnimFrame(op);
    }
    else
    {
        timer.pause();
        op.patch.removeOnAnimFrame(op);
    }
}

reset.onTriggered = doReset;

function doReset()
{
    time = 0;
    lastTime = null;
    timer.setTime(0);
    outTime.set(0);
}

inSyncTimeline.onChange = function ()
{
    syncTimeline = inSyncTimeline.get();
    playPause.setUiAttribs({ "greyout": syncTimeline });
    reset.setUiAttribs({ "greyout": syncTimeline });
};

op.onAnimFrame = function (tt)
{
    if (timer.isPlaying())
    {
        if (CABLES.overwriteTime !== undefined)
        {
            outTime.set(CABLES.overwriteTime * inSpeed.get());
        }
        else

        if (syncTimeline)
        {
            outTime.set(tt * inSpeed.get());
        }
        else
        {
            timer.update();
            const timerVal = timer.get();

            if (lastTime === null)
            {
                lastTime = timerVal;
                return;
            }

            const t = Math.abs(timerVal - lastTime);
            lastTime = timerVal;

            time += t * inSpeed.get();
            if (time != time)time = 0;
            outTime.set(time);
        }
    }
};


};

Ops.Anim.Timer_v2.prototype = new CABLES.Op();
CABLES.OPS["aac7f721-208f-411a-adb3-79adae2e471a"]={f:Ops.Anim.Timer_v2,objName:"Ops.Anim.Timer_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Noise.FBMNoise
// 
// **************************************************************

Ops.Gl.TextureEffects.Noise.FBMNoise = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"fbmnoise_frag":"UNI sampler2D tex;\nUNI float anim;\n\nUNI float scale;\nUNI float repeat;\n\nUNI float scrollX;\nUNI float scrollY;\n\nUNI float amount;\n\nUNI bool layer1;\nUNI bool layer2;\nUNI bool layer3;\nUNI bool layer4;\nUNI vec3 color;\nUNI float aspect;\n\nIN vec2 texCoord;\n\n\n{{CGL.BLENDMODES}}\n\n// csdcsdcds\n// adapted from warp shader by inigo quilez/iq\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n\n// See here for a tutorial on how to make this: http://www.iquilezles.org/www/articles/warp/warp.htm\n\nconst mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );\n\nfloat noise( in vec2 x )\n{\n\treturn sin(1.5*x.x)*sin(1.5*x.y);\n}\n\nfloat fbm4( vec2 p )\n{\n    float f = 0.0;\n    f += 0.5000*noise( p ); p = m*p*2.02;\n    f += 0.2500*noise( p ); p = m*p*2.03;\n    f += 0.1250*noise( p ); p = m*p*2.01;\n    f += 0.0625*noise( p );\n    return f/0.9375;\n}\n\nfloat fbm6( vec2 p )\n{\n    float f = 0.0;\n    f += 0.500000*(0.5+0.5*noise( p )); p = m*p*2.02;\n    f += 0.250000*(0.5+0.5*noise( p )); p = m*p*2.03;\n    f += 0.125000*(0.5+0.5*noise( p )); p = m*p*2.01;\n    f += 0.062500*(0.5+0.5*noise( p )); p = m*p*2.04;\n    f += 0.031250*(0.5+0.5*noise( p )); p = m*p*2.01;\n    f += 0.015625*(0.5+0.5*noise( p ));\n    return f/0.96875;\n}\n\nvoid main()\n{\n    // vec4 col=texture(tex,texCoord+2.0*fbm4(texCoord+2.0*fbm6(texCoord+anim)));\n\n    vec2 tc=texCoord;\n\t#ifdef DO_TILEABLE\n\t    tc=abs(texCoord-0.5);\n\t#endif\n\n\n    vec2 p=(tc-0.5)*scale;\n\n\n    p.y/=aspect;\n    vec2 q = vec2( fbm4( p + vec2(0.3+scrollX,0.20+scrollY) ),\n                   fbm4( p + vec2(3.1+scrollX,1.3+scrollY) ) );\n\n    vec2 q2 = vec2( fbm4( p + vec2(2.0+scrollX,1.0+scrollY) ),\n                   fbm4( p + vec2(3.1+scrollX,1.3+scrollY) ) );\n\n    vec2 q3 = vec2( fbm4( p + vec2(9.0+scrollX,4.0+scrollY) ),\n                   fbm4( p + vec2(3.1+scrollX,4.3+scrollY) ) );\n\n\n\n    float v= fbm4( ( p + 4.0*q +anim*0.1)*repeat);\n    float v2= fbm4( (p + 4.0*q2 +anim*0.1)*repeat );\n\n    float v3= fbm6( (p + 4.0*q3 +anim*0.1)*repeat );\n    float v4= fbm6( (p + 4.0*q2 +anim*0.1)*repeat );\n\n\n\n\n    vec4 base=texture(tex,texCoord);\n\n    vec4 finalColor;\n    float colVal=0.0;\n    float numLayers=0.0;\n\n    if(layer1)\n    {\n        colVal+=v;\n        numLayers++;\n    }\n\n    if(layer2)\n    {\n        colVal+=v2;\n        numLayers++;\n    }\n\n    if(layer3)\n    {\n        colVal+=v3;\n        numLayers++;\n    }\n\n    if(layer4)\n    {\n        colVal+=v4;\n        numLayers++;\n    }\n\n    finalColor=vec4( color*vec3(colVal/numLayers),1.0);\n\n    outColor = cgl_blend(base,finalColor,amount);;\n}\n",};
const
    render = op.inTrigger("render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    amount = op.inValueSlider("Amount", 1),
    r = op.inValueSlider("r", 1.0),
    g = op.inValueSlider("g", 1.0),
    b = op.inValueSlider("b", 1.0),
    trigger = op.outTrigger("trigger");

r.setUiAttribs({ "colorPick": true });

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "fbmnoise");

shader.setSource(shader.getDefaultVertexShader(), attachments.fbmnoise_frag);
const textureUniform = new CGL.Uniform(shader, "t", "tex", 0);

const uniScale = new CGL.Uniform(shader, "f", "scale", op.inValue("scale", 2));
const uniAnim = new CGL.Uniform(shader, "f", "anim", op.inValue("anim", 0));
const uniScrollX = new CGL.Uniform(shader, "f", "scrollX", op.inValue("scrollX", 9));
const uniScrollY = new CGL.Uniform(shader, "f", "scrollY", op.inValue("scrollY", 0));
const uniRepeat = new CGL.Uniform(shader, "f", "repeat", op.inValue("repeat", 1));
const uniAspect = new CGL.Uniform(shader, "f", "aspect", op.inValue("aspect", 1));

const uniLayer1 = new CGL.Uniform(shader, "b", "layer1", op.inValueBool("Layer 1", true));
const uniLayer2 = new CGL.Uniform(shader, "b", "layer2", op.inValueBool("Layer 2", true));
const uniLayer3 = new CGL.Uniform(shader, "b", "layer3", op.inValueBool("Layer 3", true));
const uniLayer4 = new CGL.Uniform(shader, "b", "layer4", op.inValueBool("Layer 4", true));

const uniColor = new CGL.Uniform(shader, "3f", "color", r, g, b);

const amountUniform = new CGL.Uniform(shader, "f", "amount", amount);

const tile = op.inValueBool("Tileable", false);
tile.onChange = updateTileable;
function updateTileable()
{
    if (tile.get())shader.define("DO_TILEABLE");
    else shader.removeDefine("DO_TILEABLE");
}

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    uniAspect.set(cgl.currentTextureEffect.getCurrentSourceTexture().width / cgl.currentTextureEffect.getCurrentSourceTexture().height);

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Noise.FBMNoise.prototype = new CABLES.Op();
CABLES.OPS["7073186c-b776-48c2-a01e-041df88ad88a"]={f:Ops.Gl.TextureEffects.Noise.FBMNoise,objName:"Ops.Gl.TextureEffects.Noise.FBMNoise"};




// **************************************************************
// 
// Ops.Math.Multiply
// 
// **************************************************************

Ops.Math.Multiply = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 2),
    result = op.outNumber("result");

op.setTitle("*");

number1.onChange = number2.onChange = update;
update();

function update()
{
    const n1 = number1.get();
    const n2 = number2.get();

    result.set(n1 * n2);
}


};

Ops.Math.Multiply.prototype = new CABLES.Op();
CABLES.OPS["1bbdae06-fbb2-489b-9bcc-36c9d65bd441"]={f:Ops.Math.Multiply,objName:"Ops.Math.Multiply"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ZoomBlur
// 
// **************************************************************

Ops.Gl.TextureEffects.ZoomBlur = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"zoomblur_frag":"UNI sampler2D tex;\nUNI float x;\nUNI float y;\nUNI float strength;\n// UNI vec2 texSize;\nIN vec2 texCoord;\n\n#ifdef HAS_MASK\n    UNI sampler2D texMask;\n#endif\n\n\nfloat random(vec3 scale, float seed) {\n    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n}\n\n\nvoid main()\n{\n    vec4 color = vec4(0.0);\n    float total = 0.0;\n    vec2 center=vec2(x,1.0-y);\n\n    vec2 texSize=vec2(1.0,1.0);\n\n    vec2 toCenter = center - texCoord * texSize;\n\n    /* randomize the lookup values to hide the fixed number of samples */\n    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);\n\n    float am=strength;\n\n    #ifdef HAS_MASK\n        am=am*texture(texMask,texCoord).r;\n        if(am<=0.02)\n        {\n            outColor=texture(tex, texCoord);\n            return;\n        }\n    #endif\n\n\n\n\n    for (float t = 0.0; t <= 40.0; t++) {\n        float percent = (t + offset) / 40.0;\n        float weight = 4.0 * (percent - percent * percent);\n        vec4 smpl = texture(tex, texCoord + toCenter * percent * am / texSize);\n\n        /* switch to pre-multiplied alpha to correctly blur transparent images */\n        smpl.rgb *= smpl.a;\n\n        color += smpl * weight;\n        total += weight;\n    }\n\n    outColor = color / total;\n    // outColor.r=1.0;\n\n    /* switch back from pre-multiplied alpha */\n    // outColor.rgb /= outColor.a + 0.00001;\n}",};
var render=op.inTrigger('render');
var strength=op.inValueSlider("strength",0.5);
var x=op.inValue("X",0.5);
var y=op.inValue("Y",0.5);

var mask=op.inTexture("mask");

mask.onChange=function()
{
    if(mask.get() && mask.get().tex) shader.define('HAS_MASK');
        else shader.removeDefine('HAS_MASK');
};

var trigger=op.outTrigger('trigger');

var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl,'zoomblur');

var srcFrag=attachments.zoomblur_frag;

shader.setSource(shader.getDefaultVertexShader(),srcFrag );
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var textureMask=new CGL.Uniform(shader,'t','texMask',1);

var uniX=new CGL.Uniform(shader,'f','x',x);
var uniY=new CGL.Uniform(shader,'f','y',y);
var strengthUniform=new CGL.Uniform(shader,'f','strength',strength);

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    if(strength.get()>0)
    {
        cgl.pushShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );


        if(mask.get() && mask.get().tex)
        {
            cgl.setTexture(1, mask.get().tex );
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, mask.get().tex );
        }


        cgl.currentTextureEffect.finish();
        cgl.popShader();
    }
    trigger.trigger();
};


};

Ops.Gl.TextureEffects.ZoomBlur.prototype = new CABLES.Op();
CABLES.OPS["b60f01fc-6ea6-4720-ae33-e3d9208e99f9"]={f:Ops.Gl.TextureEffects.ZoomBlur,objName:"Ops.Gl.TextureEffects.ZoomBlur"};




// **************************************************************
// 
// Ops.Anim.RandomAnim
// 
// **************************************************************

Ops.Anim.RandomAnim = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("exe"),

    min = op.inValue("min", 0),
    max = op.inValue("max", 1),
    seed = op.inValue("random seed", 0),

    duration = op.inValue("duration", 0.5),
    pause = op.inValue("pause between", 0),
    next = op.outTrigger("Next"),
    result = op.outNumber("result"),
    looped = op.outTrigger("Looped");

const anim = new CABLES.Anim();
anim.createPort(op, "easing", reinit);

op.setPortGroup("Timing", [duration, pause]);
op.setPortGroup("Value", [min, max, seed]);

op.toWorkPortsNeedToBeLinked(exe);

let counter = 0;

min.onChange =
    max.onChange =
    pause.onChange =
    seed.onChange =
    duration.onChange = reinitLater;

let needsReinit = true;

function reinitLater()
{
    needsReinit = true;
}

function getRandom()
{
    const minVal = (min.get());
    return Math.seededRandom() * (max.get() - minVal) + minVal;
}

function reinit()
{
    Math.randomSeed = seed.get() + counter * 100;
    init(getRandom());
    needsReinit = false;
}

function init(v)
{
    anim.clear();

    anim.setValue(CABLES.now() / 1000.0, v);
    if (pause.get() !== 0.0) anim.setValue(CABLES.now() / 1000.0 + pause.get(), v);

    anim.setValue(duration.get() + CABLES.now() / 1000.0 + pause.get(), getRandom());
}

exe.onTriggered = updateExe;

function updateExe()
{
    if (needsReinit)reinit();

    const t = CABLES.now() / 1000.0;
    const v = anim.getValue(t);

    if (anim.hasEnded(t))
    {
        counter++;
        anim.clear();
        init(v);
        looped.trigger();
    }
    result.set(v);
    next.trigger();
}


};

Ops.Anim.RandomAnim.prototype = new CABLES.Op();
CABLES.OPS["2d2e5f0e-b69f-4789-9a48-1ee6ade5049a"]={f:Ops.Anim.RandomAnim,objName:"Ops.Anim.RandomAnim"};




// **************************************************************
// 
// Ops.Anim.BoolAnim
// 
// **************************************************************

Ops.Anim.BoolAnim = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const anim = new CABLES.Anim();

const
    exe = op.inTrigger("exe"),
    bool = op.inValueBool("bool"),
    pease = anim.createPort(op, "easing"),
    duration = op.inValue("duration", 0.5),
    dir = op.inValueSelect("Direction", ["Animate Both", "Only True", "Only False"], "Both"),
    valueFalse = op.inValue("value false", 0),
    valueTrue = op.inValue("value true", 1),
    next = op.outTrigger("trigger"),
    value = op.outNumber("value"),
    finished = op.outBoolNum("finished"),
    finishedTrigger = op.outTrigger("Finished Trigger");

const startTime = CABLES.now();
op.toWorkPortsNeedToBeLinked(exe);
op.setPortGroup("Animation", [duration, pease]);
op.setPortGroup("Values", [valueFalse, valueTrue]);

dir.onChange = bool.onChange = valueFalse.onChange = valueTrue.onChange = duration.onChange = setAnim;
setAnim();

function setAnim()
{
    finished.set(false);
    const now = (CABLES.now() - startTime) / 1000;
    const oldValue = anim.getValue(now);
    anim.clear();

    anim.setValue(now, oldValue);

    if (!bool.get())
    {
        if (dir.get() != "Only True") anim.setValue(now + duration.get(), valueFalse.get());
        else anim.setValue(now, valueFalse.get());
    }
    else
    {
        if (dir.get() != "Only False") anim.setValue(now + duration.get(), valueTrue.get());
        else anim.setValue(now, valueTrue.get());
    }
}

exe.onTriggered = function ()
{
    const t = (CABLES.now() - startTime) / 1000;
    value.set(anim.getValue(t));

    if (anim.hasEnded(t))
    {
        if (!finished.get()) finishedTrigger.trigger();
        finished.set(true);
    }

    next.trigger();
};


};

Ops.Anim.BoolAnim.prototype = new CABLES.Op();
CABLES.OPS["06ad9d35-ccf5-4d31-889c-e23fa062588a"]={f:Ops.Anim.BoolAnim,objName:"Ops.Anim.BoolAnim"};




// **************************************************************
// 
// Ops.Devices.Mouse.MouseButtons
// 
// **************************************************************

Ops.Devices.Mouse.MouseButtons = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    mouseClickLeft = op.outTrigger("Click Left"),
    mouseClickRight = op.outTrigger("Click Right"),
    mouseDoubleClick = op.outTrigger("Double Click"),
    mouseDownLeft = op.outBoolNum("Button pressed Left", false),
    mouseDownMiddle = op.outBoolNum("Button pressed Middle", false),
    mouseDownRight = op.outBoolNum("Button pressed Right", false),
    triggerMouseDownLeft = op.outTrigger("Mouse Down Left"),
    triggerMouseDownMiddle = op.outTrigger("Mouse Down Middle"),
    triggerMouseDownRight = op.outTrigger("Mouse Down Right"),
    triggerMouseUpLeft = op.outTrigger("Mouse Up Left"),
    triggerMouseUpMiddle = op.outTrigger("Mouse Up Middle"),
    triggerMouseUpRight = op.outTrigger("Mouse Up Right"),
    area = op.inValueSelect("Area", ["Canvas", "Document"], "Canvas"),
    active = op.inValueBool("Active", true);

const cgl = op.patch.cgl;
let listenerElement = null;
area.onChange = updateListeners;
op.onDelete = removeListeners;
updateListeners();

function onMouseDown(e)
{
    if (e.which == 1)
    {
        mouseDownLeft.set(true);
        triggerMouseDownLeft.trigger();
    }
    else if (e.which == 2)
    {
        mouseDownMiddle.set(true);
        triggerMouseDownMiddle.trigger();
    }
    else if (e.which == 3)
    {
        mouseDownRight.set(true);
        triggerMouseDownRight.trigger();
    }
}

function onMouseUp(e)
{
    if (e.which == 1)
    {
        mouseDownLeft.set(false);
        triggerMouseUpLeft.trigger();
    }
    else if (e.which == 2)
    {
        mouseDownMiddle.set(false);
        triggerMouseUpMiddle.trigger();
    }
    else if (e.which == 3)
    {
        mouseDownRight.set(false);
        triggerMouseUpRight.trigger();
    }
}

function onClickRight(e)
{
    mouseClickRight.trigger();
    e.preventDefault();
}

function onDoubleClick(e)
{
    mouseDoubleClick.trigger();
}

function onmouseclick(e)
{
    mouseClickLeft.trigger();
}

function ontouchstart(event)
{
    if (event.touches && event.touches.length > 0)
    {
        event.touches[0].which = 1;
        onMouseDown(event.touches[0]);
    }
}

function ontouchend(event)
{
    onMouseUp({ "which": 1 });
}

function removeListeners()
{
    if (!listenerElement) return;
    listenerElement.removeEventListener("touchend", ontouchend);
    listenerElement.removeEventListener("touchcancel", ontouchend);
    listenerElement.removeEventListener("touchstart", ontouchstart);
    listenerElement.removeEventListener("dblclick", onDoubleClick);
    listenerElement.removeEventListener("click", onmouseclick);
    listenerElement.removeEventListener("mousedown", onMouseDown);
    listenerElement.removeEventListener("mouseup", onMouseUp);
    listenerElement.removeEventListener("contextmenu", onClickRight);
    listenerElement.removeEventListener("mouseleave", onMouseUp);
    listenerElement = null;
}

function addListeners()
{
    if (listenerElement)removeListeners();

    listenerElement = cgl.canvas;
    if (area.get() == "Document") listenerElement = document.body;

    listenerElement.addEventListener("touchend", ontouchend);
    listenerElement.addEventListener("touchcancel", ontouchend);
    listenerElement.addEventListener("touchstart", ontouchstart);
    listenerElement.addEventListener("dblclick", onDoubleClick);
    listenerElement.addEventListener("click", onmouseclick);
    listenerElement.addEventListener("mousedown", onMouseDown);
    listenerElement.addEventListener("mouseup", onMouseUp);
    listenerElement.addEventListener("contextmenu", onClickRight);
    listenerElement.addEventListener("mouseleave", onMouseUp);
}

op.onLoaded = updateListeners;

active.onChange = updateListeners;

function updateListeners()
{
    removeListeners();
    if (active.get()) addListeners();
}


};

Ops.Devices.Mouse.MouseButtons.prototype = new CABLES.Op();
CABLES.OPS["c7e5e545-c8a1-4fef-85c2-45422b947f0d"]={f:Ops.Devices.Mouse.MouseButtons,objName:"Ops.Devices.Mouse.MouseButtons"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.DrawImage_v3
// 
// **************************************************************

Ops.Gl.TextureEffects.DrawImage_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"drawimage_frag":"#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n    UNI sampler2D tex;\n    UNI sampler2D image;\n#endif\n\n#ifdef TEX_TRANSFORM\n    IN mat3 transform;\n#endif\n// UNI float rotate;\n\n{{CGL.BLENDMODES}}\n\n#ifdef HAS_TEXTUREALPHA\n   UNI sampler2D imageAlpha;\n#endif\n\nUNI float amount;\n\n#ifdef ASPECT_RATIO\n    UNI float aspectTex;\n    UNI float aspectPos;\n#endif\n\nvoid main()\n{\n    vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);\n\n    #ifdef HAS_TEXTURES\n        vec2 tc=texCoord;\n\n        #ifdef TEX_FLIP_X\n            tc.x=1.0-tc.x;\n        #endif\n        #ifdef TEX_FLIP_Y\n            tc.y=1.0-tc.y;\n        #endif\n\n        #ifdef ASPECT_RATIO\n            #ifdef ASPECT_AXIS_X\n                tc.y=(1.0-aspectPos)-(((1.0-aspectPos)-tc.y)*aspectTex);\n            #endif\n            #ifdef ASPECT_AXIS_Y\n                tc.x=(1.0-aspectPos)-(((1.0-aspectPos)-tc.x)/aspectTex);\n            #endif\n        #endif\n\n        #ifdef TEX_TRANSFORM\n            vec3 coordinates=vec3(tc.x, tc.y,1.0);\n            tc=(transform * coordinates ).xy;\n        #endif\n\n        blendRGBA=texture(image,tc);\n\n        vec3 blend=blendRGBA.rgb;\n        vec4 baseRGBA=texture(tex,texCoord);\n        vec3 base=baseRGBA.rgb;\n\n\n        #ifdef PREMUL\n            blend.rgb = (blend.rgb) + (base.rgb * (1.0 - blendRGBA.a));\n        #endif\n\n        vec3 colNew=_blend(base,blend);\n\n\n\n\n        #ifdef REMOVE_ALPHA_SRC\n            blendRGBA.a=1.0;\n        #endif\n\n        #ifdef HAS_TEXTUREALPHA\n            vec4 colImgAlpha=texture(imageAlpha,tc);\n            float colImgAlphaAlpha=colImgAlpha.a;\n\n            #ifdef ALPHA_FROM_LUMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef ALPHA_FROM_INV_UMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=1.0-(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef INVERT_ALPHA\n                colImgAlphaAlpha=clamp(colImgAlphaAlpha,0.0,1.0);\n                colImgAlphaAlpha=1.0-colImgAlphaAlpha;\n            #endif\n\n            blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;\n        #endif\n    #endif\n\n    float am=amount;\n\n    #ifdef CLIP_REPEAT\n        if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)\n        {\n            // colNew.rgb=vec3(0.0);\n            am=0.0;\n        }\n    #endif\n\n    #ifdef ASPECT_RATIO\n        #ifdef ASPECT_CROP\n            if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)\n            {\n                colNew.rgb=base.rgb;\n                am=0.0;\n            }\n\n        #endif\n    #endif\n\n\n\n    #ifndef PREMUL\n        blendRGBA.rgb=mix(colNew,base,1.0-(am*blendRGBA.a));\n        blendRGBA.a=clamp(baseRGBA.a+(blendRGBA.a*am),0.,1.);\n    #endif\n\n    #ifdef PREMUL\n        // premultiply\n        // blendRGBA.rgb = (blendRGBA.rgb) + (baseRGBA.rgb * (1.0 - blendRGBA.a));\n        blendRGBA=vec4(\n            mix(colNew.rgb,base,1.0-(am*blendRGBA.a)),\n            blendRGBA.a*am+baseRGBA.a\n            );\n    #endif\n\n    #ifdef ALPHA_MASK\n    blendRGBA.a=baseRGBA.a;\n    #endif\n\n    outColor=blendRGBA;\n}\n\n\n\n\n\n\n\n","drawimage_vert":"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\n\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nOUT vec2 texCoord;\n// OUT vec3 norm;\n\n#ifdef TEX_TRANSFORM\n    UNI float posX;\n    UNI float posY;\n    UNI float scaleX;\n    UNI float scaleY;\n    UNI float rotate;\n    OUT mat3 transform;\n#endif\n\nvoid main()\n{\n   texCoord=attrTexCoord;\n//   norm=attrVertNormal;\n\n   #ifdef TEX_TRANSFORM\n        vec3 coordinates=vec3(attrTexCoord.x, attrTexCoord.y,1.0);\n        float angle = radians( rotate );\n        vec2 scale= vec2(scaleX,scaleY);\n        vec2 translate= vec2(posX,posY);\n\n        transform = mat3(   scale.x * cos( angle ), scale.x * sin( angle ), 0.0,\n            - scale.y * sin( angle ), scale.y * cos( angle ), 0.0,\n            - 0.5 * scale.x * cos( angle ) + 0.5 * scale.y * sin( angle ) - 0.5 * translate.x*2.0 + 0.5,  - 0.5 * scale.x * sin( angle ) - 0.5 * scale.y * cos( angle ) - 0.5 * translate.y*2.0 + 0.5, 1.0);\n   #endif\n\n   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n}\n",};
const
    render = op.inTrigger("render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "blendMode"),
    amount = op.inValueSlider("amount", 1),

    image = op.inTexture("Image"),
    inAlphaPremul = op.inValueBool("Premultiplied", false),
    inAlphaMask = op.inValueBool("Alpha Mask", false),
    removeAlphaSrc = op.inValueBool("removeAlphaSrc", false),

    imageAlpha = op.inTexture("Mask"),
    alphaSrc = op.inValueSelect("Mask Src", ["alpha channel", "luminance", "luminance inv"], "luminance"),
    invAlphaChannel = op.inValueBool("Invert alpha channel"),

    inAspect = op.inValueBool("Aspect Ratio", false),
    inAspectAxis = op.inValueSelect("Stretch Axis", ["X", "Y"], "X"),
    inAspectPos = op.inValueSlider("Position", 0.0),
    inAspectCrop = op.inValueBool("Crop", false),

    trigger = op.outTrigger("trigger");

blendMode.set("normal");
const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "drawimage");

imageAlpha.onLinkChanged = updateAlphaPorts;

op.setPortGroup("Mask", [imageAlpha, alphaSrc, invAlphaChannel]);
op.setPortGroup("Aspect Ratio", [inAspect, inAspectPos, inAspectCrop, inAspectAxis]);

function updateAlphaPorts()
{
    if (imageAlpha.isLinked())
    {
        removeAlphaSrc.setUiAttribs({ "greyout": true });
        alphaSrc.setUiAttribs({ "greyout": false });
        invAlphaChannel.setUiAttribs({ "greyout": false });
    }
    else
    {
        removeAlphaSrc.setUiAttribs({ "greyout": false });
        alphaSrc.setUiAttribs({ "greyout": true });
        invAlphaChannel.setUiAttribs({ "greyout": true });
    }
}

op.toWorkPortsNeedToBeLinked(image);

shader.setSource(attachments.drawimage_vert, attachments.drawimage_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    textureImaghe = new CGL.Uniform(shader, "t", "image", 1),
    textureAlpha = new CGL.Uniform(shader, "t", "imageAlpha", 2),
    uniTexAspect = new CGL.Uniform(shader, "f", "aspectTex", 1),
    uniAspectPos = new CGL.Uniform(shader, "f", "aspectPos", inAspectPos);

inAspect.onChange =
    inAspectCrop.onChange =
    inAspectAxis.onChange = updateAspectRatio;

function updateAspectRatio()
{
    shader.removeDefine("ASPECT_AXIS_X");
    shader.removeDefine("ASPECT_AXIS_Y");
    shader.removeDefine("ASPECT_CROP");

    inAspectPos.setUiAttribs({ "greyout": !inAspect.get() });
    inAspectCrop.setUiAttribs({ "greyout": !inAspect.get() });
    inAspectAxis.setUiAttribs({ "greyout": !inAspect.get() });

    if (inAspect.get())
    {
        shader.define("ASPECT_RATIO");

        if (inAspectCrop.get()) shader.define("ASPECT_CROP");

        if (inAspectAxis.get() == "X") shader.define("ASPECT_AXIS_X");
        if (inAspectAxis.get() == "Y") shader.define("ASPECT_AXIS_Y");
    }
    else
    {
        shader.removeDefine("ASPECT_RATIO");
        if (inAspectCrop.get()) shader.define("ASPECT_CROP");

        if (inAspectAxis.get() == "X") shader.define("ASPECT_AXIS_X");
        if (inAspectAxis.get() == "Y") shader.define("ASPECT_AXIS_Y");
    }
}

alphaSrc.set("alpha channel");

//
// texture flip
//
const flipX = op.inValueBool("flip x");
const flipY = op.inValueBool("flip y");

//
// texture transform
//

let doTransform = op.inValueBool("Transform");

let scaleX = op.inValueSlider("Scale X", 1);
let scaleY = op.inValueSlider("Scale Y", 1);

let posX = op.inValue("Position X", 0);
let posY = op.inValue("Position Y", 0);

let rotate = op.inValue("Rotation", 0);

const inClipRepeat = op.inValueBool("Clip Repeat", false);

const uniScaleX = new CGL.Uniform(shader, "f", "scaleX", scaleX);
const uniScaleY = new CGL.Uniform(shader, "f", "scaleY", scaleY);
const uniPosX = new CGL.Uniform(shader, "f", "posX", posX);
const uniPosY = new CGL.Uniform(shader, "f", "posY", posY);
const uniRotate = new CGL.Uniform(shader, "f", "rotate", rotate);

doTransform.onChange = updateTransformPorts;

function updateTransformPorts()
{
    shader.toggleDefine("TEX_TRANSFORM", doTransform.get());

    scaleX.setUiAttribs({ "greyout": !doTransform.get() });
    scaleY.setUiAttribs({ "greyout": !doTransform.get() });
    posX.setUiAttribs({ "greyout": !doTransform.get() });
    posY.setUiAttribs({ "greyout": !doTransform.get() });
    rotate.setUiAttribs({ "greyout": !doTransform.get() });
}

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

const amountUniform = new CGL.Uniform(shader, "f", "amount", amount);

render.onTriggered = doRender;

inClipRepeat.onChange =
    imageAlpha.onChange =
    inAlphaPremul.onChange =
    inAlphaMask.onChange =
    invAlphaChannel.onChange =
    flipY.onChange =
    flipX.onChange =
    removeAlphaSrc.onChange =
    alphaSrc.onChange = updateDefines;

updateTransformPorts();
updateAlphaPorts();
updateAspectRatio();
updateDefines();

function updateDefines()
{
    shader.toggleDefine("REMOVE_ALPHA_SRC", removeAlphaSrc.get());
    shader.toggleDefine("ALPHA_MASK", inAlphaMask.get());

    shader.toggleDefine("CLIP_REPEAT", inClipRepeat.get());

    shader.toggleDefine("HAS_TEXTUREALPHA", imageAlpha.get() && imageAlpha.get().tex);

    shader.toggleDefine("TEX_FLIP_X", flipX.get());
    shader.toggleDefine("TEX_FLIP_Y", flipY.get());

    shader.toggleDefine("INVERT_ALPHA", invAlphaChannel.get());

    shader.toggleDefine("ALPHA_FROM_LUMINANCE", alphaSrc.get() == "luminance");
    shader.toggleDefine("ALPHA_FROM_INV_UMINANCE", alphaSrc.get() == "luminance_inv");
    shader.toggleDefine("PREMUL", inAlphaPremul.get());
}

function doRender()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    const tex = image.get();
    if (tex && tex.tex && amount.get() > 0.0)
    {
        cgl.pushShader(shader);
        cgl.currentTextureEffect.bind();

        const imgTex = cgl.currentTextureEffect.getCurrentSourceTexture();
        cgl.setTexture(0, imgTex.tex);

        if (imgTex && tex)
        {
            if (tex.textureType != imgTex.textureType && (tex.textureType != CGL.Texture.TYPE_FLOAT || imgTex.textureType != CGL.Texture.TYPE_FLOAT))
                op.setUiError("textypediff", "Drawing 32bit texture into an 8 bit can result in data/precision loss", 1);
            else
                op.setUiError("textypediff", null);
        }

        const asp = 1 / (cgl.currentTextureEffect.getWidth() / cgl.currentTextureEffect.getHeight()) * (tex.width / tex.height);
        // uniTexAspect.setValue(1 / (tex.height / tex.width * imgTex.width / imgTex.height));

        uniTexAspect.setValue(asp);

        cgl.setTexture(1, tex.tex);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, image.get().tex );

        if (imageAlpha.get() && imageAlpha.get().tex)
        {
            cgl.setTexture(2, imageAlpha.get().tex);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, imageAlpha.get().tex );
        }

        // cgl.pushBlend(false);

        cgl.pushBlendMode(CGL.BLEND_NONE, true);

        cgl.currentTextureEffect.finish();
        cgl.popBlendMode();

        // cgl.popBlend();

        cgl.popShader();
    }

    trigger.trigger();
}


};

Ops.Gl.TextureEffects.DrawImage_v3.prototype = new CABLES.Op();
CABLES.OPS["8f6b2f15-fcb0-4597-90c0-e5173f2969fe"]={f:Ops.Gl.TextureEffects.DrawImage_v3,objName:"Ops.Gl.TextureEffects.DrawImage_v3"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ToNormalMap
// 
// **************************************************************

Ops.Gl.TextureEffects.ToNormalMap = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"tonormal_frag":"#ifdef HAS_TEXTURES\n  IN vec2 texCoord;\n  UNI sampler2D tex;\n#endif\n\nUNI float strength;\n\nvoid main()\n{\n\n    float texelSize=1.0/1024.0;\n\n    float tl = abs(texture(tex, texCoord + texelSize * vec2(-1.0, -1.0)).x);   // top left\n    float  l = abs(texture(tex, texCoord + texelSize * vec2(-1.0,  0.0)).x);   // left\n    float bl = abs(texture(tex, texCoord + texelSize * vec2(-1.0,  1.0)).x);   // bottom left\n    float  t = abs(texture(tex, texCoord + texelSize * vec2( 0.0, -1.0)).x);   // top\n    float  b = abs(texture(tex, texCoord + texelSize * vec2( 0.0,  1.0)).x);   // bottom\n    float tr = abs(texture(tex, texCoord + texelSize * vec2( 1.0, -1.0)).x);   // top right\n    float  r = abs(texture(tex, texCoord + texelSize * vec2( 1.0,  0.0)).x);   // right\n    float br = abs(texture(tex, texCoord + texelSize * vec2( 1.0,  1.0)).x);   // bottom right\n\n    //     // Compute dx using Sobel:\n    //     //           -1 0 1\n    //     //           -2 0 2\n    //     //           -1 0 1\n    float dX = tr + 2.0*r + br -tl - 2.0*l - bl;\n\n    //     // Compute dy using Sobel:\n    //     //           -1 -2 -1\n    //     //            0  0  0\n    //     //            1  2  1\n    float dY = bl + 2.0*b + br -tl - 2.0*t - tr;\n\n    //     // Build the normalized normal\n\n    vec4 N = vec4(normalize(vec3(dX,dY, 1.0 / strength)), 1.0);\n\n    //     //convert (-1.0 , 1.0) to (0.0 , 1.0), if needed\n    N= N * 0.5 + 0.5;\n\n   outColor= N;\n}",};
let render = op.inTrigger("render");
let trigger = op.outTrigger("trigger");
let strength = op.inValue("Strength", 4);
let cgl = op.patch.cgl;
let shader = new CGL.Shader(cgl, op.name);

// from: https://forum.openframeworks.cc/t/compute-normal-map-from-image/1400/11

shader.setSource(shader.getDefaultVertexShader(), attachments.tonormal_frag);
let textureUniform = new CGL.Uniform(shader, "t", "tex", 0);
let uniStrength = new CGL.Uniform(shader, "f", "strength", strength);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);


    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.ToNormalMap.prototype = new CABLES.Op();
CABLES.OPS["a9aba612-dc72-4108-a6fb-f0292463a186"]={f:Ops.Gl.TextureEffects.ToNormalMap,objName:"Ops.Gl.TextureEffects.ToNormalMap"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.VertexDisplacementMap_v4
// 
// **************************************************************

Ops.Gl.ShaderEffects.VertexDisplacementMap_v4 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"vertdisplace_body_vert":"\nvec2 MOD_tc=texCoord;\n\n#ifdef MOD_COORD_MESHXY\n    MOD_tc=pos.xy;\n#endif\n#ifdef MOD_COORD_MESHXZ\n    MOD_tc=pos.xz;\n#endif\n\n\n#ifdef MOD_FLIP_Y\n    MOD_tc.y=1.0-MOD_tc.y;\n#endif\n#ifdef MOD_FLIP_X\n    MOD_tc.x=1.0-MOD_tc.x;\n#endif\n#ifdef MOD_FLIP_XY\n    MOD_tc=1.0-MOD_tc;\n#endif\n\nMOD_tc*=MOD_scale;\n\nvec4 MOD_sample=texture( MOD_texture, vec2(MOD_tc.x+MOD_offsetX,MOD_tc.y+MOD_offsetY) );\nvec3 MOD_disp;\n\n#ifdef MOD_INPUT_R\n    MOD_disp=vec3(MOD_sample.r);\n#endif\n#ifdef MOD_INPUT_G\n    MOD_disp=vec3(MOD_sample.g);\n#endif\n#ifdef MOD_INPUT_B\n    MOD_disp=vec3(MOD_sample.b);\n#endif\n#ifdef MOD_INPUT_A\n    MOD_disp=vec3(MOD_sample.a);\n#endif\n#ifdef MOD_INPUT_RGB\n    MOD_disp=MOD_sample.rgb;\n#endif\n#ifdef MOD_INPUT_LUMI\n    MOD_disp=vec3(dot(vec3(0.2126,0.7152,0.0722), MOD_sample.rgb));\n#endif\n\n\n\n#ifdef MOD_HEIGHTMAP_INVERT\n   MOD_disp=1.0-MOD_disp;\n#endif\n// #ifdef MOD_HEIGHTMAP_NORMALIZE\n//   MOD_disp-=0.5;\n//   MOD_disp*=2.0;\n// #endif\n\n\n#ifdef MOD_HEIGHTMAP_NORMALIZE\n    MOD_disp=(MOD_disp-0.5)*2.0;\n    // MOD_disp=(MOD_disp-0.5)*-1.0+0.5;\n#endif\n\n\nfloat MOD_zero=0.0;\n\n#ifdef MOD_MODE_DIV\n    MOD_zero=1.0;\n#endif\n#ifdef MOD_MODE_MUL\n    MOD_zero=1.0;\n#endif\n\n\n\nvec3 MOD_mask=vec3(1.0);\n\n#ifdef MOD_AXIS_X\n    MOD_mask=vec3(1.,0.,0.);\n    MOD_disp*=MOD_mask*MOD_extrude;\n#endif\n#ifdef MOD_AXIS_Y\n    MOD_mask=vec3(0.,1.,0.);\n    MOD_disp*=MOD_mask*MOD_extrude;\n#endif\n#ifdef MOD_AXIS_Z\n    MOD_mask=vec3(0.,0.,1.);\n    MOD_disp*=MOD_mask*MOD_extrude;\n#endif\n#ifdef MOD_AXIS_XY\n    MOD_mask=vec3(1.,1.,0.);\n    MOD_disp*=MOD_mask*MOD_extrude;\n#endif\n#ifdef MOD_AXIS_XYZ\n    MOD_mask=vec3(1.,1.,1.);\n    MOD_disp*=MOD_mask*MOD_extrude;\n#endif\n\n\n// MOD_disp=smoothstep(-1.,1.,MOD_disp*MOD_disp*MOD_disp);\n// MOD_disp=MOD_disp*MOD_disp*MOD_disp;\n\n// #ifdef MOD_FLIP_Y\n//     MOD_mask.y=1.0-MOD_mask.y;\n// #endif\n// #ifdef MOD_FLIP_X\n//     MOD_mask.x=1.0-MOD_mask.x;\n// #endif\n// #ifdef MOD_FLIP_XY\n//     MOD_mask.xy=1.0-MOD_mask.xy;\n// #endif\n\n\n\n#ifdef MOD_MODE_DIV\n    pos.xyz/=MOD_disp*MOD_mask;\n#endif\n\n#ifdef MOD_MODE_MUL\n    pos.xyz*=MOD_disp*MOD_mask;\n#endif\n\n#ifdef MOD_MODE_ADD\n    pos.xyz+=MOD_disp*MOD_mask;\n#endif\n\n#ifdef MOD_MODE_NORMAL\n\n    vec3 MOD_t=norm;\n    #ifdef MOD_SMOOTHSTEP\n        MOD_t=smoothstep(-1.,1.,MOD_t);\n    #endif\n\n    pos.xyz+=MOD_t*MOD_disp*MOD_mask;\n\n#endif\n\n#ifdef MOD_MODE_TANGENT\n    MOD_disp*=-1.0;\n\n    vec3 MOD_t=attrTangent;\n    #ifdef MOD_SMOOTHSTEP\n        MOD_t=smoothstep(-1.,1.,MOD_t);\n    #endif\n\n    pos.xyz+=MOD_t*MOD_disp*MOD_mask;\n\n#endif\n\n#ifdef MOD_MODE_BITANGENT\n    MOD_disp*=-1.0;\n    vec3 MOD_t=attrBiTangent;\n\n    #ifdef MOD_SMOOTHSTEP\n        MOD_t=smoothstep(-1.,1.,MOD_t);\n    #endif\n\n    pos.xyz+=MOD_t*MOD_disp*MOD_mask;\n\n#endif\n\n#ifdef MOD_MODE_VERTCOL\n    vec3 MOD_t=attrVertColor.rgb*vec3(2.0)-vec3(1.0);\n\n    #ifdef MOD_SMOOTHSTEP\n        MOD_t=smoothstep(-1.,1.,MOD_t);\n    #endif\n\n    pos.xyz+=MOD_t*MOD_disp*MOD_mask;\n\n#endif\n\n\n// pos.y*=-1.0;\n    // pos.xy+=vec2(MOD_texVal*MOD_extrude)*normalize(pos.xy);\n\n\nMOD_displHeightMapColor=MOD_disp;\n\n\n#ifdef CALC_NORMALS\n    norm+=MOD_calcNormal(MOD_texture,MOD_tc);\n#endif","vertdisplace_head_vert":"OUT vec3 MOD_displHeightMapColor;\n\n#ifdef MOD_MODE_VERTCOL\n#ifndef VERTEX_COLORS\nIN vec4 attrVertColor;\n#endif\n#endif\n\n// mat4 rotationX( in float angle ) {\n// \treturn mat4(\t1.0,\t\t0,\t\t\t0,\t\t\t0,\n// \t\t\t \t\t0, \tcos(angle),\t-sin(angle),\t\t0,\n// \t\t\t\t\t0, \tsin(angle),\t cos(angle),\t\t0,\n// \t\t\t\t\t0, \t\t\t0,\t\t\t  0, \t\t1);\n// }\n\n// mat4 rotationY( in float angle ) {\n// \treturn mat4(\tcos(angle),\t\t0,\t\tsin(angle),\t0,\n// \t\t\t \t\t\t\t0,\t\t1.0,\t\t\t 0,\t0,\n// \t\t\t\t\t-sin(angle),\t0,\t\tcos(angle),\t0,\n// \t\t\t\t\t\t\t0, \t\t0,\t\t\t\t0,\t1);\n// }\n\n// mat4 rotationZ( in float angle ) {\n// \treturn mat4(\tcos(angle),\t\t-sin(angle),\t0,\t0,\n// \t\t\t \t\tsin(angle),\t\tcos(angle),\t\t0,\t0,\n// \t\t\t\t\t\t\t0,\t\t\t\t0,\t\t1,\t0,\n// \t\t\t\t\t\t\t0,\t\t\t\t0,\t\t0,\t1);\n// }\n\n\nvec3 MOD_calcNormal(sampler2D tex,vec2 uv)\n{\n    float strength=13.0;\n    float texelSize=1.0/512.0;\n\n    float tl = abs(texture(tex, uv + texelSize * vec2(-1.0, -1.0)).x);   // top left\n    float  l = abs(texture(tex, uv + texelSize * vec2(-1.0,  0.0)).x);   // left\n    float bl = abs(texture(tex, uv + texelSize * vec2(-1.0,  1.0)).x);   // bottom left\n    float  t = abs(texture(tex, uv + texelSize * vec2( 0.0, -1.0)).x);   // top\n    float  b = abs(texture(tex, uv + texelSize * vec2( 0.0,  1.0)).x);   // bottom\n    float tr = abs(texture(tex, uv + texelSize * vec2( 1.0, -1.0)).x);   // top right\n    float  r = abs(texture(tex, uv + texelSize * vec2( 1.0,  0.0)).x);   // right\n    float br = abs(texture(tex, uv + texelSize * vec2( 1.0,  1.0)).x);   // bottom right\n\n    //     // Compute dx using Sobel:\n    //     //           -1 0 1\n    //     //           -2 0 2\n    //     //           -1 0 1\n    float dX = tr + 2.0*r + br -tl - 2.0*l - bl;\n\n    //     // Compute dy using Sobel:\n    //     //           -1 -2 -1\n    //     //            0  0  0\n    //     //            1  2  1\n    float dY = bl + 2.0*b + br -tl - 2.0*t - tr;\n\n    //     // Build the normalized normal\n\n    vec3 N = normalize(vec3(dX,dY, 1.0 / strength));\n\n    //     //convert (-1.0 , 1.0) to (0.0 , 1.0), if needed\n    N= N * 0.5 + 0.5;\n\n   return N;\n}\n",};
const
    render = op.inTrigger("Render"),

    // meth = op.inValueSelect("Mode", ["normal", "normal xy", "mul xyz", "mul xy", "sub x", "add x", "add xy", "add y", "add z", "mul y", "mul z", "sub z", "normal2", "normal RGB", "m14"], "normal"),
    extrude = op.inValue("Extrude", 0.5),
    meth = op.inSwitch("Mode", ["Norm", "Tang", "BiTang", "VertCol", "*", "+", "/"], "Norm"),
    axis = op.inSwitch("Axis", ["XYZ", "XY", "X", "Y", "Z"], "XYZ"),
    src = op.inSwitch("Coordinates", ["Tex Coords", "Mesh XY", "Mesh XZ"], "Tex Coords"),

    texture = op.inTexture("Texture", null, "texture"),
    channel = op.inSwitch("Channel", ["Luminance", "R", "G", "B", "A", "RGB"], "Luminance"),
    flip = op.inSwitch("Flip", ["None", "X", "Y", "XY"], "None"),
    range = op.inSwitch("Range", ["0-1", "1-0", "Normalized"], "0-1"),
    offsetX = op.inValueFloat("Offset X"),
    offsetY = op.inValueFloat("Offset Y"),
    scale = op.inValueFloat("Scale", 1),

    calcNormals = op.inValueBool("Calc Normals", false),
    removeZero = op.inValueBool("Discard Zero Values"),
    colorize = op.inValueBool("colorize", false),
    colorizeMin = op.inValueSlider("Colorize Min", 0),
    colorizeMax = op.inValueSlider("Colorize Max", 1),
    next = op.outTrigger("trigger");

const cgl = op.patch.cgl;

op.setPortGroup("Input", [texture, flip, channel, range, offsetX, offsetY, scale]);
op.setPortGroup("Colorize", [colorize, colorizeMin, colorizeMax]);

op.toWorkPortsNeedToBeLinked(texture, next, render);

render.onTriggered = dorender;

channel.onChange =
colorize.onChange =
axis.onChange =
    range.onChange =
    removeZero.onChange =
    flip.onChange =
    calcNormals.onChange =
    src.onChange =
    meth.onChange = updateDefines;

const srcHeadVert = attachments.vertdisplace_head_vert;
const srcBodyVert = attachments.vertdisplace_body_vert;

const srcHeadFrag = ""
    .endl() + "IN vec3 MOD_displHeightMapColor;"
    .endl() + "vec3 MOD_map(vec3 value, float inMin, float inMax, float outMin, float outMax) { return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);}"

    .endl();

const srcBodyFrag = ""
    .endl() + "#ifdef MOD_HEIGHTMAP_COLORIZE"
    .endl() + "   col.rgb*=MOD_map( MOD_displHeightMapColor, 0.0,1.0 , MOD_colorizeMin,MOD_colorizeMax);"
    .endl() + "#endif"
    .endl() + "#ifdef MOD_DISPLACE_REMOVE_ZERO"
    .endl() + "   if(MOD_displHeightMapColor.r==0.0)discard;"
    .endl() + "#endif"
    .endl();

const mod = new CGL.ShaderModifier(cgl, op.name);
mod.addModule({
    "title": op.name,
    "name": "MODULE_VERTEX_POSITION",
    "srcHeadVert": srcHeadVert,
    "srcBodyVert": srcBodyVert
});

mod.addModule({
    "title": op.name,
    "name": "MODULE_COLOR",
    "srcHeadFrag": srcHeadFrag,
    "srcBodyFrag": srcBodyFrag
});

mod.addUniformVert("t", "MOD_texture", 0);
mod.addUniformVert("f", "MOD_extrude", extrude);
mod.addUniformVert("f", "MOD_offsetX", offsetX);
mod.addUniformVert("f", "MOD_offsetY", offsetY);
mod.addUniformVert("f", "MOD_scale", scale);

mod.addUniformFrag("f", "MOD_colorizeMin", colorizeMin);
mod.addUniformFrag("f", "MOD_colorizeMax", colorizeMax);

updateDefines();

function updateDefines()
{
    mod.toggleDefine("MOD_HEIGHTMAP_COLORIZE", colorize.get());

    mod.toggleDefine("MOD_HEIGHTMAP_INVERT", range.get() == "1-0");
    mod.toggleDefine("MOD_HEIGHTMAP_NORMALIZE", range.get() == "Normalized");

    mod.toggleDefine("MOD_DISPLACE_REMOVE_ZERO", removeZero.get());

    mod.toggleDefine("MOD_INPUT_R", channel.get() == "R");
    mod.toggleDefine("MOD_INPUT_G", channel.get() == "G");
    mod.toggleDefine("MOD_INPUT_B", channel.get() == "B");
    mod.toggleDefine("MOD_INPUT_A", channel.get() == "A");
    mod.toggleDefine("MOD_INPUT_RGB", channel.get() == "RGB");
    mod.toggleDefine("MOD_INPUT_LUMI", channel.get() == "Luminance");

    mod.toggleDefine("MOD_FLIP_X", flip.get() == "X");
    mod.toggleDefine("MOD_FLIP_Y", flip.get() == "Y");
    mod.toggleDefine("MOD_FLIP_XY", flip.get() == "XY");

    mod.toggleDefine("MOD_AXIS_X", axis.get() == "X");
    mod.toggleDefine("MOD_AXIS_Y", axis.get() == "Y");
    mod.toggleDefine("MOD_AXIS_Z", axis.get() == "Z");
    mod.toggleDefine("MOD_AXIS_XYZ", axis.get() == "XYZ");
    mod.toggleDefine("MOD_AXIS_XY", axis.get() == "XY");

    mod.toggleDefine("MOD_MODE_BITANGENT", meth.get() == "BiTang");
    mod.toggleDefine("MOD_MODE_TANGENT", meth.get() == "Tang");
    mod.toggleDefine("MOD_MODE_NORMAL", meth.get() == "Norm");
    mod.toggleDefine("MOD_MODE_VERTCOL", meth.get() == "VertCol");
    mod.toggleDefine("MOD_MODE_MUL", meth.get() == "*");
    mod.toggleDefine("MOD_MODE_ADD", meth.get() == "+");
    mod.toggleDefine("MOD_MODE_DIV", meth.get() == "/");
    mod.toggleDefine("MOD_SMOOTHSTEP", 0);

    mod.toggleDefine("MOD_COORD_TC", src.get() == "Tex Coords");
    mod.toggleDefine("MOD_COORD_MESHXY", src.get() == "Mesh XY");
    mod.toggleDefine("MOD_COORD_MESHXZ", src.get() == "Mesh XZ");

    mod.toggleDefine("CALC_NORMALS", calcNormals.get());
}

function dorender()
{
    mod.bind();

    if (texture.get() && !texture.get().deleted) mod.pushTexture("MOD_texture", texture.get());
    else mod.pushTexture("MOD_texture", CGL.Texture.getEmptyTexture(cgl));

    next.trigger();

    mod.unbind();
}


};

Ops.Gl.ShaderEffects.VertexDisplacementMap_v4.prototype = new CABLES.Op();
CABLES.OPS["ed36e5ad-457b-4ac6-a929-11b66951cb6c"]={f:Ops.Gl.ShaderEffects.VertexDisplacementMap_v4,objName:"Ops.Gl.ShaderEffects.VertexDisplacementMap_v4"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.ColorArea_v3
// 
// **************************************************************

Ops.Gl.ShaderEffects.ColorArea_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"colorarea_frag":"\n\n#ifdef MOD_AREA_SPHERE\n    float MOD_de=distance(\n        MOD_pos,\n        vec3(MOD_vertPos.x*MOD_inSizeAmountFalloffSizeX.w,MOD_vertPos.y,MOD_vertPos.z)\n        );\n#endif\n\n#ifdef MOD_AREA_BOX\n    float MOD_de=0.0;\n    if(abs(MOD_vertPos.y-MOD_pos.y)>MOD_inSizeAmountFalloffSizeX.x ||\n        abs(MOD_vertPos.x-MOD_pos.x)>MOD_inSizeAmountFalloffSizeX.x ||\n        abs(MOD_vertPos.z-MOD_pos.z)>MOD_inSizeAmountFalloffSizeX.x ) MOD_de=1.0;\n#endif\n\n#ifdef MOD_AREA_AXIS_X\n    float MOD_de=abs(MOD_pos.x-MOD_vertPos.x);\n#endif\n#ifdef MOD_AREA_AXIS_Y\n    float MOD_de=abs(MOD_pos.y-MOD_vertPos.y);\n#endif\n#ifdef MOD_AREA_AXIS_Z\n    float MOD_de=abs(MOD_pos.z-MOD_vertPos.z);\n#endif\n\n#ifdef MOD_AREA_AXIS_X_INFINITE\n    float MOD_de=MOD_pos.x-MOD_vertPos.x;\n#endif\n#ifdef MOD_AREA_AXIS_Y_INFINITE\n    float MOD_de=MOD_pos.y-MOD_vertPos.y;\n#endif\n#ifdef MOD_AREA_AXIS_Z_INFINITE\n    float MOD_de=MOD_pos.z-MOD_vertPos.z;\n#endif\n\n#ifndef MOD_AREA_BOX\n    MOD_de=1.0-smoothstep(MOD_inSizeAmountFalloffSizeX.z*MOD_inSizeAmountFalloffSizeX.x,MOD_inSizeAmountFalloffSizeX.x,MOD_de);\n#endif\n\n#ifdef MOD_AREA_INVERT\n    MOD_de=1.0-MOD_de;\n#endif\n\n#ifdef MOD_BLEND_NORMAL\n    col.rgb=mix(col.rgb,MOD_color, MOD_de*MOD_inSizeAmountFalloffSizeX.y);\n#endif\n\n\n#ifdef MOD_BLEND_MULTIPLY\n    col.rgb=mix(col.rgb,col.rgb*MOD_color,MOD_de*MOD_inSizeAmountFalloffSizeX.y);\n#endif\n\n#ifdef MOD_BLEND_ADD\n    col.rgb+=MOD_de*MOD_inSizeAmountFalloffSizeX.y*MOD_color;\n#endif\n\n\n#ifdef MOD_BLEND_OPACITY\n    col.a*=(1.0-MOD_de*MOD_inSizeAmountFalloffSizeX.y);\n#endif\n\n#ifdef MOD_BLEND_DISCARD\n    if(MOD_de*MOD_inSizeAmountFalloffSizeX.y>=0.999)discard;\n#endif\n\n// col.rgb=vec3(distance(MOD_vertPos.xyz,MOD_pos.xyz))*0.1\n// col.rgb=MOD_pos.xyz;","colorarea_head_frag":"IN vec4 MOD_vertPos;\n",};
const
    render = op.inTrigger("Render"),
    inArea = op.inValueSelect("Area", ["Sphere", "Box", "Axis X", "Axis Y", "Axis Z", "Axis X Infinite", "Axis Y Infinite", "Axis Z Infinite"], "Sphere"),
    inSize = op.inValue("Size", 1),
    inAmount = op.inValueSlider("Amount", 0.5),
    inFalloff = op.inValueSlider("Falloff", 0),
    inInvert = op.inValueBool("Invert"),
    inBlend = op.inSwitch("Blend ", ["Normal", "Multiply", "Opacity", "Add", "Discard"], "Normal"),
    r = op.inValueSlider("r", Math.random()),
    g = op.inValueSlider("g", Math.random()),
    b = op.inValueSlider("b", Math.random()),
    x = op.inValue("x"),
    y = op.inValue("y"),
    z = op.inValue("z"),
    sizeX = op.inValueSlider("Size X", 1),
    inWorldSpace = op.inValueBool("WorldSpace", true),
    // inPosAbs = op.inValueBool("Position Absolute", true),
    inPrio = op.inBool("Priority", true),
    next = op.outTrigger("Next");

op.setPortGroup("Position", [x, y, z]);
op.setPortGroup("Color", [inBlend, r, g, b]);
r.setUiAttribs({ "colorPick": true });

const cgl = op.patch.cgl;

const srcHeadVert = ""
    .endl() + "OUT vec4 MOD_vertPos;"
    // .endl() + "OUT vec3 MOD_pos;"
    .endl();

const srcBodyVert = ""

// .endl() + "#ifndef MOD_POS_ABS"
// .endl() + "   MOD_pos=(mMatrix*vec4(MOD_posi,1.0)).xyz;"
// .endl() + "#endif"
// .endl() + "#ifdef MOD_POS_ABS"
// .endl() + "   MOD_pos=MOD_posi;"
// .endl() + "#endif"

    .endl() + "#ifndef MOD_WORLDSPACE"
    .endl() + "   MOD_vertPos=vec4(vPosition,1.0);"
    .endl() + "#endif"

    .endl() + "#ifdef MOD_WORLDSPACE"
    .endl() + "   MOD_vertPos=mMatrix*pos;"
    .endl() + "#endif"
    .endl();

inWorldSpace.onChange =
    inArea.onChange =
    inInvert.onChange =
    // inPosAbs.onChange =
    inBlend.onChange = updateDefines;

render.onTriggered = doRender;

const vertModTitle = "vert_" + op.name;
const mod = new CGL.ShaderModifier(cgl, op.name);
mod.addModule({
    "priority": 2,
    "title": vertModTitle,
    "name": "MODULE_VERTEX_POSITION",
    srcHeadVert,
    srcBodyVert
});

mod.addModule({
    "title": op.name,
    "name": "MODULE_COLOR",
    "srcHeadFrag": attachments.colorarea_head_frag,
    "srcBodyFrag": attachments.colorarea_frag
});

mod.addUniform("4f", "MOD_inSizeAmountFalloffSizeX", inSize, inAmount, inFalloff, sizeX);
mod.addUniform("3f", "MOD_color", r, g, b);
mod.addUniform("3f", "MOD_pos", x, y, z);
updateDefines();

inPrio.onChange = updatePrio;
updatePrio();

function updatePrio()
{
    mod.removeModule(vertModTitle);

    const vmod = {
        // "priority": 0,
        "title": vertModTitle,
        "name": "MODULE_VERTEX_POSITION",
        srcHeadVert,
        srcBodyVert
    };

    if (inPrio.get()) vmod.priority = 2;

    mod.addModule(vmod);
}

function updateDefines()
{
    mod.toggleDefine("MOD_BLEND_NORMAL", inBlend.get() == "Normal");
    mod.toggleDefine("MOD_BLEND_OPACITY", inBlend.get() == "Opacity");
    mod.toggleDefine("MOD_BLEND_MULTIPLY", inBlend.get() == "Multiply");
    mod.toggleDefine("MOD_BLEND_DISCARD", inBlend.get() == "Discard");
    mod.toggleDefine("MOD_BLEND_ADD", inBlend.get() == "Add");

    mod.toggleDefine("MOD_AREA_INVERT", inInvert.get());
    mod.toggleDefine("MOD_WORLDSPACE", inWorldSpace.get());
    // mod.toggleDefine("MOD_POS_ABS", inPosAbs.get());

    mod.toggleDefine("MOD_AREA_AXIS_X", inArea.get() == "Axis X");
    mod.toggleDefine("MOD_AREA_AXIS_Y", inArea.get() == "Axis Y");
    mod.toggleDefine("MOD_AREA_AXIS_Z", inArea.get() == "Axis Z");
    mod.toggleDefine("MOD_AREA_AXIS_X_INFINITE", inArea.get() == "Axis X Infinite");
    mod.toggleDefine("MOD_AREA_AXIS_Y_INFINITE", inArea.get() == "Axis Y Infinite");
    mod.toggleDefine("MOD_AREA_AXIS_Z_INFINITE", inArea.get() == "Axis Z Infinite");
    mod.toggleDefine("MOD_AREA_SPHERE", inArea.get() == "Sphere");
    mod.toggleDefine("MOD_AREA_BOX", inArea.get() == "Box");
}

function drawHelpers()
{
    if (cgl.frameStore.shadowPass) return;
    if (cgl.shouldDrawHelpers(op)) gui.setTransformGizmo({ "posX": x, "posY": y, "posZ": z });
}

function doRender()
{
    mod.bind();
    drawHelpers();
    next.trigger();

    mod.unbind();
}


};

Ops.Gl.ShaderEffects.ColorArea_v3.prototype = new CABLES.Op();
CABLES.OPS["bc46bd2b-ea86-4b74-bb2b-7613e1a1a4f3"]={f:Ops.Gl.ShaderEffects.ColorArea_v3,objName:"Ops.Gl.ShaderEffects.ColorArea_v3"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.Twist_v3
// 
// **************************************************************

Ops.Gl.ShaderEffects.Twist_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"twist_vert":"\nfloat MOD_angle_rad = MOD_amount * 3.14159 / 180.0;\n\nfloat MOD_axis=pos.y;\n\n#ifdef MOD_AXIS_Z\n    MOD_axis=pos.z;\n#endif\n\n#ifdef MOD_AXIS_X\n    MOD_axis=pos.x;\n#endif\n\nfloat MOD_ang = (MOD_height*0.5 + MOD_axis)/MOD_height * MOD_angle_rad;\n\npos = MOD_twist(pos, MOD_ang);\n\n\nnorm = normalize(MOD_twist( vec4(norm, 1.0), MOD_ang ).xyz);\n","twist_head_vert":"vec4 MOD_twist(vec4 pos, float t)\n{\n\tfloat st = sin(t);\n\tfloat ct = cos(t);\n\tvec4 new_pos;\n\n\tnew_pos.x = pos.x;\n\tnew_pos.y = pos.y;\n\tnew_pos.z = pos.z;\n\tnew_pos.w = pos.w;\n\n    #ifdef MOD_AXIS_Z\n    \tnew_pos.x = pos.y*ct - pos.x*st;\n    \tnew_pos.y = pos.y*st + pos.x*ct;\n    #endif\n\n    #ifdef MOD_AXIS_Y\n    \tnew_pos.x = pos.x*ct - pos.z*st;\n    \tnew_pos.z = pos.x*st + pos.z*ct;\n    #endif\n\n    #ifdef MOD_AXIS_X\n    \tnew_pos.y = pos.y*ct - pos.z*st;\n    \tnew_pos.z = pos.y*st + pos.z*ct;\n    #endif\n\n\treturn( new_pos );\n}\n",};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("Trigger"),
    amount = op.inFloat("Degree", 180),
    height = op.inFloat("Height", 2),
    axis = op.inValueSelect("Axis", ["X", "Y", "Z"], "Y");

const cgl = op.patch.cgl;

axis.onChange = updateAxis;

const mod = new CGL.ShaderModifier(cgl, op.name);
mod.addModule({
    "name": "MODULE_VERTEX_POSITION",
    "srcHeadVert": attachments.twist_head_vert,
    "srcBodyVert": attachments.twist_vert
});

updateAxis();

mod.addUniformVert("f", "MOD_amount", amount);
mod.addUniformVert("f", "MOD_height", height);

function updateAxis()
{
    mod.toggleDefine("MOD_AXIS_X", axis.get() == "X");
    mod.toggleDefine("MOD_AXIS_Y", axis.get() == "Y");
    mod.toggleDefine("MOD_AXIS_Z", axis.get() == "Z");
}

render.onTriggered = function ()
{
    if (cgl.shouldDrawHelpers(op))
    {
        CABLES.GL_MARKER.drawCube(op, 1, height.get() / 2, 1);
    }

    mod.bind();
    trigger.trigger();
    mod.unbind();
};


};

Ops.Gl.ShaderEffects.Twist_v3.prototype = new CABLES.Op();
CABLES.OPS["4635abe3-a6b1-413f-9cd1-fbf64f8c4942"]={f:Ops.Gl.ShaderEffects.Twist_v3,objName:"Ops.Gl.ShaderEffects.Twist_v3"};




// **************************************************************
// 
// Ops.Deprecated.Json3d.MeshExplosion2
// 
// **************************************************************

Ops.Deprecated.Json3d.MeshExplosion2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const render = op.inTrigger("Render");
const expansion = op.inValue("Expansion");
const next = op.outTrigger("Next");

const inRotX = op.inValueSlider("Rotation X", 1);
const inRotY = op.inValueSlider("Rotation Y", 1);
const inRotZ = op.inValueSlider("Rotation Z", 1);

const inDirectionX = op.inValueSlider("Direction X", 1);
const inDirectionY = op.inValueSlider("Direction Y", 1);
const inDirectionZ = op.inValueSlider("Direction Z", 1);

const cgl = op.patch.cgl;
const currentIndex = -1;

render.onTriggered = doRender;
render.onLinkChanged = reload;

const objects = [];

const tempVec = vec3.create();
const tempMat4 = mat4.create();

const empty = vec3.create();
const dirVec = vec3.create();

function doRender()
{
    if (objects.length === 0)reload();

    for (let i = 0; i < objects.length; i++)
    {
        if (objects[i].transformation)
        {
            cgl.pushModelMatrix();
            mat4.copy(tempMat4, objects[i].transformation);
            vec3.transformMat4(tempVec, empty, tempMat4);

            vec3.normalize(tempVec, tempVec);

            vec3.set(dirVec,
                expansion.get() * inDirectionX.get(),
                expansion.get() * inDirectionY.get(),
                expansion.get() * inDirectionZ.get());
            vec3.mul(tempVec, tempVec, dirVec);

            mat4.translate(tempMat4, tempMat4, tempVec);

            mat4.rotateX(tempMat4, tempMat4, expansion.get() * 0.006 * objects[i].rotation[0] * inRotX.get());
            mat4.rotateY(tempMat4, tempMat4, expansion.get() * 0.006 * objects[i].rotation[1] * inRotY.get());
            mat4.rotateZ(tempMat4, tempMat4, expansion.get() * 0.006 * objects[i].rotation[2] * inRotZ.get());

            // mat4.multiply(cgl.mMatrix,cgl.mMatrix,objects[i].transformation);
            mat4.multiply(cgl.mMatrix, cgl.mMatrix, tempMat4);

            objects[i].mesh.render(cgl.getShader());
            next.trigger();
            cgl.popModelMatrix();
        }
    }
}

function addObject(obj)
{
    Math.randomSeed = 5711;
    if (obj.meshes)
    {
        const object = {};

        const jsonMesh = cgl.frameStore.currentScene.getValue().meshes[obj.meshes[0]];

        const verts = JSON.parse(JSON.stringify(jsonMesh.vertices));
        const geom = new CGL.Geometry();

        geom.vertices = verts;
        geom.vertexNormals = jsonMesh.normals;
        geom.tangents = jsonMesh.tangents;
        geom.biTangents = jsonMesh.bitangents;

        if (jsonMesh.texturecoords) geom.texCoords = jsonMesh.texturecoords[0];
        geom.verticesIndices = [];
        geom.verticesIndices = [].concat.apply([], jsonMesh.faces);

        object.mesh = new CGL.Mesh(cgl, geom);
        object.transformation = JSON.parse(JSON.stringify(obj.transformation));

        object.rotation = [
            Math.seededRandom(),
            Math.seededRandom(),
            Math.seededRandom()];

        mat4.transpose(object.transformation, object.transformation);
        objects.push(object);
    }

    if (obj.children)
    {
        for (const i in obj.children)
        {
            addObject(obj.children[i]);
        }
    }
}

function reload()
{
    if (!cgl.frameStore.currentScene || !cgl.frameStore.currentScene.getValue()) return;

    objects.length = 0;

    addObject(cgl.frameStore.currentScene.getValue().rootnode);
}


};

Ops.Deprecated.Json3d.MeshExplosion2.prototype = new CABLES.Op();
CABLES.OPS["2220f2f2-2219-4e6d-86f1-bdb0b8631308"]={f:Ops.Deprecated.Json3d.MeshExplosion2,objName:"Ops.Deprecated.Json3d.MeshExplosion2"};




// **************************************************************
// 
// Ops.Math.Sum
// 
// **************************************************************

Ops.Math.Sum = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 1),
    result = op.outNumber("result");

op.setTitle("+");

number1.onChange =
number2.onChange = exec;
exec();

function exec()
{
    const v = number1.get() + number2.get();
    if (!isNaN(v))
        result.set(v);
}


};

Ops.Math.Sum.prototype = new CABLES.Op();
CABLES.OPS["c8fb181e-0b03-4b41-9e55-06b6267bc634"]={f:Ops.Math.Sum,objName:"Ops.Math.Sum"};




// **************************************************************
// 
// Ops.Boolean.ToggleBool
// 
// **************************************************************

Ops.Boolean.ToggleBool = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    trigger = op.inTriggerButton("trigger"),
    reset = op.inTriggerButton("reset"),
    outBool = op.outBool("result"),
    inDefault = op.inBool("Default", false);

let theBool = false;
outBool.set(theBool);
outBool.ignoreValueSerialize = true;

trigger.onTriggered = function ()
{
    theBool = !theBool;
    outBool.set(theBool);
};

reset.onTriggered = function ()
{
    theBool = inDefault.get();
    outBool.set(theBool);
};


};

Ops.Boolean.ToggleBool.prototype = new CABLES.Op();
CABLES.OPS["712a25f4-3a93-4042-b8c5-2f56169186cc"]={f:Ops.Boolean.ToggleBool,objName:"Ops.Boolean.ToggleBool"};




// **************************************************************
// 
// Ops.Gl.Shader.MatCapMaterialNew_v3
// 
// **************************************************************

Ops.Gl.Shader.MatCapMaterialNew_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"matcap_frag":"{{MODULES_HEAD}}\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n#endif\n\nIN vec3 transformedNormal;\nIN vec3 viewSpacePosition;\n\nUNI vec4 inColor;\n\nUNI sampler2D texMatcap;\n\n#ifdef HAS_DIFFUSE_TEXTURE\n   UNI sampler2D texDiffuse;\n#endif\n\n#ifdef USE_SPECULAR_TEXTURE\n   UNI sampler2D texSpec;\n   UNI sampler2D texSpecMatCap;\n#endif\n\n#ifdef HAS_AO_TEXTURE\n    UNI sampler2D texAo;\n    UNI float aoIntensity;\n#endif\n\n#ifdef HAS_NORMAL_TEXTURE\n    IN vec3 vBiTangent;\n    IN vec3 vTangent;\n    IN mat3 normalMatrix;\n\n    UNI sampler2D texNormal;\n    UNI float normalMapIntensity;\n#endif\n\n#ifdef HAS_TEXTURE_OPACITY\n    UNI sampler2D texOpacity;\n#endif\n\n#ifdef CALC_SSNORMALS\n    IN vec3 eye_relative_pos;\n\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    vec3 CalculateScreenSpaceNormals() {\n    \tvec3 dFdxPos = dFdx(eye_relative_pos);\n    \tvec3 dFdyPos = dFdy(eye_relative_pos);\n    \tvec3 screenSpaceNormal = normalize( cross(dFdxPos, dFdyPos));\n        return normalize(screenSpaceNormal);\n    }\n#endif\n\n// * taken & modified from https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderLib/meshmatcap_frag.glsl.js\nvec2 getMatCapUV(vec3 viewSpacePosition, vec3 normal) {\n    vec3 viewDir = normalize(-viewSpacePosition);\n\tvec3 x = normalize(vec3(viewDir.z, 0.0, - viewDir.x));\n\tvec3 y = normalize(cross(viewDir, x));\n\tvec2 uv = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks\n\treturn uv;\n}\n\nvoid main()\n{\n    vec3 viewSpaceNormal = normalize(transformedNormal);\n\n    #ifdef HAS_TEXTURES\n        vec2 texCoords = texCoord;\n        {{MODULE_BEGIN_FRAG}}\n    #endif\n\n\n    #ifdef CALC_SSNORMALS\n        viewSpaceNormal = CalculateScreenSpaceNormals();\n    #endif\n\n\n   #ifdef HAS_NORMAL_TEXTURE\n        vec3 normalFromMap = texture( texNormal, texCoord ).xyz * 2.0 - 1.0;\n        normalFromMap = normalize(normalFromMap);\n\n        vec3 tangent;\n        vec3 binormal;\n\n        #ifdef CALC_TANGENT\n            vec3 c1 = cross(normalFromMap, vec3(0.0, 0.0, 1.0));\n            vec3 c2 = cross(normalFromMap, vec3(0.0, 1.0, 0.0));\n\n            tangent = c1;\n            tangent = normalize(tangent);\n            binormal = cross(viewSpaceNormal, tangent);\n            binormal = normalize(binormal);\n        #endif\n\n        #ifndef CALC_TANGENT\n            tangent = normalize(normalMatrix * vTangent);\n            vec3 bitangent = normalize(normalMatrix * vBiTangent);\n            binormal = normalize(cross(viewSpaceNormal, bitangent));\n        #endif\n\n        normalFromMap = normalize(\n            tangent * normalFromMap.x\n            + binormal * normalFromMap.y\n            + viewSpaceNormal * normalFromMap.z\n        );\n\n        vec3 mixedNormal = normalize(viewSpaceNormal + normalFromMap * normalMapIntensity);\n\n        viewSpaceNormal = mixedNormal;\n    #endif\n\n    vec4 col = texture(texMatcap, getMatCapUV(viewSpacePosition, viewSpaceNormal));\n\n    #ifdef HAS_DIFFUSE_TEXTURE\n        col = col*texture(texDiffuse, texCoords);\n    #endif\n\n    col.rgb *= inColor.rgb;\n\n\n    #ifdef HAS_AO_TEXTURE\n        col = col\n            * mix(\n                vec4(1.0,1.0,1.0,1.0),\n                texture(texAo, texCoords),\n                aoIntensity\n            );\n    #endif\n\n    #ifdef USE_SPECULAR_TEXTURE\n        vec4 spec = texture(texSpecMatCap, getMatCapUV(viewSpacePosition, viewSpaceNormal));\n        spec *= texture(texSpec, texCoords);\n        col += spec;\n    #endif\n\n    col.a *= inColor.a;\n\n    #ifdef HAS_TEXTURE_OPACITY\n        #ifdef TRANSFORMALPHATEXCOORDS\n            texCoords=vec2(texCoord.s,1.0-texCoord.t);\n            texCoords.y = 1. - texCoords.y;\n        #endif\n        #ifdef ALPHA_MASK_ALPHA\n            col.a*=texture(texOpacity,texCoords).a;\n        #endif\n        #ifdef ALPHA_MASK_LUMI\n            col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,texCoords).rgb);\n        #endif\n        #ifdef ALPHA_MASK_R\n            col.a*=texture(texOpacity,texCoords).r;\n        #endif\n        #ifdef ALPHA_MASK_G\n            col.a*=texture(texOpacity,texCoords).g;\n        #endif\n        #ifdef ALPHA_MASK_B\n            col.a*=texture(texOpacity,texCoords).b;\n        #endif\n\n        #ifdef DISCARDTRANS\n            if(col.a < 0.2) discard;\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    outColor = col;\n}","matcap_vert":"IN vec3 vPosition;\n\n#ifdef HAS_TEXTURES\n    IN vec2 attrTexCoord;\n#endif\n\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\n\n#ifdef HAS_NORMAL_TEXTURE\n    IN vec3 attrTangent;\n    IN vec3 attrBiTangent;\n    OUT vec3 vBiTangent;\n    OUT vec3 vTangent;\n#endif\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\nUNI vec3 camPos;\n\n#ifdef HAS_TEXTURES\n    UNI vec2 texOffset;\n    UNI vec2 texRepeat;\n    OUT vec2 texCoord;\n#endif\n\nOUT mat3 normalMatrix;\nOUT vec3 viewSpacePosition;\nOUT vec3 transformedNormal;\n\n{{MODULES_HEAD}}\n\n#ifdef CALC_SSNORMALS\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    OUT vec3 eye_relative_pos;\n#endif\n\nmat3 transposeMat3(mat3 m) {\n    return mat3(m[0][0], m[1][0], m[2][0],\n        m[0][1], m[1][1], m[2][1],\n        m[0][2], m[1][2], m[2][2]);\n}\n\n mat3 inverseMat3(mat3 m) {\n    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];\n    float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];\n    float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];\n\n    float b01 = a22 * a11 - a12 * a21;\n    float b11 = -a22 * a10 + a12 * a20;\n    float b21 = a21 * a10 - a11 * a20;\n\n    float det = a00 * b01 + a01 * b11 + a02 * b21;\n\n    return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),\n        b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),\n        b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;\n}\n\nvoid main()\n{\n    #ifdef HAS_TEXTURES\n        texCoord = texRepeat * vec2(attrTexCoord.x, attrTexCoord.y) + texOffset;\n        texCoord.y = 1. - texCoord.y;\n    #endif\n\n    mat4 mMatrix = modelMatrix;\n    mat4 mvMatrix;\n\n    #ifdef HAS_NORMAL_TEXTURE\n        vec3 tangent = attrTangent;\n        vec3 bitangent = attrBiTangent;\n        vTangent = attrTangent;\n        vBiTangent = attrBiTangent;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.);\n    vec3 norm = attrVertNormal;\n\n    {{MODULE_VERTEX_POSITION}}\n\n    mvMatrix = viewMatrix * mMatrix;\n    vec3 normal = norm;\n\n    normalMatrix = transposeMat3(inverseMat3(mat3(mvMatrix)));\n\n    vec3 fragPos = vec3((mvMatrix) * pos);\n    viewSpacePosition = normalize(fragPos);\n\n    #ifdef CALC_SSNORMALS\n        eye_relative_pos = -(vec3(viewMatrix * vec4(camPos, 1.)) - fragPos);\n    #endif\n\n    transformedNormal = normalize(mat3(normalMatrix) * normal);\n\n   gl_Position = projMatrix * mvMatrix * pos;\n\n}",};
const cgl = op.patch.cgl;

const
    render = op.inTrigger("Render"),
    textureMatcap = op.inTexture("MatCap"),
    textureDiffuse = op.inTexture("Diffuse"),
    textureNormal = op.inTexture("Normal"),
    textureSpec = op.inTexture("Specular Mask"),
    textureSpecMatCap = op.inTexture("Specular MatCap"),
    textureAo = op.inTexture("AO Texture"),
    textureOpacity = op.inTexture("Opacity Texture"),
    r = op.inValueSlider("r", 1),
    g = op.inValueSlider("g", 1),
    b = op.inValueSlider("b", 1),
    pOpacity = op.inValueSlider("Opacity", 1),
    aoIntensity = op.inValueSlider("AO Intensity", 1.0),
    normalMapIntensity = op.inFloatSlider("Normal Map Intensity", 1),
    repeatX = op.inValue("Repeat X", 1),
    repeatY = op.inValue("Repeat Y", 1),
    offsetX = op.inValue("Offset X", 0),
    offsetY = op.inValue("Offset Y", 0),
    ssNormals = op.inValueBool("Screen Space Normals"),
    calcTangents = op.inValueBool("Calc normal tangents", true),
    texCoordAlpha = op.inValueBool("Opacity TexCoords Transform", false),
    discardTransPxl = op.inValueBool("Discard Transparent Pixels"),

    next = op.outTrigger("Next"),
    shaderOut = op.outObject("Shader");

r.setUiAttribs({ "colorPick": true });

const alphaMaskSource = op.inSwitch("Alpha Mask Source", ["Luminance", "R", "G", "B", "A"], "Luminance");
alphaMaskSource.setUiAttribs({ "greyout": true });

op.setPortGroup("Texture Opacity", [alphaMaskSource, texCoordAlpha, discardTransPxl]);
op.setPortGroup("Texture Transforms", [aoIntensity, normalMapIntensity, repeatX, repeatY, offsetX, offsetY, calcTangents, ssNormals]);
op.setPortGroup("Texture Maps", [textureDiffuse, textureNormal, textureSpec, textureSpecMatCap, textureAo, textureOpacity]);
op.setPortGroup("Color", [r, g, b, pOpacity]);

const shader = new CGL.Shader(cgl, "MatCapMaterialNew3");
const uniOpacity = new CGL.Uniform(shader, "f", "opacity", pOpacity);

shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);
shader.setSource(attachments.matcap_vert, attachments.matcap_frag);
shaderOut.set(shader);

const textureMatcapUniform = new CGL.Uniform(shader, "t", "texMatcap");
let textureDiffuseUniform = null;
let textureNormalUniform = null;
let normalMapIntensityUniform = null;
let textureSpecUniform = null;
let textureSpecMatCapUniform = null;
let textureAoUniform = null;
const offsetUniform = new CGL.Uniform(shader, "2f", "texOffset", offsetX, offsetY);
const repeatUniform = new CGL.Uniform(shader, "2f", "texRepeat", repeatX, repeatY);

const aoIntensityUniform = new CGL.Uniform(shader, "f", "aoIntensity", aoIntensity);
const colorUniform = new CGL.Uniform(shader, "4f", "inColor", r, g, b, pOpacity);

calcTangents.onChange = updateDefines;
updateDefines();

function updateDefines()
{
    if (calcTangents.get()) shader.define("CALC_TANGENT");
    else shader.removeDefine("CALC_TANGENT");
}

ssNormals.onChange = function ()
{
    if (ssNormals.get())
    {
        if (cgl.glVersion < 2)
        {
            cgl.gl.getExtension("OES_standard_derivatives");
            shader.enableExtension("GL_OES_standard_derivatives");
        }

        shader.define("CALC_SSNORMALS");
    }
    else shader.removeDefine("CALC_SSNORMALS");
};

textureMatcap.onChange = updateMatcap;

function updateMatcap()
{
    if (!cgl.defaultMatcapTex3)
    {
        const pixels = new Uint8Array(256 * 4);
        for (let x = 0; x < 16; x++)
        {
            for (let y = 0; y < 16; y++)
            {
                let c = y * 16;
                c *= Math.min(1, (x + y / 3) / 8);
                pixels[(x + y * 16) * 4 + 0] = pixels[(x + y * 16) * 4 + 1] = pixels[(x + y * 16) * 4 + 2] = c;
                pixels[(x + y * 16) * 4 + 3] = 255;
            }
        }

        cgl.defaultMatcapTex3 = new CGL.Texture(cgl);
        cgl.defaultMatcapTex3.initFromData(pixels, 16, 16, CGL.Texture.FILTER_LINEAR, CGL.Texture.WRAP_REPEAT);
    }
}

textureDiffuse.onChange = function ()
{
    if (textureDiffuse.get())
    {
        if (textureDiffuseUniform !== null) return;
        shader.define("HAS_DIFFUSE_TEXTURE");
        shader.removeUniform("texDiffuse");
        textureDiffuseUniform = new CGL.Uniform(shader, "t", "texDiffuse");
    }
    else
    {
        shader.removeDefine("HAS_DIFFUSE_TEXTURE");
        shader.removeUniform("texDiffuse");
        textureDiffuseUniform = null;
    }
};

textureNormal.onChange = function ()
{
    if (textureNormal.get())
    {
        if (textureNormalUniform !== null) return;
        shader.define("HAS_NORMAL_TEXTURE");
        shader.removeUniform("texNormal");
        textureNormalUniform = new CGL.Uniform(shader, "t", "texNormal");
        if (!normalMapIntensityUniform) normalMapIntensityUniform = new CGL.Uniform(shader, "f", "normalMapIntensity", normalMapIntensity);
    }
    else
    {
        shader.removeDefine("HAS_NORMAL_TEXTURE");
        shader.removeUniform("texNormal");
        textureNormalUniform = null;
    }
};

textureAo.onChange = function ()
{
    if (textureAo.get())
    {
        if (textureAoUniform !== null) return;
        shader.define("HAS_AO_TEXTURE");
        shader.removeUniform("texAo");
        textureAoUniform = new CGL.Uniform(shader, "t", "texAo");
    }
    else
    {
        shader.removeDefine("HAS_AO_TEXTURE");
        shader.removeUniform("texAo");
        textureAoUniform = null;
    }
};

textureSpec.onChange = textureSpecMatCap.onChange = function ()
{
    if (textureSpec.get() && textureSpecMatCap.get())
    {
        if (textureSpecUniform !== null) return;
        shader.define("USE_SPECULAR_TEXTURE");
        shader.removeUniform("texSpec");
        shader.removeUniform("texSpecMatCap");
        textureSpecUniform = new CGL.Uniform(shader, "t", "texSpec");
        textureSpecMatCapUniform = new CGL.Uniform(shader, "t", "texSpecMatCap");
    }
    else
    {
        shader.removeDefine("USE_SPECULAR_TEXTURE");
        shader.removeUniform("texSpec");
        shader.removeUniform("texSpecMatCap");
        textureSpecUniform = null;
        textureSpecMatCapUniform = null;
    }
};

// TEX OPACITY

function updateAlphaMaskMethod()
{
    if (alphaMaskSource.get() == "Alpha Channel") shader.define("ALPHA_MASK_ALPHA");
    else shader.removeDefine("ALPHA_MASK_ALPHA");

    if (alphaMaskSource.get() == "Luminance") shader.define("ALPHA_MASK_LUMI");
    else shader.removeDefine("ALPHA_MASK_LUMI");

    if (alphaMaskSource.get() == "R") shader.define("ALPHA_MASK_R");
    else shader.removeDefine("ALPHA_MASK_R");

    if (alphaMaskSource.get() == "G") shader.define("ALPHA_MASK_G");
    else shader.removeDefine("ALPHA_MASK_G");

    if (alphaMaskSource.get() == "B") shader.define("ALPHA_MASK_B");
    else shader.removeDefine("ALPHA_MASK_B");
}
alphaMaskSource.onChange = updateAlphaMaskMethod;
textureOpacity.onChange = updateOpacity;

let textureOpacityUniform = null;

function updateOpacity()
{
    if (textureOpacity.get())
    {
        if (textureOpacityUniform !== null) return;
        shader.removeUniform("texOpacity");
        shader.define("HAS_TEXTURE_OPACITY");
        if (!textureOpacityUniform) textureOpacityUniform = new CGL.Uniform(shader, "t", "texOpacity");

        alphaMaskSource.setUiAttribs({ "greyout": false });
        discardTransPxl.setUiAttribs({ "greyout": false });
        texCoordAlpha.setUiAttribs({ "greyout": false });
    }
    else
    {
        shader.removeUniform("texOpacity");
        shader.removeDefine("HAS_TEXTURE_OPACITY");
        textureOpacityUniform = null;

        alphaMaskSource.setUiAttribs({ "greyout": true });
        discardTransPxl.setUiAttribs({ "greyout": true });
        texCoordAlpha.setUiAttribs({ "greyout": true });
    }
    updateAlphaMaskMethod();
}

discardTransPxl.onChange = function ()
{
    if (discardTransPxl.get()) shader.define("DISCARDTRANS");
    else shader.removeDefine("DISCARDTRANS");
};

texCoordAlpha.onChange = function ()
{
    if (texCoordAlpha.get()) shader.define("TRANSFORMALPHATEXCOORDS");
    else shader.removeDefine("TRANSFORMALPHATEXCOORDS");
};

function checkUiErrors()
{
    if (textureSpec.get() && !textureSpecMatCap.get())
    {
        op.setUiError("specNoMatCapSpec", "You connected a specular texture but have not connected a specular matcap texture. You need to connect both texture inputs for the specular input to work.", 1);
        op.setUiError("noSpecMatCapSpec", null);
    }
    else if (!textureSpec.get() && textureSpecMatCap.get())
    {
        op.setUiError("noSpecMatCapSpec", "You connected a specular matcap texture but have not connected a specular texture. You need to connect both texture inputs for the specular input to work.", 1);
        op.setUiError("specNoMatCapSpec", null);
    }
    else if (textureSpec.get() && textureSpecMatCap.get())
    {
        op.setUiError("specNoMatCapSpec", null);
        op.setUiError("noSpecMatCapSpec", null);
    }
    else
    {
        op.setUiError("specNoMatCapSpec", null);
        op.setUiError("noSpecMatCapSpec", null);
    }
}

render.onTriggered = function ()
{
    checkUiErrors();

    if (!cgl.defaultMatcapTex3) updateMatcap();
    shader.popTextures();

    const tex = textureMatcap.get() || cgl.defaultMatcapTex3;
    shader.pushTexture(textureMatcapUniform, tex.tex);

    if (textureDiffuse.get() && textureDiffuseUniform) shader.pushTexture(textureDiffuseUniform, textureDiffuse.get().tex);
    if (textureNormal.get() && textureNormalUniform) shader.pushTexture(textureNormalUniform, textureNormal.get().tex);
    if (textureSpec.get() && textureSpecUniform) shader.pushTexture(textureSpecUniform, textureSpec.get().tex);
    if (textureSpecMatCap.get() && textureSpecMatCapUniform) shader.pushTexture(textureSpecMatCapUniform, textureSpecMatCap.get().tex);
    if (textureAo.get() && textureAoUniform) shader.pushTexture(textureAoUniform, textureAo.get().tex);
    if (textureOpacity.get() && textureOpacityUniform) shader.pushTexture(textureOpacityUniform, textureOpacity.get().tex);

    cgl.pushShader(shader);
    next.trigger();
    cgl.popShader();
};


};

Ops.Gl.Shader.MatCapMaterialNew_v3.prototype = new CABLES.Op();
CABLES.OPS["c1dd6e76-61b4-471a-b8d1-f550a5a9a4f4"]={f:Ops.Gl.Shader.MatCapMaterialNew_v3,objName:"Ops.Gl.Shader.MatCapMaterialNew_v3"};




// **************************************************************
// 
// Ops.Deprecated.Json3d.Scene3d_v2
// 
// **************************************************************

Ops.Deprecated.Json3d.Scene3d_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
op.exe = op.addInPort(new CABLES.Port(op, "exe", CABLES.OP_PORT_TYPE_FUNCTION));
let filename = op.addInPort(new CABLES.Port(op, "file", CABLES.OP_PORT_TYPE_VALUE, { "display": "file", "type": "string", "filter": "3d json" }));
let trigger = op.outTrigger("trigger");
let doCreate = op.inTriggerButton("Create Nodes");
let createNonMesh = op.inValueBool("Create Non Mesh Nodes");
let createMaterials = op.inValueBool("Create Materials", false);
let detectClones = op.inValueBool("Detect Clones", true);
let inReplaceMaterials = op.inObject("Mesh Materials");
let outLoading = op.outValueBool("Loading", false);

let cgl = op.patch.cgl;

let scene = new CABLES.Variable();

cgl.frameStore.currentScene = null;

doCreate.onTriggered = createNodes;

let defaultEasing = CABLES.EASING_LINEAR;
let skipFrames = 1;
let frameNum = 0;
let cloneTransformStore = [];
let data = null;
let prevOp = null;
filename.onChange = reload;
op.exe.onTriggered = render;

let subPatchOpStart = op;
let subPatchId = op.uiAttribs.subPatch;
let subPatchOp = null;

function render()
{
    let oldScene = cgl.frameStore.currentScene;
    cgl.frameStore.currentScene = scene;
    if (cgl.frameStore.currentScene.materials)cgl.frameStore.currentScene.materials.length = 0;
    cgl.frameStore.currentScene.replaceMaterials = inReplaceMaterials.get();

    cgl.frameStore.cloneTransforms = cloneTransformStore;

    cgl.pushModelMatrix();
    trigger.trigger();
    cgl.popModelMatrix();

    cgl.frameStore.currentScene = oldScene;
}

let setPortAnimated = function (p, doLerp)
{
    p.setAnimated(true);
    if (doLerp)p.anim.defaultEasing = defaultEasing;
};


function loadMaterials(data, root)
{
    if (data.materials)
    {
        let lastSetMatop = null;
        for (let i in data.materials)
        {
            let jsonMat = data.materials[i];

            let matName = "";
            for (var j in jsonMat.properties)
            {
                if (jsonMat.properties[j].key == "?mat.name")
                {
                    matName = jsonMat.properties[j].value;
                }
            }

            for (var j in jsonMat.properties)
            {
                if (createMaterials.get() && jsonMat.properties[j].key && jsonMat.properties[j].value && jsonMat.properties[j].key == "$clr.diffuse")
                {
                    const setMatOp = op.patch.addOp("Ops.Json3d.SetMaterial", { "subPatch": subPatchId });

                    setMatOp.getPort("name").set(matName);
                    setMatOp.name = "Set Material " + matName;

                    let matOp = op.patch.addOp("Ops.Gl.Phong.PhongMaterial", { "subPatch": subPatchId });
                    matOp.getPort("diffuse r").set(jsonMat.properties[j].value[0]);
                    matOp.getPort("diffuse g").set(jsonMat.properties[j].value[1]);
                    matOp.getPort("diffuse b").set(jsonMat.properties[j].value[2]);
                    matOp.uiAttribs.title = matOp.name = "" + matName;

                    op.patch.link(setMatOp, "material", matOp, "shader");
                    op.patch.link(setMatOp, "exe", matOp, "trigger");

                    if (lastSetMatop) op.patch.link(lastSetMatop, "trigger", matOp, "render");
                    else op.patch.link(root, "trigger 0", matOp, "render");

                    lastSetMatop = setMatOp;
                    prevOp = matOp;
                }
            }
        }
    }
}


let loadCameras = function (data, seq)
{
    let i = 0;
    var camOp = null;

    function getCamera(root, _cam)
    {
        let cam = { "cam": _cam };
        for (i in root.children)
        {
            if (root.children[i].name == _cam.name)
            {
                cam.eye = root.children[i];
                cam.transformation = root.children[i].transformation;
                mat4.transpose(cam.transformation, cam.transformation);

                // guess camera target (...)
                for (let j = 0; j < root.children.length; j++)
                {
                    if (root.children[j].name == root.children[i].name + "_Target")
                    {
                        op.log("Found cameratarget!");
                        cam.target = root.children[i];
                        root.children.splice(j, 1);
                        root.children.splice(i, 1);
                        return cam;
                    }
                }
            }
        }
        return cam;
    }


    let camSeq = null;

    if (data.hasOwnProperty("cameras"))
    {
        camSeq = op.patch.addOp("Ops.Trigger.TimedSequence", { "subPatch": subPatchId, "translate": { "x": op.uiAttribs.translate.x, "y": op.uiAttribs.translate.y + 50 } });
        op.patch.link(camSeq, "exe", op, "trigger");

        op.log("camera....");

        let camCount = 0;
        for (i in data.cameras)
        {
            let cam = getCamera(data.rootnode, data.cameras[i]);

            if (cam)
            {
                if (!cam.target) continue;

                var camOp = op.patch.addOp("Ops.Gl.Matrix.QuaternionCamera", { "subPatch": subPatchId, "translate": { "x": op.uiAttribs.translate.x + camCount * 200, "y": op.uiAttribs.translate.y + 100 } });
                camOp.uiAttribs.title = camOp.name = "cam " + cam.cam.name;

                var an = dataGetAnimation(data, cam.cam.name);
                op.patch.link(camSeq, "trigger " + camCount, camOp, "render");
                op.patch.link(camOp, "trigger", seq, "exe " + camCount);
                camCount++;

                camOp.getPort("fov").set(cam.cam.horizontalfov);
                camOp.getPort("clip near").set(cam.cam.clipplanenear);
                camOp.getPort("clip far").set(cam.cam.clipplanefar);

                camOp.getPort("centerX").set(cam.cam.lookat[0]);
                camOp.getPort("centerY").set(cam.cam.lookat[1]);
                camOp.getPort("centerZ").set(cam.cam.lookat[2]);

                camOp.getPort("matrix").set(cam.transformation);

                if (an)
                {
                    if (an.positionkeys)
                    {
                        setPortAnimated(camOp.getPort("EyeX"), false);
                        setPortAnimated(camOp.getPort("EyeY"), false);
                        setPortAnimated(camOp.getPort("EyeZ"), false);

                        frameNum = skipFrames;
                        for (var k in an.positionkeys)
                        {
                            if (frameNum % skipFrames === 0)
                            {
                                camOp.getPort("EyeX").anim.setValue(an.positionkeys[k][0], an.positionkeys[k][1][0]);
                                camOp.getPort("EyeY").anim.setValue(an.positionkeys[k][0], an.positionkeys[k][1][1]);
                                camOp.getPort("EyeZ").anim.setValue(an.positionkeys[k][0], an.positionkeys[k][1][2]);
                            }
                            frameNum++;
                        }
                    }

                    if (an.rotationkeys)
                    {
                        setPortAnimated(camOp.getPort("quat x"), false);
                        setPortAnimated(camOp.getPort("quat y"), false);
                        setPortAnimated(camOp.getPort("quat z"), false);
                        setPortAnimated(camOp.getPort("quat w"), false);

                        frameNum = skipFrames;
                        for (var k in an.rotationkeys)
                        {
                            if (frameNum % skipFrames == 0)
                            {
                                camOp.getPort("quat x").anim.setValue(an.rotationkeys[k][0], an.rotationkeys[k][1][0]);
                                camOp.getPort("quat y").anim.setValue(an.rotationkeys[k][0], an.rotationkeys[k][1][1]);
                                camOp.getPort("quat z").anim.setValue(an.rotationkeys[k][0], an.rotationkeys[k][1][2]);
                                camOp.getPort("quat w").anim.setValue(an.rotationkeys[k][0], an.rotationkeys[k][1][3]);
                            }
                            frameNum++;
                        }
                    }
                }
                else
                {
                    var camOp = op.patch.addOp("Ops.Gl.Matrix.LookatCamera", { "subPatch": subPatchId, "translate": { "x": op.uiAttribs.translate.x + camCount * 150, "y": op.uiAttribs.translate.y + 100 } });
                    camOp.uiAttribs.title = camOp.name = "cam " + cam.cam.name;
                    // op.patch.link(camOp,'render',self,'trigger');

                    op.patch.link(camSeq, "trigger " + camCount, camOp, "render");
                    op.patch.link(camOp, "trigger", seq, "exe " + camCount);
                    camCount++;

                    camOp.getPort("eyeX").set(900);
                    camOp.getPort("eyeY").set(900);
                    camOp.getPort("eyeZ").set(-240);

                    var an = dataGetAnimation(data, cam.cam.name);
                    if (an)
                    {
                        setPortAnimated(camOp.getPort("eyeX"), false);
                        setPortAnimated(camOp.getPort("eyeY"), false);
                        setPortAnimated(camOp.getPort("eyeZ"), false);

                        frameNum = skipFrames;
                        for (var k in an.positionkeys)
                        {
                            if (frameNum % skipFrames == 0)
                            {
                                camOp.getPort("eyeX").anim.setValue(an.positionkeys[k][0], an.positionkeys[k][1][0]);
                                camOp.getPort("eyeY").anim.setValue(an.positionkeys[k][0], an.positionkeys[k][1][1]);
                                camOp.getPort("eyeZ").anim.setValue(an.positionkeys[k][0], an.positionkeys[k][1][2]);
                            }
                            frameNum++;
                        }
                    }

                    var an = dataGetAnimation(data, cam.cam.name + "_Target");
                    if (an)
                    {
                        setPortAnimated(camOp.getPort("centerX"), false);
                        setPortAnimated(camOp.getPort("centerY"), false);
                        setPortAnimated(camOp.getPort("centerZ"), false);

                        frameNum = skipFrames;
                        for (var k in an.positionkeys)
                        {
                            if (frameNum % skipFrames == 0)
                            {
                                camOp.getPort("centerX").anim.setValue(an.positionkeys[k][0], an.positionkeys[k][1][0]);
                                camOp.getPort("centerY").anim.setValue(an.positionkeys[k][0], an.positionkeys[k][1][1]);
                                camOp.getPort("centerZ").anim.setValue(an.positionkeys[k][0], an.positionkeys[k][1][2]);
                            }
                            frameNum++;
                        }
                    }
                    else
                    {
                        camOp.getPort("centerX").set(cam.target.transformation[12]);
                        camOp.getPort("centerY").set(cam.target.transformation[13]);
                        camOp.getPort("centerZ").set(cam.target.transformation[14]);

                        op.log("target not animated", cam.target.transformation[3]);
                    }
                }
            }
        }
    }

    return null;
};

function dataGetAnimation(data, name)
{
    if (!data.hasOwnProperty("animations")) return false;

    for (let iAnims in data.animations)
    {
        for (let iChannels in data.animations[iAnims].channels)
        {
            if (data.animations[iAnims].channels[iChannels].name == name)
            {
                return data.animations[iAnims].channels[iChannels];
            }
        }
    }
    return false;
}

let maxx = -3;
let row = 0;

function hasMeshChildNode(n)
{
    if (createNonMesh.get()) return true;
    if (n.meshes && n.meshes.length > 0) return true;
    if (n.hasOwnProperty("children"))
    {
        for (let i = 0; i < n.children.length; i++)
        {
            if (n.children[i].meshes && n.children[i].meshes.length > 0) return true;

            let childMeshes = hasMeshChildNode(n.children[i]);
            if (childMeshes) return true;
        }
    }

    op.log("has no childs", n);

    return false;
}

function addChild(data, x, y, parentOp, parentPort, ch)
{
    if (ch.hasOwnProperty("transformation"))
    {
        maxx = Math.max(x, maxx) + 1;
        let prevOp = null;

        if (data.hasOwnProperty("animations"))
        {
            let an = dataGetAnimation(data, ch.name);
            if (an)
            {
                if (an.positionkeys && an.positionkeys.length > 0)
                {
                    let anTransOp = op.patch.addOp("Ops.Json3d.TranslateChannel", { "subPatch": subPatchId });
                    anTransOp.uiAttribs.title = anTransOp.name = ch.name + " trans anim";
                    anTransOp.getPort("channel").set(ch.name);
                    op.patch.link(prevOp, "trigger", anTransOp, "render");

                    if (!prevOp)op.patch.link(parentOp, parentPort, anTransOp, "render");
                    prevOp = anTransOp;
                }


                if (an.rotationkeys && an.rotationkeys.length > 0)
                {
                    let anRotOp = op.patch.addOp("Ops.Json3d.QuaternionChannel", { "subPatch": subPatchId });
                    anRotOp.uiAttribs.title = anRotOp.name = ch.name + " quat rot anim";
                    anRotOp.getPort("channel").set(ch.name);
                    op.patch.link(prevOp, "trigger", anRotOp, "render");

                    if (!prevOp)op.patch.link(parentOp, parentPort, anRotOp, "render");
                    prevOp = anRotOp;
                }


                if (an.scalingkeys && an.scalingkeys.length > 0)
                {
                    let anScaleOp = op.patch.addOp("Ops.Json3d.ScaleChannel", { "subPatch": subPatchId });
                    anScaleOp.uiAttribs.title = anScaleOp.name = ch.name + " scale anim";
                    anScaleOp.getPort("channel").set(ch.name);
                    op.patch.link(prevOp, "trigger", anScaleOp, "render");

                    if (!prevOp)op.patch.link(parentOp, parentPort, anScaleOp, "render");
                    prevOp = anScaleOp;
                }
            }
        }

        let sameMesh = false;

        if (detectClones.get())
        {
            sameMesh = true;

            if (ch.hasOwnProperty("children"))
            {
                // test if children are all same mesh...

                var cloneTransforms = [];
                if (ch.children.length > 1 && ch.children[0].meshes && ch.children[0].meshes.length > 0)
                {
                    for (i = 0; i < ch.children.length; i++)
                    {
                        if (i > 0 && ch.children[i].meshes)
                        {
                            if (ch.children[0].meshes && ch.children[i].meshes && ch.children[i].meshes.length == ch.children[0].meshes.length)
                            {
                                if (ch.children[i].meshes[0] == ch.children[0].meshes[0])
                                {

                                }
                                else { sameMesh = false; }
                            }
                            else { sameMesh = false; }
                        }

                        if (sameMesh)
                        {
                            if (!ch.children[i].transposed)
                            {
                                mat4.transpose(ch.children[i].transformation, ch.children[i].transformation);
                                ch.children[i].transposed = true;
                            }
                            cloneTransforms.push(ch.children[i].transformation);
                        }
                    }
                }
                else { sameMesh = false; }
            }
            else { sameMesh = false; }
        }

        if (!prevOp)
        {
            let eq = mat4.exactEquals(ch.transformation, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

            if (!eq)
            {
                let transOp = op.patch.addOp("Ops.Gl.Matrix.MatrixMul", { "subPatch": subPatchId });

                if (!ch.transposed)
                {
                    ch.transposed = true;
                    mat4.transpose(ch.transformation, ch.transformation);
                }

                transOp.getPort("matrix").set(ch.transformation);
                prevOp = transOp;

                op.patch.link(parentOp, parentPort, prevOp, "render");
                if (ch.name) transOp.uiAttribs.title = transOp.name = ch.name;
            }
            else
                prevOp = parentOp;
        }


        var i = 0;
        if (ch.hasOwnProperty("meshes") || sameMesh)
        {
            let useChildrenMeshes = false;
            let len = 0;
            if (ch.meshes)
            {
                len = ch.meshes.length;
            }
            else
            {
                if (ch.children[0].meshes)
                {
                    len = ch.children[0].meshes.length;
                    useChildrenMeshes = true;
                }
            }

            for (i = 0; i < len; i++)
            {
                let index = -1;

                if (!useChildrenMeshes) index = ch.meshes[i];
                else index = ch.children[0].meshes[0];

                // material
                if (data.meshes[index].hasOwnProperty("materialindex") && data.hasOwnProperty("materials"))
                {
                    let matIndex = data.meshes[index].materialindex;
                    let jsonMat = data.materials[matIndex];

                    if (inReplaceMaterials.get() && inReplaceMaterials.get()[ch.name])
                    {
                        var matOp = op.patch.addOp("Ops.Json3d.SetMaterialShader", { "subPatch": subPatchId });
                        matOp.getPort("Key").set(ch.name);

                        var l = op.patch.link(prevOp, "trigger", matOp, "exe");

                        if (!l)
                        {
                            l = op.patch.link(parentOp, "trigger 15", matOp, "exe");
                        }

                        prevOp = matOp;
                    }
                    else
                    if (createMaterials.get())
                    {
                        var matOp = op.patch.addOp("Ops.Json3d.Material", { "subPatch": subPatchId });
                        op.patch.link(prevOp, "trigger", matOp, "exe");
                        prevOp = matOp;

                        for (let j in jsonMat.properties)
                            if (jsonMat.properties[j].key && jsonMat.properties[j].value && jsonMat.properties[j].key == "?mat.name")
                                matOp.getPort("name").set(jsonMat.properties[j].value);
                    }
                }

                if (!sameMesh)
                {
                    // mesh
                    var meshOp = op.patch.addOp("Ops.Json3d.Mesh", { "subPatch": subPatchId });
                    meshOp.index.val = index;
                    meshOp.uiAttribs.title = meshOp.name = ch.name + "";
                    var l = op.patch.link(prevOp, "trigger", meshOp, "render");

                    if (!l)
                    {
                        var l = op.patch.link(parentOp, "trigger 15", meshOp, "render");
                        op.log("prevOp link", parentOp);
                    }
                }
            }
        }


        if (ch.hasOwnProperty("children"))
        {
            op.log(ch.name + " children are clones: ", sameMesh);

            if (sameMesh)
            {
                let clonedOp = op.patch.addOp("Ops.Json3d.ClonedMesh", { "subPatch": subPatchId });

                clonedOp.getPort("transformations").set(cloneTransforms);

                cloneTransformStore.push(cloneTransforms);

                op.patch.link(prevOp, "trigger", clonedOp, "render");

                var meshOp = op.patch.addOp("Ops.Json3d.Mesh", { "subPatch": subPatchId });
                meshOp.index.val = ch.children[0].meshes[0];
                meshOp.uiAttribs.title = meshOp.name = "clone " + ch.name + " Mesh";
                meshOp.getPort("draw").set(false);

                op.patch.link(prevOp, "trigger", meshOp, "render");
                op.patch.link(clonedOp, "geom", meshOp, "geometry");
            }

            if (!sameMesh)
            {
                y++;
                for (i = 0; i < ch.children.length; i++)
                {
                    let xx = maxx;
                    if (ch.children.length > 1)xx++;

                    if (hasMeshChildNode(ch.children[i]))
                        addChild(data, xx, y, prevOp, "trigger", ch.children[i]);
                }
            }
        }
    }
}

function reload()
{
    doCreate.setUiAttribs({ "greyout": true });
    if (!filename.get()) return;

    function doLoad()
    {
        CABLES.ajax(
            op.patch.getFilePath(filename.get()),
            function (err, _data, xhr)
            {
                if (err)
                {
                    if (CABLES.UI)op.uiAttr({ "error": "could not load file..." });

                    op.logError("ajax error:", err);
                    op.patch.loading.finished(loadingId);
                    return;
                }
                else
                {
                    if (CABLES.UI)op.uiAttr({ "error": null });
                }

                try
                {
                    data = JSON.parse(_data);
                }
                catch (ex)
                {
                    outLoading.set(false);
                    op.patch.loading.finished(loadingId);
                    if (CABLES.UI)op.uiAttr({ "error": "could not load file..." });
                    return;
                }


                scene.setValue(data);
                doCreate.setUiAttribs({ "greyout": false });
                op.patch.loading.finished(loadingId);

                outLoading.set(false);
                if (CABLES.UI) gui.jobs().finish("loading3d" + loadingId);
                doCreate.setUiAttribs({ "greyout": false });
            });
    }


    outLoading.set(true);
    var loadingId = op.patch.loading.start("json3dScene", filename.get());
    if (CABLES.UI) gui.jobs().start({ "id": "loading3d" + loadingId, "title": "loading 3d data" }, doLoad);
    else doLoad();
}

function createNodes()
{
    if (!trigger.isLinked())
    {
        let subPatchOpStartPort = "trigger";
        if (!subPatchOp)
        {
            subPatchId = op.uiAttribs.subPatch;
            subPatchOp = op.patch.addOp(CABLES.UI.OPNAME_SUBPATCH, { "subPatch": subPatchId });
            subPatchOp.setTitle("3d scene");
            subPatchId = subPatchOp.getPort("patchId").get();
            op.patch.link(op, "trigger", subPatchOp, "create port");

            let inputs = op.patch.getOpsByObjName("Ops.Ui.PatchInput");

            for (var i = 0; i < inputs.length; i++)
            {
                if (inputs[i].uiAttribs.subPatch == subPatchId)
                {
                    subPatchOpStart = inputs[i];
                    subPatchOpStartPort = subPatchOpStart.portsOut[0].name;
                }
            }
        }


        let rootMatrixOp = op.patch.addOp("Ops.Gl.Matrix.MatrixMul", { "subPatch": subPatchId, "translate": { "x": op.uiAttribs.translate.x, "y": op.uiAttribs.translate.y + 75 } });
        rootMatrixOp.uiAttribs.title = "rootMatrix";

        mat4.transpose(data.rootnode.transformation, data.rootnode.transformation);
        rootMatrixOp.getPort("matrix").set(data.rootnode.transformation);

        // op.patch.link(op,'trigger',rootMatrixOp,'render');
        op.patch.link(subPatchOpStart, subPatchOpStartPort, rootMatrixOp, "render");

        let root = op.patch.addOp("Ops.Sequence", { "subPatch": subPatchId, "translate": { "x": op.uiAttribs.translate.x, "y": op.uiAttribs.translate.y + 150 } });
        let camOp = loadCameras(data, root);

        if (camOp) op.patch.link(camOp, "trigger", root, "exe");
        else op.patch.link(rootMatrixOp, "trigger", root, "exe");

        loadMaterials(data, root);

        for (var i = 0; i < data.rootnode.children.length; i++)
        {
            if (data.rootnode.children[i])
            {
                let ntrigger = i + 2;
                if (ntrigger > 9)ntrigger = 9;

                if (hasMeshChildNode(data.rootnode.children[i]))
                    addChild(data, maxx - 2, 3, root, "trigger " + ntrigger, data.rootnode.children[i]);
            }
        }

        if (CABLES.UI)
        {
            setTimeout(function ()
            {
                gui.patchView.centerSelectOp(subPatchOpStart.id);
                // CABLES.CMD.PATCH.tidyChildOps();

                gui.patchView.updateSubPatches();
            }, 100);
            gui.patchView.updateSubPatches();
        }
    }
    else
    {
        if (CABLES.UI)
        {
            CABLES.UI.notifyError("remove child nodes first");
        }
    }
}


};

Ops.Deprecated.Json3d.Scene3d_v2.prototype = new CABLES.Op();
CABLES.OPS["44f0aa70-e97d-41cf-9560-369bffa0d21c"]={f:Ops.Deprecated.Json3d.Scene3d_v2,objName:"Ops.Deprecated.Json3d.Scene3d_v2"};




// **************************************************************
// 
// Ops.Gl.Matrix.Scale
// 
// **************************************************************

Ops.Gl.Matrix.Scale = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render = op.inTrigger("render"),
    scale = op.inValueFloat("scale", 1.0),
    trigger = op.outTrigger("trigger");

const vScale = vec3.create();

scale.onChange = scaleChanged;
scaleChanged();

render.onTriggered = function ()
{
    const cgl = op.patch.cg;
    cgl.pushModelMatrix();
    mat4.scale(cgl.mMatrix, cgl.mMatrix, vScale);
    trigger.trigger();
    cgl.popModelMatrix();
};

function scaleChanged()
{
    const s = scale.get();
    vec3.set(vScale, s, s, s);
}


};

Ops.Gl.Matrix.Scale.prototype = new CABLES.Op();
CABLES.OPS["50e7f565-0cdb-47ca-912b-87c04e2f00e3"]={f:Ops.Gl.Matrix.Scale,objName:"Ops.Gl.Matrix.Scale"};




// **************************************************************
// 
// Ops.Gl.Phong.PointLight_v5
// 
// **************************************************************

Ops.Gl.Phong.PointLight_v5 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const cgl = op.patch.cgl;
const gl = cgl.gl;
const mesh = CGL.MESHES.getSimpleRect(cgl, "fullscreenRectangle");

function Light(config)
{
    this.type = config.type || "point";
    this.color = config.color || [1, 1, 1];
    this.specular = config.specular || [0, 0, 0];
    this.position = config.position || null;
    this.intensity = config.intensity || 1;
    this.radius = config.radius || 1;
    this.falloff = config.falloff || 1;
    this.spotExponent = config.spotExponent || 1;
    this.cosConeAngle = Math.cos(CGL.DEG2RAD * this.coneAngle);
    this.conePointAt = config.conePointAt || [0, 0, 0];
    this.castShadow = config.castShadow || false;
    return this;
}

// * OP START *
const inTrigger = op.inTrigger("Trigger In");
const inCastLight = op.inBool("Cast Light", true);
const inIntensity = op.inFloat("Intensity", 2);
const inRadius = op.inFloat("Radius", 15);

const inPosX = op.inFloat("X", 0);
const inPosY = op.inFloat("Y", 2);
const inPosZ = op.inFloat("Z", 0.75);

const positionIn = [inPosX, inPosY, inPosZ];
op.setPortGroup("Position", positionIn);

const inR = op.inFloat("R", 0.8);
const inG = op.inFloat("G", 0.8);
const inB = op.inFloat("B", 0.8);

inR.setUiAttribs({ "colorPick": true });
const colorIn = [inR, inG, inB];
op.setPortGroup("Color", colorIn);

const inSpecularR = op.inFloat("Specular R", 1);
const inSpecularG = op.inFloat("Specular G", 1);
const inSpecularB = op.inFloat("Specular B", 1);

inSpecularR.setUiAttribs({ "colorPick": true });
const colorSpecularIn = [inSpecularR, inSpecularG, inSpecularB];
op.setPortGroup("Specular Color", colorSpecularIn);

const inFalloff = op.inFloatSlider("Falloff", 0.5);

const attribIns = [inIntensity, inCastLight, inRadius];
op.setPortGroup("Light Attributes", attribIns);

const inCastShadow = op.inBool("Cast Shadow", false);
const inRenderMapActive = op.inBool("Rendering Active", true);
const inMapSize = op.inSwitch("Map Size", [256, 512, 1024, 2048], 512);
const inShadowStrength = op.inFloatSlider("Shadow Strength", 1);
const inNear = op.inFloat("Near", 0.1);
const inFar = op.inFloat("Far", 30);
const inBias = op.inFloatSlider("Bias", 0.004);
const inPolygonOffset = op.inInt("Polygon Offset", 0);
op.setPortGroup("", [inCastShadow]);
op.setPortGroup("Shadow Map Settings", [inMapSize, inRenderMapActive, inShadowStrength, inNear, inFar, inBias, inPolygonOffset]);
const shadowProperties = [inNear, inFar];
inMapSize.setUiAttribs({ "greyout": !inCastShadow.get() });
inRenderMapActive.setUiAttribs({ "greyout": !inCastShadow.get() });
inShadowStrength.setUiAttribs({ "greyout": !inCastShadow.get() });
inNear.setUiAttribs({ "greyout": !inCastShadow.get() });
inBias.setUiAttribs({ "greyout": !inCastShadow.get() });
inFar.setUiAttribs({ "greyout": !inCastShadow.get() });
inPolygonOffset.setUiAttribs({ "greyout": !inCastShadow.get() });

let updating = false;

inCastShadow.onChange = function ()
{
    updating = true;
    updateLight = true;

    inMapSize.setUiAttribs({ "greyout": !inCastShadow.get() });
    inRenderMapActive.setUiAttribs({ "greyout": !inCastShadow.get() });
    inShadowStrength.setUiAttribs({ "greyout": !inCastShadow.get() });
    inNear.setUiAttribs({ "greyout": !inCastShadow.get() });
    inFar.setUiAttribs({ "greyout": !inCastShadow.get() });
    inBias.setUiAttribs({ "greyout": !inCastShadow.get() });
    inPolygonOffset.setUiAttribs({ "greyout": !inCastShadow.get() });
};

const outTrigger = op.outTrigger("Trigger Out");
const outCubemap = op.outObject("Cubemap", null, "texture");
const outWorldPosX = op.outNumber("World Position X");
const outWorldPosY = op.outNumber("World Position Y");
const outWorldPosZ = op.outNumber("World Position Z");

const newLight = new CGL.Light(cgl, {
    "type": "point",
    "position": [0, 1, 2].map(function (i) { return positionIn[i].get(); }),
    "color": [0, 1, 2].map(function (i) { return colorIn[i].get(); }),
    "specular": [0, 1, 2].map(function (i) { return colorSpecularIn[i].get(); }),
    "intensity": inIntensity.get(),
    "radius": inRadius.get(),
    "falloff": inFalloff.get(),
    "shadowStrength": inShadowStrength.get(),
    "shadowBias": inBias.get()
});
newLight.castLight = inCastLight.get();

let updateLight = false;

inPosX.onChange = inPosY.onChange = inPosZ.onChange = inR.onChange = inG.onChange = inB.onChange
= inSpecularR.onChange = inSpecularG.onChange = inSpecularB.onChange = inIntensity.onChange
= inCastLight.onChange = inRadius.onChange = inFalloff.onChange = inNear.onChange = inFar.onChange = inShadowStrength.onChange = function ()
        {
            updateLight = true;
        };

inMapSize.onChange = function ()
{
    // TODO: update this one
    updating = true;
};

function updateShadowMapFramebuffer()
{
    if (inCastShadow.get())
    {
        const size = inMapSize.get();
        newLight.createFramebuffer(size, size, {});
        newLight.createShadowMapShader();
    }
    updating = false;
}

const sc = vec3.create();
const result = vec3.create();
const position = vec3.create();
const transVec = vec3.create();

function drawHelpers()
{
    if (cgl.frameStore.shadowPass) return;
    if (cgl.shouldDrawHelpers(op))
    {
        gui.setTransformGizmo({
            "posX": inPosX,
            "posY": inPosY,
            "posZ": inPosZ,
        });

        cgl.pushModelMatrix();
        mat4.translate(cgl.mMatrix, cgl.mMatrix, transVec);
        CABLES.GL_MARKER.drawSphere(op, inRadius.get());
        cgl.popModelMatrix();
    }
}

let errorActive = false;

inTrigger.onTriggered = function ()
{
    if (updating)
    {
        if (cgl.frameStore.shadowPass) return;
        updateShadowMapFramebuffer();
    }

    if (!cgl.frameStore.shadowPass)
    {
        if (!newLight.isUsed && !errorActive)
        {
            op.setUiError("lightUsed", "No operator is using this light. Make sure this op is positioned before an operator that uses lights. Also make sure there is an operator that uses lights after this.", 1); // newLight.isUsed = false;
            errorActive = true;
        }
        else if (!newLight.isUsed && errorActive) {}
        else if (newLight.isUsed && errorActive)
        {
            op.setUiError("lightUsed", null);
            errorActive = false;
        }
        else if (newLight.isUsed && !errorActive) {}

        newLight.isUsed = false;
    }

    if (updateLight)
    {
        newLight.position = [0, 1, 2].map(function (i) { return positionIn[i].get(); });
        newLight.color = [0, 1, 2].map(function (i) { return colorIn[i].get(); });
        newLight.specular = [0, 1, 2].map(function (i) { return colorSpecularIn[i].get(); });
        newLight.intensity = inIntensity.get();
        newLight.radius = inRadius.get();
        newLight.falloff = inFalloff.get();
        newLight.castShadow = inCastShadow.get();
        newLight.castLight = inCastLight.get();
        newLight.updateProjectionMatrix(null, inNear.get(), inFar.get(), null);
        updateLight = false;
    }

    if (!cgl.frameStore.lightStack) cgl.frameStore.lightStack = [];

    vec3.set(transVec, inPosX.get(), inPosY.get(), inPosZ.get());
    vec3.transformMat4(position, transVec, cgl.mMatrix);

    newLight.position = position;

    outWorldPosX.set(newLight.position[0]);
    outWorldPosY.set(newLight.position[1]);
    outWorldPosZ.set(newLight.position[2]);

    if (!cgl.frameStore.shadowPass) drawHelpers();

    cgl.frameStore.lightStack.push(newLight);

    if (inCastShadow.get())
    {
        if (inRenderMapActive.get()) newLight.renderPasses(inPolygonOffset.get(), null, function () { outTrigger.trigger(); });

        if (!cgl.frameStore.shadowPass)
        {
            cgl.frameStore.lightStack.pop();
            newLight.castShadow = inCastShadow.get();
            newLight.shadowBias = inBias.get();
            newLight.shadowStrength = inShadowStrength.get();

            if (newLight.shadowCubeMap)
            {
                if (newLight.shadowCubeMap.cubemap)
                {
                    outCubemap.set(null);
                    outCubemap.set(newLight.shadowCubeMap);
                    if (inRenderMapActive.get())
                    {
                        // needs to be "cloned", cannot save reference.
                        newLight.positionForShadowMap = [newLight.position[0], newLight.position[1], newLight.position[2]];
                    }
                }
            }
            cgl.frameStore.lightStack.push(newLight);
        }
    }
    else
    {
        outCubemap.set(null);
    }

    outTrigger.trigger();
    cgl.frameStore.lightStack.pop();
};


};

Ops.Gl.Phong.PointLight_v5.prototype = new CABLES.Op();
CABLES.OPS["54e5d3f5-e3f4-4381-990d-d5e32b9a2d39"]={f:Ops.Gl.Phong.PointLight_v5,objName:"Ops.Gl.Phong.PointLight_v5"};




// **************************************************************
// 
// Ops.Math.Modulo
// 
// **************************************************************

Ops.Math.Modulo = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 2),
    pingpong = op.inValueBool("pingpong"),
    result = op.outNumber("result");

let calculateFunction = calculateModule;

number1.onChange =
number2.onChange = exec;

pingpong.onChange = updatePingPong;

exec();

function exec()
{
    let n2 = number2.get();
    let n1 = number1.get();

    result.set(calculateFunction(n1, n2));
}

function calculateModule(n1, n2)
{
    let re = ((n1 % n2) + n2) % n2;
    if (re != re) re = 0;
    return re;
}

function calculatePingPong(i, n)
{
    let cycle = 2 * n;
    i %= cycle;
    if (i >= n) return cycle - i;
    else return i;
}

function updatePingPong()
{
    if (pingpong.get()) calculateFunction = calculatePingPong;
    else calculateFunction = calculateModule;
}


};

Ops.Math.Modulo.prototype = new CABLES.Op();
CABLES.OPS["ebc13b25-3705-4265-8f06-5f985b6a7bb1"]={f:Ops.Math.Modulo,objName:"Ops.Math.Modulo"};




// **************************************************************
// 
// Ops.Gl.Matrix.Transform
// 
// **************************************************************

Ops.Gl.Matrix.Transform = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render = op.inTrigger("render"),
    posX = op.inValue("posX", 0),
    posY = op.inValue("posY", 0),
    posZ = op.inValue("posZ", 0),
    scale = op.inValue("scale", 1),
    rotX = op.inValue("rotX", 0),
    rotY = op.inValue("rotY", 0),
    rotZ = op.inValue("rotZ", 0),
    trigger = op.outTrigger("trigger");

op.setPortGroup("Rotation", [rotX, rotY, rotZ]);
op.setPortGroup("Position", [posX, posY, posZ]);
op.setPortGroup("Scale", [scale]);
op.setUiAxisPorts(posX, posY, posZ);

const vPos = vec3.create();
const vScale = vec3.create();
const transMatrix = mat4.create();
mat4.identity(transMatrix);

let
    doScale = false,
    doTranslate = false,
    translationChanged = true,
    scaleChanged = true,
    rotChanged = true;

rotX.onChange = rotY.onChange = rotZ.onChange = setRotChanged;
posX.onChange = posY.onChange = posZ.onChange = setTranslateChanged;
scale.onChange = setScaleChanged;

render.onTriggered = function ()
{
    // if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    let updateMatrix = false;
    if (translationChanged)
    {
        updateTranslation();
        updateMatrix = true;
    }
    if (scaleChanged)
    {
        updateScale();
        updateMatrix = true;
    }
    if (rotChanged) updateMatrix = true;

    if (updateMatrix) doUpdateMatrix();

    const cg = op.patch.cgl;
    cg.pushModelMatrix();
    mat4.multiply(cg.mMatrix, cg.mMatrix, transMatrix);

    trigger.trigger();
    cg.popModelMatrix();

    if (CABLES.UI && CABLES.UI.showCanvasTransforms) gui.setTransform(op.id, posX.get(), posY.get(), posZ.get());

    if (op.isCurrentUiOp())
        gui.setTransformGizmo(
            {
                "posX": posX,
                "posY": posY,
                "posZ": posZ,
            });
};

op.transform3d = function ()
{
    return { "pos": [posX, posY, posZ] };
};

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if (doTranslate)mat4.translate(transMatrix, transMatrix, vPos);

    if (rotX.get() !== 0)mat4.rotateX(transMatrix, transMatrix, rotX.get() * CGL.DEG2RAD);
    if (rotY.get() !== 0)mat4.rotateY(transMatrix, transMatrix, rotY.get() * CGL.DEG2RAD);
    if (rotZ.get() !== 0)mat4.rotateZ(transMatrix, transMatrix, rotZ.get() * CGL.DEG2RAD);

    if (doScale)mat4.scale(transMatrix, transMatrix, vScale);
    rotChanged = false;
}

function updateTranslation()
{
    doTranslate = false;
    if (posX.get() !== 0.0 || posY.get() !== 0.0 || posZ.get() !== 0.0) doTranslate = true;
    vec3.set(vPos, posX.get(), posY.get(), posZ.get());
    translationChanged = false;
}

function updateScale()
{
    // doScale=false;
    // if(scale.get()!==0.0)
    doScale = true;
    vec3.set(vScale, scale.get(), scale.get(), scale.get());
    scaleChanged = false;
}

function setTranslateChanged()
{
    translationChanged = true;
}

function setScaleChanged()
{
    scaleChanged = true;
}

function setRotChanged()
{
    rotChanged = true;
}

doUpdateMatrix();


};

Ops.Gl.Matrix.Transform.prototype = new CABLES.Op();
CABLES.OPS["650baeb1-db2d-4781-9af6-ab4e9d4277be"]={f:Ops.Gl.Matrix.Transform,objName:"Ops.Gl.Matrix.Transform"};




// **************************************************************
// 
// Ops.Gl.Shader.PointMaterial
// 
// **************************************************************

Ops.Gl.Shader.PointMaterial = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"shader_frag":"\n{{MODULES_HEAD}}\n\nIN vec2 texCoord;\n#ifdef HAS_TEXTURES\n\n   #ifdef HAS_TEXTURE_DIFFUSE\n       UNI sampler2D diffTex;\n   #endif\n   #ifdef HAS_TEXTURE_MASK\n       UNI sampler2D texMask;\n   #endif\n#endif\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\n\n#ifdef VERTEX_COLORS\n    IN vec3 vertexColor;\n#endif\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n\n    vec4 col=vec4(r,g,b,a);\n\n    #ifdef HAS_TEXTURES\n\n        #ifdef HAS_TEXTURE_MASK\n            float mask;\n            // #ifdef LOOKUP_TEXTURE\n                mask=texture(texMask,texCoord).r;\n            // #endif\n            // #ifndef LOOKUP_TEXTURE\n                // mask=texture(texMask,vec2(gl_PointCoord.x,(1.0-gl_PointCoord.y))).r;\n            // #endif\n\n        #endif\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n\n            #ifdef LOOKUP_TEXTURE\n                col=texture(diffTex,texCoord);\n            #endif\n            #ifndef LOOKUP_TEXTURE\n                col=texture(diffTex,vec2(gl_PointCoord.x,(1.0-gl_PointCoord.y)));\n            #endif\n\n            #ifdef COLORIZE_TEXTURE\n              col.r*=r;\n              col.g*=g;\n              col.b*=b;\n            #endif\n        #endif\n        col.a*=a;\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef MAKE_ROUND\n        if ((gl_PointCoord.x-0.5)*(gl_PointCoord.x-0.5) + (gl_PointCoord.y-0.5)*(gl_PointCoord.y-0.5) > 0.25) discard; //col.a=0.0;\n    #endif\n\n    #ifdef VERTEX_COLORS\n        col.rgb*=vertexColor;\n    #endif\n\n\n    #ifdef HAS_TEXTURE_MASK\n        col.a=mask;\n    #endif\n\n\n    // #ifdef RANDOMIZE_COLOR\n        // col.rgb*=fract(sin(dot(texCoord.xy ,vec2(12.9898,78.233))) * 43758.5453);\n    // #endif\n\n\n\n    outColor = col;\n}\n","shader_vert":"{{MODULES_HEAD}}\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\n   IN vec3 attrTangent;\n   IN vec3 attrBiTangent;\n\n#ifdef VERTEX_COLORS\n    IN vec3 attrVertColor;\n    OUT vec3 vertexColor;\n#endif\n\nOUT vec3 norm;\n#ifdef HAS_TEXTURES\n    OUT vec2 texCoord;\n#endif\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\nUNI float pointSize;\nUNI vec3 camPos;\n\nUNI float canvasWidth;\nUNI float canvasHeight;\nUNI float camDistMul;\n\nUNI float randomSize;\n\nIN float attrVertIndex;\n\n\nfloat rand(float n){return fract(sin(n) * 43758.5453123);}\n\n#define POINTMATERIAL\n\nvoid main()\n{\n    float psMul=sqrt(canvasWidth/canvasHeight)+0.00000000001;\n    float sizeMultiply=1.0;\n\n    vec3 tangent=attrTangent;\n    vec3 bitangent=attrBiTangent;\n\n\n    #ifdef VERTEX_COLORS\n        vertexColor=attrVertColor;\n    #endif\n\n    #ifdef HAS_TEXTURES\n        texCoord=attrTexCoord;\n    #endif\n\n    mat4 mMatrix=modelMatrix;\n\n    vec4 pos = vec4( vPosition, 1. );\n\n    {{MODULE_VERTEX_POSITION}}\n\n    vec4 model=mMatrix * pos;\n\n    psMul+=rand(attrVertIndex)*randomSize;\n\n    psMul*=sizeMultiply;\n\n    #ifndef SCALE_BY_DISTANCE\n        gl_PointSize = pointSize * psMul;\n    #endif\n    #ifdef SCALE_BY_DISTANCE\n        float cameraDist = distance(model.xyz, camPos);\n        gl_PointSize = (pointSize / cameraDist) * psMul;\n    #endif\n\n    gl_Position = projMatrix * viewMatrix * model;\n}\n",};
const cgl=op.patch.cgl;

const
    render=op.inTrigger("render"),
    pointSize=op.inValueFloat("PointSize",3),
    randomSize=op.inValue("Random Size",3),
    makeRound=op.inValueBool("Round",true),
    doScale=op.inValueBool("Scale by Distance",false),
    r = op.inValueSlider("r", Math.random()),
    g = op.inValueSlider("g", Math.random()),
    b = op.inValueSlider("b", Math.random()),
    a = op.inValueSlider("a",1),
    preMultipliedAlpha=op.inValueBool("preMultiplied alpha"),
    vertCols=op.inBool("Vertex Colors",false),
    texture=op.inTexture("texture"),
    textureMask=op.inTexture("Texture Mask"),
    colorizeTexture=op.inValueBool("colorizeTexture",false),
    textureLookup=op.inValueBool("texture Lookup",false),
    trigger=op.outTrigger('trigger'),
    shaderOut=op.outObject("shader");

op.setPortGroup("Texture",[textureLookup,textureMask,texture,colorizeTexture]);
op.setPortGroup("Color",[r,g,b,a,preMultipliedAlpha,vertCols]);
op.setPortGroup("Size",[pointSize,randomSize,makeRound,doScale]);
r.setUiAttribs({ colorPick: true });

const shader=new CGL.Shader(cgl,'PointMaterial');
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.define('MAKE_ROUND');

const
    uniPointSize=new CGL.Uniform(shader,'f','pointSize',pointSize),
    uniRandomSize=new CGL.Uniform(shader,'f','randomSize',randomSize),
    runiform=new CGL.Uniform(shader,'f','r',r),
    guniform=new CGL.Uniform(shader,'f','g',g),
    buniform=new CGL.Uniform(shader,'f','b',b),
    auniform=new CGL.Uniform(shader,'f','a',a),
    uniWidth=new CGL.Uniform(shader,'f','canvasWidth',cgl.canvasWidth),
    uniHeight=new CGL.Uniform(shader,'f','canvasHeight',cgl.canvasHeight);

shaderOut.set(shader);
shader.setSource(attachments.shader_vert,attachments.shader_frag);
shader.glPrimitive=cgl.gl.POINTS;
shader.bindTextures=bindTextures;
shaderOut.ignoreValueSerialize=true;

render.onTriggered=doRender;

var textureUniform=null;
var textureMaskUniform=null;

op.preRender=function()
{
    if(shader)shader.bind();
    doRender();
};

function bindTextures()
{
    if(texture.get()) cgl.setTexture(0,texture.get().tex);
    if(textureMask.get()) cgl.setTexture(1,textureMask.get().tex);
}

function doRender()
{
    uniWidth.setValue(cgl.canvasWidth);
    uniHeight.setValue(cgl.canvasHeight);

    cgl.pushShader(shader);
    bindTextures();
    if(preMultipliedAlpha.get())cgl.gl.blendFunc(cgl.gl.ONE, cgl.gl.ONE_MINUS_SRC_ALPHA);

    trigger.trigger();
    if(preMultipliedAlpha.get())cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.popShader();
}

doScale.onChange=function()
{
    shader.toggleDefine('SCALE_BY_DISTANCE',doScale.get());
};

makeRound.onChange=function()
{
    shader.toggleDefine('MAKE_ROUND',makeRound.get());
};

colorizeTexture.onChange=function()
{
    shader.toggleDefine('COLORIZE_TEXTURE',colorizeTexture.get());
};

textureLookup.onChange=function()
{
    shader.toggleDefine('LOOKUP_TEXTURE',textureLookup.get());
};

vertCols.onChange=function()
{
    shader.toggleDefine('VERTEX_COLORS',vertCols.get());
};

texture.onChange=function()
{
    if(texture.get())
    {
        if(textureUniform!==null)return;
        shader.removeUniform('diffTex');
        shader.define('HAS_TEXTURE_DIFFUSE');
        textureUniform=new CGL.Uniform(shader,'t','diffTex',0);
    }
    else
    {
        shader.removeUniform('diffTex');
        shader.removeDefine('HAS_TEXTURE_DIFFUSE');
        textureUniform=null;
    }
};

textureMask.onChange=function()
{
    if(textureMask.get())
    {
        if(textureMaskUniform!==null)return;
        shader.removeUniform('texMask');
        shader.define('HAS_TEXTURE_MASK');
        textureMaskUniform=new CGL.Uniform(shader,'t','texMask',1);
    }
    else
    {
        shader.removeUniform('texMask');
        shader.removeDefine('HAS_TEXTURE_MASK');
        textureMaskUniform=null;
    }
};



};

Ops.Gl.Shader.PointMaterial.prototype = new CABLES.Op();
CABLES.OPS["f86a4a07-00ee-4f68-8839-e02d51d1cd2f"]={f:Ops.Gl.Shader.PointMaterial,objName:"Ops.Gl.Shader.PointMaterial"};




// **************************************************************
// 
// Ops.Gl.Meshes.PointCloudFromArray
// 
// **************************************************************

Ops.Gl.Meshes.PointCloudFromArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("exe"),
    arr = op.inArray("Array", 3),
    numPoints = op.inValueInt("Num Points"),
    outTrigger = op.outTrigger("Trigger out"),
    outGeom = op.outObject("Geometry"),
    pTexCoordRand = op.inValueBool("Scramble Texcoords", true),
    seed = op.inValue("Seed", 1),
    inCoords = op.inArray("Coordinates", 2),
    vertCols = op.inArray("Vertex Colors", 4);

op.toWorkPortsNeedToBeLinked(arr, exe);
op.setPortGroup("Texture Coordinates", [pTexCoordRand, seed, inCoords]);

const cgl = op.patch.cgl;
const geom = new CGL.Geometry("pointcloudfromarray");
let deactivated = false;
let mesh = null;
let texCoords = [];
let needsRebuild = true;
let showingError = false;

arr.setUiAttribs({ "title": "Positions" });
inCoords.setUiAttribs({ "title": "Texture Coordinates" });

inCoords.onChange =
    pTexCoordRand.onChange = updateTexCoordsPorts;
vertCols.onChange = updateVertCols;
numPoints.onChange = updateNumVerts;
seed.onChange = arr.onChange = vertCols.onLinkChanged = reset;

exe.onTriggered = doRender;

function doRender()
{
    outTrigger.trigger();
    if (CABLES.UI)
    {
        let shader = cgl.getShader();
        if (shader.glPrimitive != cgl.gl.POINTS) op.setUiError("nopointmat", "Using a Material not made for point rendering. Try to use PointMaterial.");
        else op.setUiError("nopointmat", null);
    }

    if (needsRebuild || !mesh) rebuild();
    if (!deactivated && mesh) mesh.render(cgl.getShader());
}

function reset()
{
    deactivated = arr.get() == null;

    if (!deactivated)needsRebuild = true;
    else needsRebuild = false;
}

function updateTexCoordsPorts()
{
    if (inCoords.isLinked())
    {
        seed.setUiAttribs({ "greyout": true });
        pTexCoordRand.setUiAttribs({ "greyout": true });
    }
    else
    {
        pTexCoordRand.setUiAttribs({ "greyout": false });

        if (!pTexCoordRand.get()) seed.setUiAttribs({ "greyout": true });
        else seed.setUiAttribs({ "greyout": false });
    }

    mesh = null;
    needsRebuild = true;
}

function updateVertCols()
{
    if (!vertCols.get()) return;
    if (!geom.vertexColors) reset();

    if (mesh)mesh.setAttribute(CGL.SHADERVAR_VERTEX_COLOR, vertCols.get(), 4);
}

function updateNumVerts()
{
    if (mesh)
    {
        mesh.setNumVertices(Math.min(geom.vertices.length / 3, numPoints.get()));
        if (numPoints.get() == 0)mesh.setNumVertices(geom.vertices.length / 3);
    }
}

function rebuild()
{
    let verts = arr.get();

    if (!verts || verts.length == 0)
    {
        // mesh=null;
        return;
    }

    if (verts.length % 3 !== 0)
    {
        // if (!showingError)
        // {
        op.setUiError("div3", "Array length not multiple of 3");

        // op.uiAttr({ "error": "Array length not divisible by 3!" });
        // showingError = true;
        // }
        return;
    }
    else op.setUiError("div3", null);

    if (geom.vertices.length == verts.length && mesh && !inCoords.isLinked() && !vertCols.isLinked())
    {
        mesh.setAttribute(CGL.SHADERVAR_VERTEX_POSITION, verts, 3);
        geom.vertices = verts;
        needsRebuild = false;

        return;
    }

    geom.clear();
    let num = verts.length / 3;
    num = Math.abs(Math.floor(num));

    if (num == 0) return;

    if (!texCoords || texCoords.length != num * 2) texCoords = new Float32Array(num * 2); // num*2;//=

    let changed = true;
    let rndTc = pTexCoordRand.get();

    if (!inCoords.isLinked())
    {
        Math.randomSeed = seed.get();
        texCoords = []; // needed otherwise its using the reference to input incoords port
        // let genCoords = !inCoords.isLinked();

        for (let i = 0; i < num; i++)
        {
            if (geom.vertices[i * 3] != verts[i * 3] ||
                geom.vertices[i * 3 + 1] != verts[i * 3 + 1] ||
                geom.vertices[i * 3 + 2] != verts[i * 3 + 2])
            {
                // if (genCoords)
                if (rndTc)
                {
                    texCoords[i * 2] = Math.seededRandom();
                    texCoords[i * 2 + 1] = Math.seededRandom();
                }
                else
                {
                    texCoords[i * 2] = i / num;
                    texCoords[i * 2 + 1] = i / num;
                }
            }
        }
    }

    if (vertCols.get())
    {
        if (!showingError && vertCols.get().length != num * 4)
        {
            op.uiAttr({ "error": "Color array does not have the correct length! (should be " + num * 4 + ")" });
            showingError = true;
            mesh = null;
            return;
        }

        geom.vertexColors = vertCols.get();
    }
    else geom.vertexColors = [];

    if (changed)
    {
        if (inCoords.isLinked()) texCoords = inCoords.get();

        geom.setPointVertices(verts);
        geom.setTexCoords(texCoords);
        // geom.verticesIndices = [];

        if (mesh)mesh.dispose();
        mesh = new CGL.Mesh(cgl, geom, cgl.gl.POINTS);

        mesh.addVertexNumbers = true;
        mesh.setGeom(geom);

        outGeom.set(null);
        outGeom.set(geom);
    }

    updateNumVerts();
    needsRebuild = false;
}


};

Ops.Gl.Meshes.PointCloudFromArray.prototype = new CABLES.Op();
CABLES.OPS["0a6d9c6f-6459-45ca-88ad-268a1f7304db"]={f:Ops.Gl.Meshes.PointCloudFromArray,objName:"Ops.Gl.Meshes.PointCloudFromArray"};




// **************************************************************
// 
// Ops.Array.RandomNumbersArray3
// 
// **************************************************************

Ops.Array.RandomNumbersArray3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    numValues=op.inValueInt("numValues",100),
    min=op.inValueFloat("Min",-1),
    max=op.inValueFloat("Max",1),
    seed=op.inValueFloat("random seed"),
    closed=op.inValueBool("Last == First"),
    inInteger=op.inValueBool("Integer",false),
    values=op.outArray("values"),
    outTotalPoints = op.outNumber("Total points"),
    outArrayLength = op.outNumber("Array length");

op.setPortGroup("Value Range",[min,max]);
op.setPortGroup("",[seed,closed]);

values.ignoreValueSerialize=true;

closed.onChange=max.onChange=
    min.onChange=
    numValues.onChange=
    seed.onChange=
    values.onLinkChanged=
    inInteger.onChange=init;

var arr=[];
init();

function init()
{
    Math.randomSeed=seed.get();

    var isInteger=inInteger.get();

    var arrLength = arr.length=Math.floor(Math.abs(numValues.get()*3));
    for(var i=0;i<arrLength;i+=3)
    {
        if(!isInteger)
        {
            arr[i+0]=Math.seededRandom() * ( max.get() - min.get() ) + min.get() ;
            arr[i+1]=Math.seededRandom() * ( max.get() - min.get() ) + min.get() ;
            arr[i+2]=Math.seededRandom() * ( max.get() - min.get() ) + min.get() ;
        }
        else
        {
            arr[i+0]=Math.floor(Math.seededRandom() * ( max.get() - min.get() ) + min.get()) ;
            arr[i+1]=Math.floor(Math.seededRandom() * ( max.get() - min.get() ) + min.get()) ;
            arr[i+2]=Math.floor(Math.seededRandom() * ( max.get() - min.get() ) + min.get()) ;
        }
    }

    if(closed.get() && arrLength>3)
    {
        arr[arrLength-3+0]=arr[0];
        arr[arrLength-3+1]=arr[1];
        arr[arrLength-3+2]=arr[2];
    }

    values.set(null);
    values.set(arr);
    outTotalPoints.set(arrLength/3);
    outArrayLength.set(arrLength);
};


};

Ops.Array.RandomNumbersArray3.prototype = new CABLES.Op();
CABLES.OPS["7f981578-542e-417b-b304-8fbe41258772"]={f:Ops.Array.RandomNumbersArray3,objName:"Ops.Array.RandomNumbersArray3"};




// **************************************************************
// 
// Ops.Array.ArrayPack3
// 
// **************************************************************

Ops.Array.ArrayPack3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exe = op.inTrigger("Trigger in"),
    inArr1 = op.inArray("Array 1"),
    inArr2 = op.inArray("Array 2"),
    inArr3 = op.inArray("Array 3"),
    exeOut = op.outTrigger("Trigger out"),
    outArr = op.outArray("Array out", 3),
    outNum = op.outNumber("Num Points"),
    outArrayLength = op.outNumber("Array length");

let showingError = false;

let arr = [];
let emptyArray = [];
let needsCalc = true;

exe.onTriggered = update;

inArr1.onChange = inArr2.onChange = inArr3.onChange = calcLater;

function calcLater()
{
    needsCalc = true;
}

function update()
{
    let array1 = inArr1.get();
    let array2 = inArr2.get();
    let array3 = inArr3.get();

    if (!array1 && !array2 && !array3)
    {
        outArr.set(null);
        outNum.set(0);
        return;
    }
    // only update if array has changed
    if (needsCalc)
    {
        let arrlen = 0;

        if (!array1 || !array2 || !array3)
        {
            if (array1) arrlen = array1.length;
            else if (array2) arrlen = array2.length;
            else if (array3) arrlen = array3.length;

            if (emptyArray.length != arrlen)
                for (var i = 0; i < arrlen; i++) emptyArray[i] = 0;

            if (!array1)array1 = emptyArray;
            if (!array2)array2 = emptyArray;
            if (!array3)array3 = emptyArray;
        }

        if ((array1.length !== array2.length) || (array2.length !== array3.length))
        {
            op.setUiError("arraylen", "Arrays do not have the same length !");
            return;
        }
        op.setUiError("arraylen", null);

        arr.length = array1.length;
        for (var i = 0; i < array1.length; i++)
        {
            arr[i * 3 + 0] = array1[i];
            arr[i * 3 + 1] = array2[i];
            arr[i * 3 + 2] = array3[i];
        }

        needsCalc = false;
        outArr.set(null);
        outArr.set(arr);
        outNum.set(arr.length / 3);
        outArrayLength.set(arr.length);
    }

    exeOut.trigger();
}


};

Ops.Array.ArrayPack3.prototype = new CABLES.Op();
CABLES.OPS["2bcf32fe-3cbd-48fd-825a-61255bebda9b"]={f:Ops.Array.ArrayPack3,objName:"Ops.Array.ArrayPack3"};




// **************************************************************
// 
// Ops.Array.ArrayMultiply
// 
// **************************************************************

Ops.Array.ArrayMultiply = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inArray = op.inArray("In"),
    inValue = op.inValue("Value", 1.0),
    outArray = op.outArray("Result");

let newArr = [];
outArray.set(newArr);
inArray.onChange =
inValue.onChange = inArray.onChange = function ()
{
    let arr = inArray.get();
    if (!arr) return;

    let mul = inValue.get();

    if (newArr.length != arr.length)newArr.length = arr.length;

    for (let i = 0; i < arr.length; i++)
    {
        newArr[i] = arr[i] * mul;
    }

    outArray.set(null);
    outArray.set(newArr);
};

inArray.onLinkChanged = () =>
{
    if (inArray) inArray.copyLinkedUiAttrib("stride", outArray);
};


};

Ops.Array.ArrayMultiply.prototype = new CABLES.Op();
CABLES.OPS["a01c344b-4129-4b01-9c8f-36cefe86d7cc"]={f:Ops.Array.ArrayMultiply,objName:"Ops.Array.ArrayMultiply"};




// **************************************************************
// 
// Ops.Array.ArraySum
// 
// **************************************************************

Ops.Array.ArraySum = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inArray = op.inArray("In"),
    inValue = op.inValue("Value", 1.0),
    outArray = op.outArray("Result");

let newArr = [];
outArray.set(newArr);

inValue.onChange =
inArray.onChange = function ()
{
    let arr = inArray.get();
    if (!arr) return;

    let add = inValue.get();

    if (newArr.length != arr.length)newArr.length = arr.length;

    for (let i = 0; i < arr.length; i++)
    {
        newArr[i] = arr[i] + add;
    }

    outArray.set(null);
    outArray.set(newArr);
};


};

Ops.Array.ArraySum.prototype = new CABLES.Op();
CABLES.OPS["c6b5bf63-0be8-4eea-acc0-9d32973e665a"]={f:Ops.Array.ArraySum,objName:"Ops.Array.ArraySum"};




// **************************************************************
// 
// Ops.Array.ArrayModulo
// 
// **************************************************************

Ops.Array.ArrayModulo = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inArray = op.inArray("Array In"),
    inValue = op.inValue("Value", 2.0),
    outArray = op.outArray("Array Out");

let newArr = [];
outArray.set(newArr);
inArray.onChange =
inValue.onChange = inArray.onChange = function ()
{
    let arr = inArray.get();
    if (!arr) return;

    let modulo = inValue.get();

    if (newArr.length != arr.length) newArr.length = arr.length;

    let i = 0;
    for (i = 0; i < arr.length; i++)
    {
        newArr[i] = arr[i] % modulo;
    }
    outArray.set(null);
    outArray.set(newArr);
};


};

Ops.Array.ArrayModulo.prototype = new CABLES.Op();
CABLES.OPS["30a5568b-31da-4504-9525-578ee404993c"]={f:Ops.Array.ArrayModulo,objName:"Ops.Array.ArrayModulo"};




// **************************************************************
// 
// Ops.Array.ArraySubtract
// 
// **************************************************************

Ops.Array.ArraySubtract = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
let inArray = op.inArray("Array In");
let inValue = op.inValue("Value", 1.0);
let outArray = op.outArray("Array Out");

let newArr = [];
outArray.set(newArr);
inArray.onChange =
inValue.onChange = inArray.onChange = function ()
{
    let arr = inArray.get();
    if (!arr) return;

    let subtract = inValue.get();

    if (newArr.length != arr.length)newArr.length = arr.length;

    let i = 0;
    for (i = 0; i < arr.length; i++)
    {
        newArr[i] = arr[i] - subtract;
    }
    outArray.set(null);
    outArray.set(newArr);
};


};

Ops.Array.ArraySubtract.prototype = new CABLES.Op();
CABLES.OPS["af78ab59-75d5-4ead-9a8d-27a63e1cbf3f"]={f:Ops.Array.ArraySubtract,objName:"Ops.Array.ArraySubtract"};




// **************************************************************
// 
// Ops.Value.Number
// 
// **************************************************************

Ops.Value.Number = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    v = op.inValueFloat("value"),
    result = op.outNumber("result");

v.onChange = exec;

function exec()
{
    result.set(Number(v.get()));
}


};

Ops.Value.Number.prototype = new CABLES.Op();
CABLES.OPS["8fb2bb5d-665a-4d0a-8079-12710ae453be"]={f:Ops.Value.Number,objName:"Ops.Value.Number"};




// **************************************************************
// 
// Ops.Math.Divide
// 
// **************************************************************

Ops.Math.Divide = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 2),
    result = op.outNumber("result");

op.setTitle("/");

number1.onChange = number2.onChange = exec;
exec();

function exec()
{
    result.set(number1.get() / number2.get());
}


};

Ops.Math.Divide.prototype = new CABLES.Op();
CABLES.OPS["86fcfd8c-038d-4b91-9820-a08114f6b7eb"]={f:Ops.Math.Divide,objName:"Ops.Math.Divide"};




// **************************************************************
// 
// Ops.Array.ArrayLength
// 
// **************************************************************

Ops.Array.ArrayLength = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    array = op.inArray("array"),
    outLength = op.outNumber("length");

outLength.ignoreValueSerialize = true;

function update()
{
    let l = 0;
    if (array.get()) l = array.get().length;
    else l = -1;
    outLength.set(l);
}

array.onChange = update;


};

Ops.Array.ArrayLength.prototype = new CABLES.Op();
CABLES.OPS["ea508405-833d-411a-86b4-1a012c135c8a"]={f:Ops.Array.ArrayLength,objName:"Ops.Array.ArrayLength"};




// **************************************************************
// 
// Ops.Deprecated.Array.ContinuousNumberArray
// 
// **************************************************************

Ops.Deprecated.Array.ContinuousNumberArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

var numValues=op.inValueInt("numValues");

var values=op.addOutPort(new CABLES.Port(op, "values",CABLES.OP_PORT_TYPE_ARRAY));
values.ignoreValueSerialize=true;

numValues.set(100);

numValues.onChange=init;

var arr=[];
init();

function init()
{
    arr.length=Math.abs(Math.floor(numValues.get())) || 100;
    for(var i=0;i<arr.length;i++)
    {
        arr[i]=i;
    }
    
    values.set(null);
    values.set(arr);
}


};

Ops.Deprecated.Array.ContinuousNumberArray.prototype = new CABLES.Op();
CABLES.OPS["8b9cdeea-f94c-41dc-b743-627115289226"]={f:Ops.Deprecated.Array.ContinuousNumberArray,objName:"Ops.Deprecated.Array.ContinuousNumberArray"};




// **************************************************************
// 
// Ops.Array.ArraySin
// 
// **************************************************************

Ops.Array.ArraySin = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// this op allows the user to perform sin or cos
// math functions on an array
const inArray = op.inArray("array in");
const mathSelect = op.inValueSelect("Math function", ["Sin", "Cos"], "Sin");
const outArray = op.outArray("Array result");

const phase = op.inValue("Phase", 0.0);
const multiply = op.inValue("Frequency", 1.0);
const amplitude = op.inValue("Amplitude", 1.0);

const mathArray = [];
let selectIndex = 0;

const MATH_FUNC_SIN = 0;
const MATH_FUNC_COS = 1;


inArray.onChange = update;
multiply.onChange = update;
amplitude.onChange = update;
phase.onChange = update;
mathSelect.onChange = onFilterChange;

function onFilterChange()
{
    const mathSelectValue = mathSelect.get();
    if (mathSelectValue === "Sin") selectIndex = MATH_FUNC_SIN;
    else if (mathSelectValue === "Cos") selectIndex = MATH_FUNC_COS;
    update();
}

function update()
{
    const arrayIn = inArray.get();


    if (!arrayIn)
    {
        mathArray.length = 0;
        return;
    }

    mathArray.length = arrayIn.length;

    const amp = amplitude.get();
    const mul = multiply.get();
    const pha = phase.get();

    let i = 0;
    if (selectIndex === MATH_FUNC_SIN)
    {
        for (i = 0; i < arrayIn.length; i++)
            mathArray[i] = amp * Math.sin((arrayIn[i]) * mul + pha);
    }
    else if (selectIndex === MATH_FUNC_COS)
    {
        for (i = 0; i < arrayIn.length; i++)
            mathArray[i] = amp * (Math.cos(arrayIn[i] * mul + pha));
    }
    outArray.set(null);
    outArray.set(mathArray);
}


};

Ops.Array.ArraySin.prototype = new CABLES.Op();
CABLES.OPS["ded44bae-a24e-48c5-9585-4cb31f331ab6"]={f:Ops.Array.ArraySin,objName:"Ops.Array.ArraySin"};




// **************************************************************
// 
// Ops.Array.ArrayMathArray
// 
// **************************************************************

Ops.Array.ArrayMathArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inArray_0 = op.inArray("array 0"),
    inArray_1 = op.inArray("array 1"),
    mathSelect = op.inSwitch("Math function", ["+", "-", "*", "/", "%", "min", "max"], "+"),
    outArray = op.outArray("Array result"),
    outArrayLength = op.outNumber("Array length");

let mathFunc;

let showingError = false;

const mathArray = [];

op.toWorkPortsNeedToBeLinked(inArray_1, inArray_0);

mathSelect.onChange = onFilterChange;

inArray_0.onChange = inArray_1.onChange = update;
onFilterChange();

function onFilterChange()
{
    const mathSelectValue = mathSelect.get();

    if (mathSelectValue === "+") mathFunc = function (a, b) { return a + b; };
    else if (mathSelectValue === "-") mathFunc = function (a, b) { return a - b; };
    else if (mathSelectValue === "*") mathFunc = function (a, b) { return a * b; };
    else if (mathSelectValue === "/") mathFunc = function (a, b) { return a / b; };
    else if (mathSelectValue === "%") mathFunc = function (a, b) { return a % b; };
    else if (mathSelectValue === "min") mathFunc = function (a, b) { return Math.min(a, b); };
    else if (mathSelectValue === "max") mathFunc = function (a, b) { return Math.max(a, b); };
    update();
    op.setUiAttrib({ "extendTitle": mathSelectValue });
}

function update()
{
    const array0 = inArray_0.get();
    const array1 = inArray_1.get();

    if (!array0 || !array1)
    {
        outArray.set(null);
        outArrayLength.set(0);
        return;
    }

    const l = mathArray.length = array0.length;

    for (let i = 0; i < l; i++)
    {
        mathArray[i] = mathFunc(array0[i], array1[i]);
    }

    outArray.set(null);
    outArrayLength.set(mathArray.length);
    outArray.set(mathArray);
}


};

Ops.Array.ArrayMathArray.prototype = new CABLES.Op();
CABLES.OPS["f31a1764-ce14-41de-9b3f-dc2fe249bb52"]={f:Ops.Array.ArrayMathArray,objName:"Ops.Array.ArrayMathArray"};




// **************************************************************
// 
// Ops.Gl.Texture
// 
// **************************************************************

Ops.Gl.Texture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const filename = op.inFile("file", "image");
const tfilter = op.inSwitch("filter", ["nearest", "linear", "mipmap"]);
const wrap = op.inValueSelect("wrap", ["repeat", "mirrored repeat", "clamp to edge"], "clamp to edge");
const flip = op.inValueBool("flip", false);
const unpackAlpha = op.inValueBool("unpackPreMultipliedAlpha", false);
const aniso = op.inSwitch("Anisotropic", [0, 1, 2, 4, 8, 16], 0);

const textureOut = op.outTexture("texture");
const width = op.outValue("width");
const height = op.outValue("height");
const loading = op.outValue("loading");
const ratio = op.outValue("Aspect Ratio");

op.setPortGroup("Size", [width, height]);

unpackAlpha.setUiAttribs({ "hidePort": true });

op.toWorkPortsNeedToBeLinked(textureOut);

const cgl = op.patch.cgl;
let cgl_filter = 0;
let cgl_wrap = 0;
let cgl_aniso = 0;

filename.onChange = flip.onChange = function () { reloadSoon(); };

aniso.onChange = tfilter.onChange = onFilterChange;
wrap.onChange = onWrapChange;
unpackAlpha.onChange = function () { reloadSoon(); };

let timedLoader = 0;

tfilter.set("mipmap");
wrap.set("repeat");

textureOut.set(CGL.Texture.getEmptyTexture(cgl));

const setTempTexture = function ()
{
    const t = CGL.Texture.getTempTexture(cgl);
    textureOut.set(t);
};

let loadingId = null;
let tex = null;
function reloadSoon(nocache)
{
    clearTimeout(timedLoader);
    timedLoader = setTimeout(function ()
    {
        realReload(nocache);
    }, 30);
}

function realReload(nocache)
{
    if (!loadingId)loadingId = cgl.patch.loading.start("textureOp", filename.get());

    let url = op.patch.getFilePath(String(filename.get()));
    if (nocache)url += "?rnd=" + CABLES.generateUUID();

    if ((filename.get() && filename.get().length > 1))
    {
        loading.set(true);

        if (tex)tex.delete();
        tex = CGL.Texture.load(cgl, url,
            function (err)
            {
                if (err)
                {
                    setTempTexture();
                    op.setUiError("errorload", "could not load texture \"" + filename.get() + "\"", 2);
                    cgl.patch.loading.finished(loadingId);
                    return;
                }
                else op.setUiError("errorload", null);
                // op.uiAttr({'error':null});
                textureOut.set(tex);
                width.set(tex.width);
                height.set(tex.height);
                ratio.set(tex.width / tex.height);

                if (!tex.isPowerOfTwo())
                    op.setUiError("hintnpot", "texture dimensions not power of two! - texture filtering will not work.", 0);
                // op.uiAttr(
                //     {
                //         hint:'texture dimensions not power of two! - texture filtering will not work.',
                //         warning:null
                //     });
                else
                    op.setUiError("hintnpot", null);
                    // op.uiAttr(
                    //     {
                    //         hint:null,
                    //         warning:null
                    //     });

                textureOut.set(null);
                textureOut.set(tex);
                // tex.printInfo();
            }, {
                "anisotropic": cgl_aniso,
                "wrap": cgl_wrap,
                "flip": flip.get(),
                "unpackAlpha": unpackAlpha.get(),
                "filter": cgl_filter
            });

        textureOut.set(null);
        textureOut.set(tex);

        if (!textureOut.get() && nocache)
        {
        }

        cgl.patch.loading.finished(loadingId);
    }
    else
    {
        cgl.patch.loading.finished(loadingId);
        setTempTexture();
    }
}

function onFilterChange()
{
    if (tfilter.get() == "nearest") cgl_filter = CGL.Texture.FILTER_NEAREST;
    else if (tfilter.get() == "linear") cgl_filter = CGL.Texture.FILTER_LINEAR;
    else if (tfilter.get() == "mipmap") cgl_filter = CGL.Texture.FILTER_MIPMAP;
    else if (tfilter.get() == "Anisotropic") cgl_filter = CGL.Texture.FILTER_ANISOTROPIC;

    cgl_aniso = parseFloat(aniso.get());

    reloadSoon();
}

function onWrapChange()
{
    if (wrap.get() == "repeat") cgl_wrap = CGL.Texture.WRAP_REPEAT;
    if (wrap.get() == "mirrored repeat") cgl_wrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (wrap.get() == "clamp to edge") cgl_wrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reloadSoon();
}

op.onFileChanged = function (fn)
{
    if (filename.get() && filename.get().indexOf(fn) > -1)
    {
        textureOut.set(null);
        textureOut.set(CGL.Texture.getTempTexture(cgl));

        realReload(true);

        op.refreshParams();
    }
};


};

Ops.Gl.Texture.prototype = new CABLES.Op();
CABLES.OPS["466394d4-6c1a-4e5d-a057-0063ab0f096a"]={f:Ops.Gl.Texture,objName:"Ops.Gl.Texture"};




// **************************************************************
// 
// Ops.WebAudio.AudioBufferPlayer
// 
// **************************************************************

Ops.WebAudio.AudioBufferPlayer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

// input ports
const audioBufferPort = op.inObject("Audio Buffer");
const playPort = op.inValueBool("Start / Stop", false);
const startTimePort = op.inValue("Start Time", 0);
const stopTimePort = op.inValue("Stop Time", 0);
const offsetPort = op.inValue("Offset", 0);
const autoPlayPort = op.inValueBool("Autoplay", false);
const loopPort = op.inValueBool("Loop", false);
const detunePort = op.inValue("Detune", 0);
const inResetStart = op.inTriggerButton("Restart");
const playbackRatePort = op.inValue("Playback Rate", 1);

// output ports
const audioOutPort = op.outObject("Audio Out");
const outEnded = op.outBool("Finished", false);

// vars
let source = null;

// change listeners
audioBufferPort.onChange = function ()
{
    createAudioBufferSource();
    outEnded.set(false);
    if (
        (autoPlayPort.get() && audioBufferPort.get()) ||
    (playPort.get() && audioBufferPort.get())
    )
    {
        start(startTimePort.get());
    }
};
playPort.onChange = function ()
{
    if (source)
    {
        if (playPort.get())
        {
            const startTime = startTimePort.get() || 0;
            start(startTime);
            outEnded.set(false);
        }
        else
        {
            const stopTime = stopTimePort.get() || 0;
            stop(stopTime);
        }
    }
};
loopPort.onChange = function ()
{
    if (source)
    {
        source.loop = !!loopPort.get();
    }
};

detunePort.onChange = setDetune;

function setDetune()
{
    if (source)
    {
        const detune = detunePort.get() || 0;
        if (source.detune)
        {
            source.detune.setValueAtTime(
                detune,
                audioCtx.currentTime
            );
        }
    }
}

playbackRatePort.onChange = setPlaybackRate;

function setPlaybackRate()
{
    if (source)
    {
        const playbackRate = playbackRatePort.get() || 0;
        if (playbackRate >= source.playbackRate.minValue && playbackRate <= source.playbackRate.maxValue)
        {
            source.playbackRate.setValueAtTime(
                playbackRate,
                audioCtx.currentTime
            );
        }
    }
}

inResetStart.onTriggered = function ()
{
    if (source)
    {
        if (playPort.get())
        {
            stop(0);
            setTimeout(function ()
            {
                start(0);
            }, 30);
        }
    }
};
// functions
function createAudioBufferSource()
{
    if (source)stop(0);
    source = audioCtx.createBufferSource();
    const buffer = audioBufferPort.get();
    if (buffer)
    {
        source.buffer = buffer;
    }
    source.onended = onPlaybackEnded;
    source.loop = loopPort.get();
    setPlaybackRate();
    setDetune();
    audioOutPort.set(source);
}

function start(time)
{
    try
    {
        source.start(time, offsetPort.get()); // 0 = now
    }
    catch (e)
    {
        op.logError(e);
    } // already playing!?
}

function stop(time)
{
    try
    {
        source.stop(time); // 0 = now
    }
    catch (e)
    {
        op.logError(e);
    } // not playing!?
}

function onPlaybackEnded()
{
    outEnded.set(true);
    createAudioBufferSource(); // we can only play back once, so we need to create a new one
}


};

Ops.WebAudio.AudioBufferPlayer.prototype = new CABLES.Op();
CABLES.OPS["05385277-92fc-4d49-b730-11f9ed5e5c0d"]={f:Ops.WebAudio.AudioBufferPlayer,objName:"Ops.WebAudio.AudioBufferPlayer"};




// **************************************************************
// 
// Ops.WebAudio.AudioBuffer
// 
// **************************************************************

Ops.WebAudio.AudioBuffer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const audioCtx = CABLES.WEBAUDIO.createAudioContext(op);
const inUrlPort = op.inFile("URL", "audio");
const audioBufferPort = op.outObject("Audio Buffer");
const finishedLoadingPort = op.outValue("Finished Loading", false);
const sampleRatePort = op.outValue("Sample Rate", 0);
const lengthPort = op.outValue("Length", 0);
const durationPort = op.outValue("Duration", 0);
const numberOfChannelsPort = op.outValue("Number of Channels", 0);

// change listeners
inUrlPort.onChange = function ()
{
    let url = op.patch.getFilePath(inUrlPort.get());
    if (typeof url === "string" && url.length > 1)
    {
        CABLES.WEBAUDIO.loadAudioFile(op.patch, url, onLoadFinished, onLoadFailed);
    }
};

function onLoadFinished(buffer)
{
    lengthPort.set(buffer.length);
    durationPort.set(buffer.duration);
    numberOfChannelsPort.set(buffer.numberOfChannels);
    sampleRatePort.set(buffer.sampleRate);
    audioBufferPort.set(buffer);
    finishedLoadingPort.set(true);
    // op.log("AudioBuffer loaded: ", buffer);
}

function onLoadFailed(e)
{
    op.logError("Error: Loading audio file failed: ", e);
    invalidateOutPorts();
}

function invalidateOutPorts()
{
    lengthPort.set(0);
    durationPort.set(0);
    numberOfChannelsPort.set(0);
    sampleRatePort.set(0);
    audioBufferPort.set(0);
    finishedLoadingPort.set(false);
}


};

Ops.WebAudio.AudioBuffer.prototype = new CABLES.Op();
CABLES.OPS["2cf4b0a1-b657-405b-8bf9-8555dbd5c231"]={f:Ops.WebAudio.AudioBuffer,objName:"Ops.WebAudio.AudioBuffer"};




// **************************************************************
// 
// Ops.WebAudio.Output
// 
// **************************************************************

Ops.WebAudio.Output = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

let audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

// constants
let VOLUME_DEFAULT = 1.0;
let VOLUME_MIN = 0;
let VOLUME_MAX = 1;

// vars
let gainNode = audioCtx.createGain();
let destinationNode = audioCtx.destination;
gainNode.connect(destinationNode);
let masterVolume = 1;

// inputs
let audioInPort = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", gainNode);
let volumePort = op.inValueSlider("Volume", VOLUME_DEFAULT);
let mutePort = op.inValueBool("Mute", false);

// functions
// sets the volume, multiplied by master volume
function setVolume()
{
    let volume = volumePort.get() * masterVolume;
    if (volume >= VOLUME_MIN && volume <= VOLUME_MAX)
    {
        // gainNode.gain.value = volume;
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    }
    else
    {
        // gainNode.gain.value = VOLUME_DEFAULT * masterVolume;
        gainNode.gain.setValueAtTime(VOLUME_DEFAULT * masterVolume, audioCtx.currentTime);
    }
}

function mute(b)
{
    if (b)
    {
        // gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    }
    else
    {
        setVolume();
    }
}

// change listeners
mutePort.onChange = function ()
{
    mute(mutePort.get());
};

volumePort.onChange = function ()
{
    if (mutePort.get())
    {
        return;
    }
    setVolume();
};

op.onMasterVolumeChanged = function (v)
{
    masterVolume = v;
    setVolume();
};


};

Ops.WebAudio.Output.prototype = new CABLES.Op();
CABLES.OPS["53fdbf4a-bc8d-4c5d-a698-f34fdeb53827"]={f:Ops.WebAudio.Output,objName:"Ops.WebAudio.Output"};




// **************************************************************
// 
// Ops.WebAudio.AudioAnalyzer
// 
// **************************************************************

Ops.WebAudio.AudioAnalyzer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const refresh = op.addInPort(new CABLES.Port(op, "refresh", CABLES.OP_PORT_TYPE_FUNCTION));

const audioCtx = CABLES.WEBAUDIO.createAudioContext(op);
const inFftSize = op.inSwitch("FFT size", [64, 128, 256, 512, 1024], 256);
const analyser = audioCtx.createAnalyser();
analyser.smoothingTimeConstant = 0.3;
analyser.fftSize = 256;

const audioIn = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", analyser);
const anData = op.inValueSelect("Data", ["Frequency", "Time Domain"], "Frequency");

const next = op.outTrigger("Next");
const audioOutPort = CABLES.WEBAUDIO.createAudioOutPort(op, "Audio Out", analyser);
const avgVolume = op.addOutPort(new CABLES.Port(op, "average volume", CABLES.OP_PORT_TYPE_VALUE));
const fftOut = op.addOutPort(new CABLES.Port(op, "fft", CABLES.OP_PORT_TYPE_ARRAY));

let fftBufferLength = analyser.frequencyBinCount;
let fftDataArray = new Uint8Array(fftBufferLength);
let getFreq = true;
const array = null;

inFftSize.onChange = function ()
{
    analyser.fftSize = inFftSize.get();
};

anData.onChange = function ()
{
    if (anData.get() == "Frequency")getFreq = true;
    if (anData.get() == "Time Domain")getFreq = false;
};

refresh.onTriggered = function ()
{
    analyser.minDecibels = -90;
    analyser.maxDecibels = 0;

    if (fftBufferLength != analyser.frequencyBinCount)
    {
        fftBufferLength = analyser.frequencyBinCount;
        fftDataArray = new Uint8Array(fftBufferLength);
    }

    if (!fftDataArray)
    {
        // op.log("[audioanalyzer] fftDataArray is null, returning.");
        return;
    }

    let values = 0;

    for (let i = 0; i < fftDataArray.length; i++) values += fftDataArray[i];

    const average = values / fftDataArray.length;

    avgVolume.set(average / 128);
    try
    {
        if (getFreq) analyser.getByteFrequencyData(fftDataArray);
        else analyser.getByteTimeDomainData(fftDataArray);
    }
    catch (e) { op.log(e); }

    fftOut.set(null);
    fftOut.set(fftDataArray);

    next.trigger();
};


};

Ops.WebAudio.AudioAnalyzer.prototype = new CABLES.Op();
CABLES.OPS["22523fae-a623-401d-b952-a57c26de4b4e"]={f:Ops.WebAudio.AudioAnalyzer,objName:"Ops.WebAudio.AudioAnalyzer"};




// **************************************************************
// 
// Ops.Gl.Matrix.TransformView
// 
// **************************************************************

Ops.Gl.Matrix.TransformView = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render = op.inTrigger("render"),
    posX = op.inValueFloat("posX"),
    posY = op.inValueFloat("posY"),
    posZ = op.inValueFloat("posZ"),
    scale = op.inValueFloat("scale"),
    rotX = op.inValueFloat("rotX"),
    rotY = op.inValueFloat("rotY"),
    rotZ = op.inValueFloat("rotZ"),
    trigger = op.outTrigger("trigger");

op.setPortGroup("Position", [posX, posY, posZ]);
op.setPortGroup("Scale", [scale]);
op.setPortGroup("Rotation", [rotX, rotZ, rotY]);

const vPos = vec3.create();
const vScale = vec3.create();
const transMatrix = mat4.create();
mat4.identity(transMatrix);

let doScale = false;
let doTranslate = false;

let translationChanged = true;
let didScaleChanged = true;
let didRotChanged = true;

render.onTriggered = function ()
{
    const cg = op.patch.cg;

    let updateMatrix = false;
    if (translationChanged)
    {
        updateTranslation();
        updateMatrix = true;
    }
    if (didScaleChanged)
    {
        updateScale();
        updateMatrix = true;
    }
    if (didRotChanged)
    {
        updateMatrix = true;
    }
    if (updateMatrix)doUpdateMatrix();

    cg.pushViewMatrix();
    mat4.multiply(cg.vMatrix, cg.vMatrix, transMatrix);

    trigger.trigger();
    cg.popViewMatrix();

    if (op.isCurrentUiOp())
        gui.setTransformGizmo(
            {
                "posX": posX,
                "posY": posY,
                "posZ": posZ,
            });
};

op.transform3d = function ()
{
    return {
        "pos": [posX, posY, posZ]
    };
};

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if (doTranslate)mat4.translate(transMatrix, transMatrix, vPos);

    if (rotX.get() !== 0)mat4.rotateX(transMatrix, transMatrix, rotX.get() * CGL.DEG2RAD);
    if (rotY.get() !== 0)mat4.rotateY(transMatrix, transMatrix, rotY.get() * CGL.DEG2RAD);
    if (rotZ.get() !== 0)mat4.rotateZ(transMatrix, transMatrix, rotZ.get() * CGL.DEG2RAD);

    if (doScale)mat4.scale(transMatrix, transMatrix, vScale);
    rotChanged = false;
}

function updateTranslation()
{
    doTranslate = false;
    if (posX.get() !== 0.0 || posY.get() !== 0.0 || posZ.get() !== 0.0) doTranslate = true;
    vec3.set(vPos, posX.get(), posY.get(), posZ.get());
    translationChanged = false;
}

function updateScale()
{
    doScale = false;
    if (scale.get() !== 0.0)doScale = true;
    vec3.set(vScale, scale.get(), scale.get(), scale.get());
    scaleChanged = false;
}

function translateChanged()
{
    translationChanged = true;
}

function scaleChanged()
{
    didScaleChanged = true;
}

function rotChanged()
{
    didRotChanged = true;
}

rotX.onChange =
rotY.onChange =
rotZ.onChange = rotChanged;

scale.onChange = scaleChanged;

posX.onChange =
posY.onChange =
posZ.onChange = translateChanged;

rotX.set(0.0);
rotY.set(0.0);
rotZ.set(0.0);

scale.set(1.0);

posX.set(0.0);
posY.set(0.0);
posZ.set(0.0);

doUpdateMatrix();


};

Ops.Gl.Matrix.TransformView.prototype = new CABLES.Op();
CABLES.OPS["0b3e04f7-323e-4ac8-8a22-a21e2f36e0e9"]={f:Ops.Gl.Matrix.TransformView,objName:"Ops.Gl.Matrix.TransformView"};




// **************************************************************
// 
// Ops.Sidebar.Sidebar
// 
// **************************************************************

Ops.Sidebar.Sidebar = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"style_css":" /*\n * SIDEBAR\n  http://danielstern.ca/range.css/#/\n  https://developer.mozilla.org/en-US/docs/Web/CSS/::-webkit-progress-value\n */\n\n.sidebar-icon-undo\n{\n    width:10px;\n    height:10px;\n    background-image: url(\"data:image/svg+xml;charset=utf8, %3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='grey' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 7v6h6'/%3E%3Cpath d='M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13'/%3E%3C/svg%3E\");\n    background-size: 19px;\n    background-repeat: no-repeat;\n    top: -19px;\n    margin-top: -7px;\n}\n\n.icon-chevron-down {\n    top: 2px;\n    right: 9px;\n}\n\n.iconsidebar-chevron-up,.sidebar__close-button {\n\tbackground-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tdXAiPjxwb2x5bGluZSBwb2ludHM9IjE4IDE1IDEyIDkgNiAxNSI+PC9wb2x5bGluZT48L3N2Zz4=);\n}\n\n.iconsidebar-minimizebutton {\n    background-position: 98% center;\n    background-repeat: no-repeat;\n}\n\n.sidebar-cables-right\n{\n    right: 15px;\n    left: initial !important;\n}\n\n.sidebar-cables {\n    --sidebar-color: #07f78c;\n    --sidebar-width: 220px;\n    --sidebar-border-radius: 10px;\n    --sidebar-monospace-font-stack: \"SFMono-Regular\", Consolas, \"Liberation Mono\", Menlo, Courier, monospace;\n    --sidebar-hover-transition-time: .2s;\n\n    position: absolute;\n    top: 15px;\n    left: 15px;\n    border-radius: var(--sidebar-border-radius);\n    z-index: 100000;\n    color: #BBBBBB;\n    width: var(  --sidebar-width);\n    max-height: 100%;\n    box-sizing: border-box;\n    overflow-y: auto;\n    overflow-x: hidden;\n    font-size: 13px;\n    font-family: Arial;\n    line-height: 1em; /* prevent emojis from breaking height of the title */\n}\n\n.sidebar-cables::selection {\n    background-color: var(--sidebar-color);\n    color: #EEEEEE;\n}\n\n.sidebar-cables::-webkit-scrollbar {\n    background-color: transparent;\n    --cables-scrollbar-width: 8px;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables::-webkit-scrollbar-track {\n    background-color: transparent;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables::-webkit-scrollbar-thumb {\n    background-color: #333333;\n    border-radius: 4px;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables--closed {\n    width: auto;\n}\n\n.sidebar__close-button {\n    background-color: #222;\n    /*-webkit-user-select: none;  */\n    /*-moz-user-select: none;     */\n    /*-ms-user-select: none;      */\n    /*user-select: none;          */\n    /*transition: background-color var(--sidebar-hover-transition-time);*/\n    /*color: #CCCCCC;*/\n    height: 2px;\n    /*border-bottom:20px solid #222;*/\n\n    /*box-sizing: border-box;*/\n    /*padding-top: 2px;*/\n    /*text-align: center;*/\n    /*cursor: pointer;*/\n    /*border-radius: 0 0 var(--sidebar-border-radius) var(--sidebar-border-radius);*/\n    /*opacity: 1.0;*/\n    /*transition: opacity 0.3s;*/\n    /*overflow: hidden;*/\n}\n\n.sidebar__close-button-icon {\n    display: inline-block;\n    /*opacity: 0;*/\n    width: 20px;\n    height: 20px;\n    /*position: relative;*/\n    /*top: -1px;*/\n\n\n}\n\n.sidebar--closed {\n    width: auto;\n    margin-right: 20px;\n}\n\n.sidebar--closed .sidebar__close-button {\n    margin-top: 8px;\n    margin-left: 8px;\n    padding:10px;\n\n    height: 25px;\n    width:25px;\n    border-radius: 50%;\n    cursor: pointer;\n    opacity: 0.3;\n    background-repeat: no-repeat;\n    background-position: center center;\n    transform:rotate(180deg);\n}\n\n.sidebar--closed .sidebar__group\n{\n    display:none;\n\n}\n.sidebar--closed .sidebar__close-button-icon {\n    background-position: 0px 0px;\n}\n\n.sidebar__close-button:hover {\n    background-color: #111111;\n    opacity: 1.0 !important;\n}\n\n/*\n * SIDEBAR ITEMS\n */\n\n.sidebar__items {\n    /* max-height: 1000px; */\n    /* transition: max-height 0.5;*/\n    background-color: #222;\n    padding-bottom: 20px;\n}\n\n.sidebar--closed .sidebar__items {\n    /* max-height: 0; */\n    height: 0;\n    display: none;\n    pointer-interactions: none;\n}\n\n.sidebar__item__right {\n    float: right;\n}\n\n/*\n * SIDEBAR GROUP\n */\n\n.sidebar__group {\n    /*background-color: #1A1A1A;*/\n    overflow: hidden;\n    box-sizing: border-box;\n    animate: height;\n    /*background-color: #151515;*/\n    /* max-height: 1000px; */\n    /* transition: max-height 0.5s; */\n--sidebar-group-header-height: 33px;\n}\n\n.sidebar__group-items\n{\n    padding-top: 15px;\n    padding-bottom: 15px;\n}\n\n.sidebar__group--closed {\n    /* max-height: 13px; */\n    height: var(--sidebar-group-header-height);\n}\n\n.sidebar__group-header {\n    box-sizing: border-box;\n    color: #EEEEEE;\n    background-color: #151515;\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n\n    /*height: 100%;//var(--sidebar-group-header-height);*/\n\n    padding-top: 7px;\n    text-transform: uppercase;\n    letter-spacing: 0.08em;\n    cursor: pointer;\n    /*transition: background-color var(--sidebar-hover-transition-time);*/\n    position: relative;\n}\n\n.sidebar__group-header:hover {\n  background-color: #111111;\n}\n\n.sidebar__group-header-title {\n  /*float: left;*/\n  overflow: hidden;\n  padding: 0 15px;\n  padding-top:5px;\n  padding-bottom:10px;\n  font-weight:bold;\n}\n\n.sidebar__group-header-undo {\n    float: right;\n    overflow: hidden;\n    padding-right: 15px;\n    padding-top:5px;\n    font-weight:bold;\n  }\n\n.sidebar__group-header-icon {\n    width: 17px;\n    height: 14px;\n    background-repeat: no-repeat;\n    display: inline-block;\n    position: absolute;\n    background-size: cover;\n\n    /* icon open */\n    /* feather icon: chevron up */\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tdXAiPjxwb2x5bGluZSBwb2ludHM9IjE4IDE1IDEyIDkgNiAxNSI+PC9wb2x5bGluZT48L3N2Zz4=);\n    top: 4px;\n    right: 5px;\n    opacity: 0.0;\n    transition: opacity 0.3;\n}\n\n.sidebar__group-header:hover .sidebar__group-header-icon {\n    opacity: 1.0;\n}\n\n/* icon closed */\n.sidebar__group--closed .sidebar__group-header-icon {\n    /* feather icon: chevron down */\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tZG93biI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+);\n    top: 4px;\n    right: 5px;\n}\n\n/*\n * SIDEBAR ITEM\n */\n\n.sidebar__item\n{\n    box-sizing: border-box;\n    padding: 7px;\n    padding-left:15px;\n    padding-right:15px;\n\n    overflow: hidden;\n    position: relative;\n}\n\n.sidebar__item-label {\n    display: inline-block;\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    width: calc(50% - 7px);\n    margin-right: 7px;\n    margin-top: 2px;\n    text-overflow: ellipsis;\n    /* overflow: hidden; */\n}\n\n.sidebar__item-value-label {\n    font-family: var(--sidebar-monospace-font-stack);\n    display: inline-block;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    white-space: nowrap;\n    max-width: 60%;\n}\n\n.sidebar__item-value-label::selection {\n    background-color: var(--sidebar-color);\n    color: #EEEEEE;\n}\n\n.sidebar__item + .sidebar__item,\n.sidebar__item + .sidebar__group,\n.sidebar__group + .sidebar__item,\n.sidebar__group + .sidebar__group {\n    /*border-top: 1px solid #272727;*/\n}\n\n/*\n * SIDEBAR ITEM TOGGLE\n */\n\n/*.sidebar__toggle */\n.icon_toggle{\n    cursor: pointer;\n}\n\n.sidebar__toggle-input {\n    --sidebar-toggle-input-color: #CCCCCC;\n    --sidebar-toggle-input-color-hover: #EEEEEE;\n    --sidebar-toggle-input-border-size: 2px;\n    display: inline;\n    float: right;\n    box-sizing: border-box;\n    border-radius: 50%;\n    cursor: pointer;\n    --toggle-size: 11px;\n    margin-top: 2px;\n    background-color: transparent !important;\n    border: var(--sidebar-toggle-input-border-size) solid var(--sidebar-toggle-input-color);\n    width: var(--toggle-size);\n    height: var(--toggle-size);\n    transition: background-color var(--sidebar-hover-transition-time);\n    transition: border-color var(--sidebar-hover-transition-time);\n}\n.sidebar__toggle:hover .sidebar__toggle-input {\n    border-color: var(--sidebar-toggle-input-color-hover);\n}\n\n.sidebar__toggle .sidebar__item-value-label {\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    max-width: calc(50% - 12px);\n}\n.sidebar__toggle-input::after { clear: both; }\n\n.sidebar__toggle--active .icon_toggle\n{\n\n    background-image: url(data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjE1cHgiIHdpZHRoPSIzMHB4IiBmaWxsPSIjMDZmNzhiIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTAwIDEwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZmlsbD0iIzA2Zjc4YiIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCBjMTIuNjUsMCwyMy0xMC4zNSwyMy0yM2wwLDBjMC0xMi42NS0xMC4zNS0yMy0yMy0yM0gzMHogTTcwLDY3Yy05LjM4OSwwLTE3LTcuNjEtMTctMTdzNy42MTEtMTcsMTctMTdzMTcsNy42MSwxNywxNyAgICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PC9nPjwvZz48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMweiBNNzAsNjdjLTkuMzg5LDAtMTctNy42MS0xNy0xN3M3LjYxMS0xNywxNy0xN3MxNyw3LjYxLDE3LDE3ICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48cGF0aCBmaWxsPSIjMDZmNzhiIiBzdHJva2U9IiMwNmY3OGIiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBkPSJNNyw1MGMwLDEyLjY1LDEwLjM1LDIzLDIzLDIzaDQwICAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMwQzE3LjM1LDI3LDcsMzcuMzUsNyw1MEw3LDUweiI+PC9wYXRoPjwvZz48Y2lyY2xlIGRpc3BsYXk9ImlubGluZSIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IiMwNmY3OGIiIHN0cm9rZT0iIzA2Zjc4YiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGN4PSI3MCIgY3k9IjUwIiByPSIxNyI+PC9jaXJjbGU+PC9nPjxnIGRpc3BsYXk9Im5vbmUiPjxwYXRoIGRpc3BsYXk9ImlubGluZSIgZD0iTTcwLDI1SDMwQzE2LjIxNSwyNSw1LDM2LjIxNSw1LDUwczExLjIxNSwyNSwyNSwyNWg0MGMxMy43ODUsMCwyNS0xMS4yMTUsMjUtMjVTODMuNzg1LDI1LDcwLDI1eiBNNzAsNzEgICBIMzBDMTguNDIxLDcxLDksNjEuNTc5LDksNTBzOS40MjEtMjEsMjEtMjFoNDBjMTEuNTc5LDAsMjEsOS40MjEsMjEsMjFTODEuNTc5LDcxLDcwLDcxeiBNNzAsMzFjLTEwLjQ3NywwLTE5LDguNTIzLTE5LDE5ICAgczguNTIzLDE5LDE5LDE5czE5LTguNTIzLDE5LTE5UzgwLjQ3NywzMSw3MCwzMXogTTcwLDY1Yy04LjI3MSwwLTE1LTYuNzI5LTE1LTE1czYuNzI5LTE1LDE1LTE1czE1LDYuNzI5LDE1LDE1Uzc4LjI3MSw2NSw3MCw2NXoiPjwvcGF0aD48L2c+PC9zdmc+);\n    opacity: 1;\n    transform: rotate(0deg);\n}\n\n\n.icon_toggle\n{\n    float: right;\n    width:40px;\n    height:18px;\n    background-image: url(data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjE1cHgiIHdpZHRoPSIzMHB4IiBmaWxsPSIjYWFhYWFhIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTAwIDEwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZmlsbD0iI2FhYWFhYSIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCBjMTIuNjUsMCwyMy0xMC4zNSwyMy0yM2wwLDBjMC0xMi42NS0xMC4zNS0yMy0yMy0yM0gzMHogTTcwLDY3Yy05LjM4OSwwLTE3LTcuNjEtMTctMTdzNy42MTEtMTcsMTctMTdzMTcsNy42MSwxNywxNyAgICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PC9nPjwvZz48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMweiBNNzAsNjdjLTkuMzg5LDAtMTctNy42MS0xNy0xN3M3LjYxMS0xNywxNy0xN3MxNyw3LjYxLDE3LDE3ICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48cGF0aCBmaWxsPSIjYWFhYWFhIiBzdHJva2U9IiNhYWFhYWEiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBkPSJNNyw1MGMwLDEyLjY1LDEwLjM1LDIzLDIzLDIzaDQwICAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMwQzE3LjM1LDI3LDcsMzcuMzUsNyw1MEw3LDUweiI+PC9wYXRoPjwvZz48Y2lyY2xlIGRpc3BsYXk9ImlubGluZSIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IiNhYWFhYWEiIHN0cm9rZT0iI2FhYWFhYSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGN4PSI3MCIgY3k9IjUwIiByPSIxNyI+PC9jaXJjbGU+PC9nPjxnIGRpc3BsYXk9Im5vbmUiPjxwYXRoIGRpc3BsYXk9ImlubGluZSIgZD0iTTcwLDI1SDMwQzE2LjIxNSwyNSw1LDM2LjIxNSw1LDUwczExLjIxNSwyNSwyNSwyNWg0MGMxMy43ODUsMCwyNS0xMS4yMTUsMjUtMjVTODMuNzg1LDI1LDcwLDI1eiBNNzAsNzEgICBIMzBDMTguNDIxLDcxLDksNjEuNTc5LDksNTBzOS40MjEtMjEsMjEtMjFoNDBjMTEuNTc5LDAsMjEsOS40MjEsMjEsMjFTODEuNTc5LDcxLDcwLDcxeiBNNzAsMzFjLTEwLjQ3NywwLTE5LDguNTIzLTE5LDE5ICAgczguNTIzLDE5LDE5LDE5czE5LTguNTIzLDE5LTE5UzgwLjQ3NywzMSw3MCwzMXogTTcwLDY1Yy04LjI3MSwwLTE1LTYuNzI5LTE1LTE1czYuNzI5LTE1LDE1LTE1czE1LDYuNzI5LDE1LDE1Uzc4LjI3MSw2NSw3MCw2NXoiPjwvcGF0aD48L2c+PC9zdmc+);\n    background-size: 50px 37px;\n    background-position: -6px -10px;\n    transform: rotate(180deg);\n    opacity: 0.4;\n}\n\n\n\n/*.sidebar__toggle--active .sidebar__toggle-input {*/\n/*    transition: background-color var(--sidebar-hover-transition-time);*/\n/*    background-color: var(--sidebar-toggle-input-color);*/\n/*}*/\n/*.sidebar__toggle--active .sidebar__toggle-input:hover*/\n/*{*/\n/*    background-color: var(--sidebar-toggle-input-color-hover);*/\n/*    border-color: var(--sidebar-toggle-input-color-hover);*/\n/*    transition: background-color var(--sidebar-hover-transition-time);*/\n/*    transition: border-color var(--sidebar-hover-transition-time);*/\n/*}*/\n\n/*\n * SIDEBAR ITEM BUTTON\n */\n\n.sidebar__button {}\n\n.sidebar__button-input {\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    min-height: 24px;\n    background-color: transparent;\n    color: #CCCCCC;\n    box-sizing: border-box;\n    padding-top: 3px;\n    text-align: center;\n    border-radius: 125px;\n    border:2px solid #555;\n    cursor: pointer;\n    padding-bottom: 3px;\n}\n\n.sidebar__button-input.plus, .sidebar__button-input.minus {\n    display: inline-block;\n    min-width: 20px;\n}\n\n.sidebar__button-input:hover {\n  background-color: #333;\n  border:2px solid var(--sidebar-color);\n}\n\n/*\n * VALUE DISPLAY (shows a value)\n */\n\n.sidebar__value-display {}\n\n/*\n * SLIDER\n */\n\n.sidebar__slider {\n    --sidebar-slider-input-height: 3px;\n}\n\n.sidebar__slider-input-wrapper {\n    width: 100%;\n\n    margin-top: 8px;\n    position: relative;\n}\n\n.sidebar__slider-input {\n    -webkit-appearance: none;\n    appearance: none;\n    margin: 0;\n    width: 100%;\n    height: var(--sidebar-slider-input-height);\n    background: #555;\n    cursor: pointer;\n    outline: 0;\n\n    -webkit-transition: .2s;\n    transition: background-color .2s;\n    border: none;\n}\n\n.sidebar__slider-input:focus, .sidebar__slider-input:hover {\n    border: none;\n}\n\n.sidebar__slider-input-active-track {\n    user-select: none;\n    position: absolute;\n    z-index: 11;\n    top: 0;\n    left: 0;\n    background-color: var(--sidebar-color);\n    pointer-events: none;\n    height: var(--sidebar-slider-input-height);\n    max-width: 100%;\n}\n\n/* Mouse-over effects */\n.sidebar__slider-input:hover {\n    /*background-color: #444444;*/\n}\n\n/*.sidebar__slider-input::-webkit-progress-value {*/\n/*    background-color: green;*/\n/*    color:green;*/\n\n/*    }*/\n\n/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */\n\n.sidebar__slider-input::-moz-range-thumb\n{\n    position: absolute;\n    height: 15px;\n    width: 15px;\n    z-index: 900 !important;\n    border-radius: 20px !important;\n    cursor: pointer;\n    background: var(--sidebar-color) !important;\n    user-select: none;\n\n}\n\n.sidebar__slider-input::-webkit-slider-thumb\n{\n    position: relative;\n    appearance: none;\n    -webkit-appearance: none;\n    user-select: none;\n    height: 15px;\n    width: 15px;\n    display: block;\n    z-index: 900 !important;\n    border: 0;\n    border-radius: 20px !important;\n    cursor: pointer;\n    background: #777 !important;\n}\n\n.sidebar__slider-input:hover ::-webkit-slider-thumb {\n    background-color: #EEEEEE !important;\n}\n\n/*.sidebar__slider-input::-moz-range-thumb {*/\n\n/*    width: 0 !important;*/\n/*    height: var(--sidebar-slider-input-height);*/\n/*    background: #EEEEEE;*/\n/*    cursor: pointer;*/\n/*    border-radius: 0 !important;*/\n/*    border: none;*/\n/*    outline: 0;*/\n/*    z-index: 100 !important;*/\n/*}*/\n\n.sidebar__slider-input::-moz-range-track {\n    background-color: transparent;\n    z-index: 11;\n}\n\n/*.sidebar__slider-input::-moz-range-thumb:hover {*/\n  /* background-color: #EEEEEE; */\n/*}*/\n\n\n/*.sidebar__slider-input-wrapper:hover .sidebar__slider-input-active-track {*/\n/*    background-color: #EEEEEE;*/\n/*}*/\n\n/*.sidebar__slider-input-wrapper:hover .sidebar__slider-input::-moz-range-thumb {*/\n/*    background-color: #fff !important;*/\n/*}*/\n\n/*.sidebar__slider-input-wrapper:hover .sidebar__slider-input::-webkit-slider-thumb {*/\n/*    background-color: #EEEEEE;*/\n/*}*/\n\n.sidebar__slider input[type=text],\n.sidebar__slider input[type=paddword]\n{\n    box-sizing: border-box;\n    /*background-color: #333333;*/\n    text-align: right;\n    color: #BBBBBB;\n    display: inline-block;\n    background-color: transparent !important;\n\n    width: 40%;\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n}\n\n.sidebar__slider input[type=text]:active,\n.sidebar__slider input[type=text]:focus,\n.sidebar__slider input[type=text]:hover\n.sidebar__slider input[type=password]:active,\n.sidebar__slider input[type=password]:focus,\n.sidebar__slider input[type=password]:hover\n{\n\n    color: #EEEEEE;\n}\n\n/*\n * TEXT / DESCRIPTION\n */\n\n.sidebar__text .sidebar__item-label {\n    width: auto;\n    display: block;\n    max-height: none;\n    margin-right: 0;\n    line-height: 1.1em;\n}\n\n/*\n * SIDEBAR INPUT\n */\n.sidebar__text-input textarea,\n.sidebar__text-input input[type=text],\n.sidebar__text-input input[type=password] {\n    box-sizing: border-box;\n    background-color: #333333;\n    color: #BBBBBB;\n    display: inline-block;\n    width: 50%;\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    border:1px solid #666;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n}\n\n.sidebar__text-input textarea:focus::placeholder {\n  color: transparent;\n}\n\n.sidebar__color-picker .sidebar__item-label\n{\n    width:45%;\n}\n\n.sidebar__text-input textarea,\n.sidebar__text-input input[type=text]:active,\n.sidebar__text-input input[type=text]:focus,\n.sidebar__text-input input[type=text]:hover,\n.sidebar__text-input input[type=password]:active,\n.sidebar__text-input input[type=password]:focus,\n.sidebar__text-input input[type=password]:hover {\n    background-color: transparent;\n    color: #EEEEEE;\n}\n\n.sidebar__text-input textarea\n{\n    margin-top:10px;\n    height:60px;\n    width:100%;\n}\n\n/*\n * SIDEBAR SELECT\n */\n\n\n\n .sidebar__select {}\n .sidebar__select-select {\n    color: #BBBBBB;\n    /*-webkit-appearance: none;*/\n    /*-moz-appearance: none;*/\n    appearance: none;\n    /*box-sizing: border-box;*/\n    width: 50%;\n    /*height: 20px;*/\n    background-color: #333333;\n    /*background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tZG93biI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+);*/\n    background-repeat: no-repeat;\n    background-position: right center;\n    background-size: 16px 16px;\n    margin: 0;\n    /*padding: 0 2 2 6px;*/\n    border-radius: 5px;\n    border: 1px solid #777;\n    background-color: #444;\n    cursor: pointer;\n    outline: none;\n    padding-left: 5px;\n\n }\n\n.sidebar__select-select:hover,\n.sidebar__select-select:active,\n.sidebar__select-select:active {\n    background-color: #444444;\n    color: #EEEEEE;\n}\n\n/*\n * COLOR PICKER\n */\n\n\n .sidebar__color-picker input[type=text] {\n    box-sizing: border-box;\n    background-color: #333333;\n    color: #BBBBBB;\n    display: inline-block;\n    width: calc(50% - 21px); /* 50% minus space of picker circle */\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n    margin-right: 7px;\n}\n\n.sidebar__color-picker input[type=text]:active,\n.sidebar__color-picker input[type=text]:focus,\n.sidebar__color-picker input[type=text]:hover {\n    background-color: #444444;\n    color: #EEEEEE;\n}\n\ndiv.sidebar__color-picker-color-input,\n.sidebar__color-picker input[type=color],\n.sidebar__palette-picker input[type=color] {\n    display: inline-block;\n    border-radius: 100%;\n    height: 14px;\n    width: 14px;\n\n    padding: 0;\n    border: none;\n    /*border:2px solid red;*/\n    border-color: transparent;\n    outline: none;\n    background: none;\n    appearance: none;\n    -moz-appearance: none;\n    -webkit-appearance: none;\n    cursor: pointer;\n    position: relative;\n    top: 3px;\n}\n.sidebar__color-picker input[type=color]:focus,\n.sidebar__palette-picker input[type=color]:focus {\n    outline: none;\n}\n.sidebar__color-picker input[type=color]::-moz-color-swatch,\n.sidebar__palette-picker input[type=color]::-moz-color-swatch {\n    border: none;\n}\n.sidebar__color-picker input[type=color]::-webkit-color-swatch-wrapper,\n.sidebar__palette-picker input[type=color]::-webkit-color-swatch-wrapper {\n    padding: 0;\n}\n.sidebar__color-picker input[type=color]::-webkit-color-swatch,\n.sidebar__palette-picker input[type=color]::-webkit-color-swatch {\n    border: none;\n    border-radius: 100%;\n}\n\n/*\n * Palette Picker\n */\n.sidebar__palette-picker .sidebar__palette-picker-color-input.first {\n    margin-left: 0;\n}\n.sidebar__palette-picker .sidebar__palette-picker-color-input.last {\n    margin-right: 0;\n}\n.sidebar__palette-picker .sidebar__palette-picker-color-input {\n    margin: 0 4px;\n}\n\n.sidebar__palette-picker .circlebutton {\n    width: 14px;\n    height: 14px;\n    border-radius: 1em;\n    display: inline-block;\n    top: 3px;\n    position: relative;\n}\n\n/*\n * Preset\n */\n.sidebar__item-presets-preset\n{\n    padding:4px;\n    cursor:pointer;\n    padding-left:8px;\n    padding-right:8px;\n    margin-right:4px;\n    background-color:#444;\n}\n\n.sidebar__item-presets-preset:hover\n{\n    background-color:#666;\n}\n\n.sidebar__greyout\n{\n    background: #222;\n    opacity: 0.8;\n    width: 100%;\n    height: 100%;\n    position: absolute;\n    z-index: 1000;\n    right: 0;\n    top: 0;\n}\n\n.sidebar_tabs\n{\n    background-color: #151515;\n    padding-bottom: 0px;\n}\n\n.sidebar_switchs\n{\n    float: right;\n}\n\n.sidebar_tab\n{\n    float:left;\n    background-color: #151515;\n    border-bottom:1px solid transparent;\n    padding-right:7px;\n    padding-left:7px;\n    padding-bottom: 5px;\n    padding-top: 5px;\n    cursor:pointer;\n}\n\n.sidebar_tab_active\n{\n    background-color: #272727;\n    color:white;\n}\n\n.sidebar_tab:hover\n{\n    border-bottom:1px solid #777;\n    color:white;\n}\n\n\n.sidebar_switch\n{\n    float:left;\n    background-color: #444;\n    padding-right:7px;\n    padding-left:7px;\n    padding-bottom: 5px;\n    padding-top: 5px;\n    cursor:pointer;\n}\n\n.sidebar_switch:last-child\n{\n    border-top-right-radius: 7px;\n    border-bottom-right-radius: 7px;\n}\n\n.sidebar_switch:first-child\n{\n    border-top-left-radius: 7px;\n    border-bottom-left-radius: 7px;\n}\n\n\n.sidebar_switch_active\n{\n    background-color: #999;\n    color:white;\n}\n\n.sidebar_switch:hover\n{\n    color:white;\n}\n",};
// vars
const CSS_ELEMENT_CLASS = "cables-sidebar-style"; /* class for the style element to be generated */
const CSS_ELEMENT_DYNAMIC_CLASS = "cables-sidebar-dynamic-style"; /* things which can be set via op-port, but not attached to the elements themselves, e.g. minimized opacity */
const SIDEBAR_CLASS = "sidebar-cables";
const SIDEBAR_ID = "sidebar" + CABLES.uuid();
const SIDEBAR_ITEMS_CLASS = "sidebar__items";
const SIDEBAR_OPEN_CLOSE_BTN_CLASS = "sidebar__close-button";

const BTN_TEXT_OPEN = ""; // 'Close';
const BTN_TEXT_CLOSED = ""; // 'Show Controls';

let openCloseBtn = null;
let openCloseBtnIcon = null;
let headerTitleText = null;

// inputs
const visiblePort = op.inValueBool("Visible", true);
const opacityPort = op.inValueSlider("Opacity", 1);
const defaultMinimizedPort = op.inValueBool("Default Minimized");
const minimizedOpacityPort = op.inValueSlider("Minimized Opacity", 0.5);
const undoButtonPort = op.inValueBool("Show undo button", false);
const inMinimize = op.inValueBool("Show Minimize", false);

const inTitle = op.inString("Title", "Sidebar");
const side = op.inValueBool("Side");

// outputs
const childrenPort = op.outObject("childs");
childrenPort.setUiAttribs({ "title": "Children" });

const isOpenOut = op.outBool("Opfened");
isOpenOut.setUiAttribs({ "title": "Opened" });

let sidebarEl = document.querySelector("." + SIDEBAR_ID);
if (!sidebarEl)
{
    sidebarEl = initSidebarElement();
}
// if(!sidebarEl) return;
const sidebarItemsEl = sidebarEl.querySelector("." + SIDEBAR_ITEMS_CLASS);
childrenPort.set({
    "parentElement": sidebarItemsEl,
    "parentOp": op,
});
onDefaultMinimizedPortChanged();
initSidebarCss();
updateDynamicStyles();

// change listeners
visiblePort.onChange = onVisiblePortChange;
opacityPort.onChange = onOpacityPortChange;
defaultMinimizedPort.onChange = onDefaultMinimizedPortChanged;
minimizedOpacityPort.onChange = onMinimizedOpacityPortChanged;
undoButtonPort.onChange = onUndoButtonChange;
op.onDelete = onDelete;

// functions

function onMinimizedOpacityPortChanged()
{
    updateDynamicStyles();
}

inMinimize.onChange = updateMinimize;

function updateMinimize(header)
{
    if (!header || header.uiAttribs) header = document.querySelector(".sidebar-cables .sidebar__group-header");
    if (!header) return;

    const undoButton = document.querySelector(".sidebar-cables .sidebar__group-header .sidebar__group-header-undo");

    if (inMinimize.get())
    {
        header.classList.add("iconsidebar-chevron-up");
        header.classList.add("iconsidebar-minimizebutton");

        if (undoButton)undoButton.style.marginRight = "20px";
    }
    else
    {
        header.classList.remove("iconsidebar-chevron-up");
        header.classList.remove("iconsidebar-minimizebutton");

        if (undoButton)undoButton.style.marginRight = "initial";
    }
}

side.onChange = function ()
{
    if (side.get()) sidebarEl.classList.add("sidebar-cables-right");
    else sidebarEl.classList.remove("sidebar-cables-right");
};

function onUndoButtonChange()
{
    const header = document.querySelector(".sidebar-cables .sidebar__group-header");
    if (header)
    {
        initUndoButton(header);
    }
}

function initUndoButton(header)
{
    if (header)
    {
        const undoButton = document.querySelector(".sidebar-cables .sidebar__group-header .sidebar__group-header-undo");
        if (undoButton)
        {
            if (!undoButtonPort.get())
            {
                // header.removeChild(undoButton);
                undoButton.remove();
            }
        }
        else
        {
            if (undoButtonPort.get())
            {
                const headerUndo = document.createElement("span");
                headerUndo.classList.add("sidebar__group-header-undo");
                headerUndo.classList.add("sidebar-icon-undo");

                headerUndo.addEventListener("click", function (event)
                {
                    event.stopPropagation();
                    const reloadables = document.querySelectorAll(".sidebar-cables .sidebar__reloadable");
                    const doubleClickEvent = document.createEvent("MouseEvents");
                    doubleClickEvent.initEvent("dblclick", true, true);
                    reloadables.forEach((reloadable) =>
                    {
                        reloadable.dispatchEvent(doubleClickEvent);
                    });
                });
                header.appendChild(headerUndo);
            }
        }
    }
    updateMinimize(header);
}

function onDefaultMinimizedPortChanged()
{
    if (!openCloseBtn) { return; }
    if (defaultMinimizedPort.get())
    {
        sidebarEl.classList.add("sidebar--closed");
        if (visiblePort.get())
        {
            isOpenOut.set(false);
        }
        // openCloseBtn.textContent = BTN_TEXT_CLOSED;
    }
    else
    {
        sidebarEl.classList.remove("sidebar--closed");
        if (visiblePort.get())
        {
            isOpenOut.set(true);
        }
        // openCloseBtn.textContent = BTN_TEXT_OPEN;
    }
}

function onOpacityPortChange()
{
    const opacity = opacityPort.get();
    sidebarEl.style.opacity = opacity;
}

function onVisiblePortChange()
{
    if (visiblePort.get())
    {
        sidebarEl.style.display = "block";
        if (!sidebarEl.classList.contains("sidebar--closed"))
        {
            isOpenOut.set(true);
        }
    }
    else
    {
        sidebarEl.style.display = "none";
        isOpenOut.set(false);
    }
}

side.onChanged = function ()
{

};

/**
 * Some styles cannot be set directly inline, so a dynamic stylesheet is needed.
 * Here hover states can be set later on e.g.
 */
function updateDynamicStyles()
{
    const dynamicStyles = document.querySelectorAll("." + CSS_ELEMENT_DYNAMIC_CLASS);
    if (dynamicStyles)
    {
        dynamicStyles.forEach(function (e)
        {
            e.parentNode.removeChild(e);
        });
    }
    const newDynamicStyle = document.createElement("style");
    newDynamicStyle.classList.add(CSS_ELEMENT_DYNAMIC_CLASS);
    let cssText = ".sidebar--closed .sidebar__close-button { ";
    cssText += "opacity: " + minimizedOpacityPort.get();
    cssText += "}";
    const cssTextEl = document.createTextNode(cssText);
    newDynamicStyle.appendChild(cssTextEl);
    document.body.appendChild(newDynamicStyle);
}

function initSidebarElement()
{
    const element = document.createElement("div");
    element.classList.add(SIDEBAR_CLASS);
    element.classList.add(SIDEBAR_ID);
    const canvasWrapper = op.patch.cgl.canvas.parentElement; /* maybe this is bad outside cables!? */

    // header...
    const headerGroup = document.createElement("div");
    headerGroup.classList.add("sidebar__group");

    element.appendChild(headerGroup);
    const header = document.createElement("div");
    header.classList.add("sidebar__group-header");

    element.appendChild(header);
    const headerTitle = document.createElement("span");
    headerTitle.classList.add("sidebar__group-header-title");
    headerTitleText = document.createElement("span");
    headerTitleText.classList.add("sidebar__group-header-title-text");
    headerTitleText.innerHTML = inTitle.get();
    headerTitle.appendChild(headerTitleText);
    header.appendChild(headerTitle);

    initUndoButton(header);
    updateMinimize(header);

    headerGroup.appendChild(header);
    element.appendChild(headerGroup);
    headerGroup.addEventListener("click", onOpenCloseBtnClick);

    if (!canvasWrapper)
    {
        op.warn("[sidebar] no canvas parentelement found...");
        return;
    }
    canvasWrapper.appendChild(element);
    const items = document.createElement("div");
    items.classList.add(SIDEBAR_ITEMS_CLASS);
    element.appendChild(items);
    openCloseBtn = document.createElement("div");
    openCloseBtn.classList.add(SIDEBAR_OPEN_CLOSE_BTN_CLASS);
    openCloseBtn.addEventListener("click", onOpenCloseBtnClick);
    // openCloseBtn.textContent = BTN_TEXT_OPEN;
    element.appendChild(openCloseBtn);
    // openCloseBtnIcon = document.createElement("span");

    // openCloseBtnIcon.classList.add("sidebar__close-button-icon");
    // openCloseBtnIcon.classList.add("iconsidebar-chevron-up");

    // openCloseBtn.appendChild(openCloseBtnIcon);

    return element;
}

inTitle.onChange = function ()
{
    if (headerTitleText)headerTitleText.innerHTML = inTitle.get();
};

function setClosed(b)
{

}

function onOpenCloseBtnClick(ev)
{
    ev.stopPropagation();
    if (!sidebarEl) { op.logError("Sidebar could not be closed..."); return; }
    sidebarEl.classList.toggle("sidebar--closed");
    const btn = ev.target;
    let btnText = BTN_TEXT_OPEN;
    if (sidebarEl.classList.contains("sidebar--closed"))
    {
        btnText = BTN_TEXT_CLOSED;
        isOpenOut.set(false);
    }
    else
    {
        isOpenOut.set(true);
    }
}

function initSidebarCss()
{
    // var cssEl = document.getElementById(CSS_ELEMENT_ID);
    const cssElements = document.querySelectorAll("." + CSS_ELEMENT_CLASS);
    // remove old script tag
    if (cssElements)
    {
        cssElements.forEach(function (e)
        {
            e.parentNode.removeChild(e);
        });
    }
    const newStyle = document.createElement("style");
    newStyle.innerHTML = attachments.style_css;
    newStyle.classList.add(CSS_ELEMENT_CLASS);
    document.body.appendChild(newStyle);
}

function onDelete()
{
    removeElementFromDOM(sidebarEl);
}

function removeElementFromDOM(el)
{
    if (el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el);
}


};

Ops.Sidebar.Sidebar.prototype = new CABLES.Op();
CABLES.OPS["5a681c35-78ce-4cb3-9858-bc79c34c6819"]={f:Ops.Sidebar.Sidebar,objName:"Ops.Sidebar.Sidebar"};




// **************************************************************
// 
// Ops.Sidebar.Toggle
// 
// **************************************************************

Ops.Sidebar.Toggle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const DEFAULT_VALUE_DEFAULT = true;

// inputs
const parentPort = op.inObject("link");
const labelPort = op.inValueString("Text", "Toggle");
const inputValuePort = op.inValueBool("Input", DEFAULT_VALUE_DEFAULT);
const setDefaultValueButtonPort = op.inTriggerButton("Set Default");
const defaultValuePort = op.inValueBool("Default", DEFAULT_VALUE_DEFAULT);
defaultValuePort.setUiAttribs({ "hidePort": true, "greyout": true });
const inGreyOut = op.inBool("Grey Out", false);
const inVisible = op.inBool("Visible", true);

// outputs
const siblingsPort = op.outObject("childs");
const valuePort = op.outValue("Value", defaultValuePort.get());

// vars
const el = document.createElement("div");
el.classList.add("sidebar__item");
el.classList.add("sidebar__toggle");
if (DEFAULT_VALUE_DEFAULT) el.classList.add("sidebar__toggle--active");

el.addEventListener("click", onInputClick);
const label = document.createElement("div");
label.classList.add("sidebar__item-label");
const labelText = document.createTextNode(labelPort.get());
label.appendChild(labelText);
el.appendChild(label);
// var value = document.createElement('div');
// value.textContent = DEFAULT_VALUE_DEFAULT;
// value.classList.add('sidebar__item-value-label');
// el.appendChild(value);
// var input = document.createElement('div');
// input.classList.add('sidebar__toggle-input');
// el.appendChild(input);


const icon = document.createElement("div");
icon.classList.add("icon_toggle");
el.appendChild(icon);


const greyOut = document.createElement("div");
greyOut.classList.add("sidebar__greyout");
el.appendChild(greyOut);
greyOut.style.display = "none";

// events
parentPort.onChange = onParentChanged;
labelPort.onChange = onLabelTextChanged;
defaultValuePort.onChange = onDefaultValueChanged;
inputValuePort.onChange = onInputValuePortChanged;
op.onDelete = onDelete;
setDefaultValueButtonPort.onTriggered = setDefaultValue;
// op.toWorkNeedsParent('Ops.Sidebar.Sidebar');

function setDefaultValue()
{
    const defaultValue = inputValuePort.get();
    defaultValuePort.set(defaultValue);
    valuePort.set(defaultValue);
    op.refreshParams();
}

function onInputClick()
{
    el.classList.toggle("sidebar__toggle--active");
    if (el.classList.contains("sidebar__toggle--active"))
    {
        valuePort.set(true);
        inputValuePort.set(true);
        // value.textContent = 'true';
        icon.classList.add("icon_toggle_true");
        icon.classList.remove("icon_toggle_false");
    }
    else
    {
        icon.classList.remove("icon_toggle_true");
        icon.classList.add("icon_toggle_false");

        valuePort.set(false);
        inputValuePort.set(false);
        // value.textContent = 'false';
    }
    op.refreshParams();
}

function onInputValuePortChanged()
{
    const inputValue = inputValuePort.get();
    if (inputValue)
    {
        el.classList.add("sidebar__toggle--active");
        valuePort.set(true);
        // value.textContent = 'true';
    }
    else
    {
        el.classList.remove("sidebar__toggle--active");
        valuePort.set(false);
        // value.textContent = 'false';
    }
}

function onDefaultValueChanged()
{
    /*
    var defaultValue = defaultValuePort.get();
    if(defaultValue) {
        el.classList.add('sidebar__toggle--active');
        valuePort.set(true);
    } else {
        el.classList.remove('sidebar__toggle--active');
        valuePort.set(false);
    }
    */
}

function onLabelTextChanged()
{
    const labelText = labelPort.get();
    label.textContent = labelText;
    if (CABLES.UI) op.setTitle("Toggle: " + labelText);
}

function onParentChanged()
{
    const parent = parentPort.get();
    if (parent && parent.parentElement)
    {
        parent.parentElement.appendChild(el);
        siblingsPort.set(null);
        siblingsPort.set(parent);
    }
    else if (el.parentElement) el.parentElement.removeChild(el);
}

function showElement(el)
{
    if (el) el.style.display = "block";
}

function hideElement(el)
{
    if (el) el.style.display = "none";
}

function onDelete()
{
    removeElementFromDOM(el);
}

function removeElementFromDOM(el)
{
    if (el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el);
}

inGreyOut.onChange = function ()
{
    greyOut.style.display = inGreyOut.get() ? "block" : "none";
};

inVisible.onChange = function ()
{
    el.style.display = inVisible.get() ? "block" : "none";
};


};

Ops.Sidebar.Toggle.prototype = new CABLES.Op();
CABLES.OPS["334bcf18-e2d0-46ad-bf7a-0d36c3d29af9"]={f:Ops.Sidebar.Toggle,objName:"Ops.Sidebar.Toggle"};




// **************************************************************
// 
// Ops.WebAudio.AudioAnalyzer_v2
// 
// **************************************************************

Ops.WebAudio.AudioAnalyzer_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const MAX_DBFS_RANGE_24_BIT = -144;
const MAX_DBFS_RANGE_26_BIT = -96;

let audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

const inTrigger = op.inTrigger("Trigger In");

const analyser = audioCtx.createAnalyser();
analyser.smoothingTimeConstant = 0.3;
analyser.fftSize = 256;

const FFT_BUFFER_SIZES = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

const audioIn = op.inObject("Audio In", null, "audioNode");
const inFFTSize = op.inDropDown("FFT size", FFT_BUFFER_SIZES, 256);
const inSmoothing = op.inFloatSlider("Smoothing", 0.3);

const inRangeMin = op.inFloat("Min", -90);
const inRangeMax = op.inFloat("Max", 0);

op.setPortGroup("Inputs", [inTrigger, audioIn]);
op.setPortGroup("FFT Options", [inFFTSize, inSmoothing]);
op.setPortGroup("Range (in dBFS)", [inRangeMin, inRangeMax]);
const outTrigger = op.outTrigger("Trigger Out");
const audioOut = op.outObject("Audio Out", null, "audioNode");
const fftOut = op.outArray("FFT Array");
const ampOut = op.outArray("Waveform Array");
const frequencyOut = op.outArray("Frequencies by Index Array");
const fftLength = op.outNumber("Array Length");
const avgVolumePeak = op.outNumber("Average Volume");
const avgVolumeAmp = op.outNumber("Average Volume Time-Domain");
const avgVolumeRMS = op.outNumber("RMS Volume");
let updating = false;

let fftBufferLength = analyser.frequencyBinCount;
let fftDataArray = new Uint8Array(fftBufferLength);
let ampDataArray = new Uint8Array(fftBufferLength);
let frequencyArray = [];
frequencyArray.length = fftBufferLength;
let oldAudioIn = null;

audioIn.onChange = () =>
{
    if (audioIn.get())
    {
        const audioNode = audioIn.get();
        if (audioNode.connect)
        {
            audioNode.connect(analyser);
            audioOut.set(analyser);
        }
    }
    else
    {
        if (oldAudioIn)
        {
            if (oldAudioIn.disconnect) oldAudioIn.disconnect(analyser);
            audioOut.set(null);
        }
    }

    oldAudioIn = audioIn.get();
};

function updateAnalyser()
{
    try
    {
        const fftSize = Number(inFFTSize.get());
        analyser.smoothingTimeConstant = clamp(inSmoothing.get(), 0.0, 1.0);
        analyser.fftSize = fftSize;
        const minDecibels = clamp(inRangeMin.get(), MAX_DBFS_RANGE_24_BIT, -0.0001);
        const maxDecibels = Math.max(inRangeMax.get(), analyser.minDecibels + 0.0001);
        analyser.minDecibels = minDecibels;
        analyser.maxDecibels = maxDecibels;

        if (minDecibels < MAX_DBFS_RANGE_24_BIT)
        {
            op.setUiError("maxDbRangeMin",
                "Your minimum is below the lowest possible dBFS value: "
                + MAX_DBFS_RANGE_24_BIT
                + "dBFS. To make sure your analyser data is correct, try increasing the minimum.",
                1
            );
        }
        else
        {
            op.setUiError("maxDbRangeMin", null);
        }

        if (maxDecibels > 0)
        {
            op.setUiError("maxDbRangeMax", "Your maximum is above 0 dBFS. As digital signals only go to 0 dBFS and not above, you should use 0 as your maximum.", 1);
        }
        else
        {
            op.setUiError("maxDbRangeMax", null);
        }

        if (FFT_BUFFER_SIZES.indexOf(fftSize) >= 6)
        {
            op.setUiError("highFftSize", "Please be careful with high FFT sizes as they can slow down rendering. Check the profiler to see if performance is impacted.", 1);
        }
        else
        {
            op.setUiError("highFftSize", null);
        }
    }
    catch (e)
    {
        op.log(e);
    }
}

inFFTSize.onChange = inSmoothing.onChange
= inRangeMin.onChange = inRangeMax.onChange = () =>
    {
        if (inTrigger.isLinked()) updating = true;
        else updateAnalyser();
    };

inTrigger.onTriggered = function ()
{
    if (updating)
    {
        updateAnalyser();
        updating = false;
    }

    if (fftBufferLength != analyser.frequencyBinCount)
    {
        fftBufferLength = analyser.frequencyBinCount;
        fftDataArray = new Uint8Array(fftBufferLength);
        ampDataArray = new Uint8Array(fftBufferLength);

        frequencyArray = [];
        frequencyArray.length = fftBufferLength;

        for (let index = 0; index < fftBufferLength; index += 1)
        {
            frequencyArray[index] = Math.round(index * audioCtx.sampleRate / (analyser.fftSize * 2));
        }

        frequencyOut.set(null);
        frequencyOut.set(frequencyArray);
    }

    if (!fftDataArray) return;
    if (!ampDataArray) return;

    const fftSize = Number(inFFTSize.get());

    try
    {
        analyser.getByteFrequencyData(fftDataArray);
        analyser.getByteTimeDomainData(ampDataArray);

        let values = 0;
        let peakValues = 0;
        let ampPeakValues = 0;
        for (let i = 0; i < analyser.frequencyBinCount; i++)
        {
            values += ampDataArray[i] * ampDataArray[i];
            peakValues += fftDataArray[i];
            ampPeakValues += ampDataArray[i];
        }

        const peakAverage = peakValues / analyser.frequencyBinCount;
        const peakAmpAverage = ampPeakValues / analyser.frequencyBinCount;

        avgVolumePeak.set(peakAverage / 128);
        avgVolumeAmp.set(peakAmpAverage / 256);

        let rms = Math.sqrt(values / analyser.frequencyBinCount);
        rms = Math.max(rms, rms * inSmoothing.get());
        avgVolumeRMS.set(rms / 256);
    }
    catch (e) { op.log(e); }

    fftOut.set(null);
    fftOut.set(fftDataArray);

    ampOut.set(null);
    ampOut.set(ampDataArray);

    fftLength.set(fftDataArray.length);
    outTrigger.trigger();
};


};

Ops.WebAudio.AudioAnalyzer_v2.prototype = new CABLES.Op();
CABLES.OPS["ff9bf46c-676f-4aa1-95bf-5595a6813ed7"]={f:Ops.WebAudio.AudioAnalyzer_v2,objName:"Ops.WebAudio.AudioAnalyzer_v2"};




// **************************************************************
// 
// Ops.Math.SmoothStep
// 
// **************************************************************

Ops.Math.SmoothStep = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    result = op.outValue("result"),
    number = op.inValueFloat("number", 0),
    min = op.inValueFloat("min", 0),
    max = op.inValueFloat("max", 1);

number.onChange = max.onChange = min.onChange = exec;
exec();

function exec()
{
    // todo negative min ?

    let x = Math.max(0, Math.min(1, (number.get() - min.get()) / (max.get() - min.get())));
    result.set(x * x * (3 - 2 * x)); // smoothstep
}


};

Ops.Math.SmoothStep.prototype = new CABLES.Op();
CABLES.OPS["2197ee92-2777-42c5-83d4-6ad65a2c4cf3"]={f:Ops.Math.SmoothStep,objName:"Ops.Math.SmoothStep"};




// **************************************************************
// 
// Ops.Array.ArrayUnpack3
// 
// **************************************************************

Ops.Array.ArrayUnpack3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inArray1 = op.inArray("Array in xyz"),
    outArray1 = op.outArray("Array 1 out"),
    outArray2 = op.outArray("Array 2 out"),
    outArray3 = op.outArray("Array 3 out"),
    outArrayLength = op.outNumber("Array lengths");

let showingError = false;

const arr1 = [];
const arr2 = [];
const arr3 = [];

inArray1.onChange = update;

function update()
{
    let array1 = inArray1.get();

    if (!array1)
    {
        outArray1.set(null);
        return;
    }

    if (array1.length % 3 !== 0)
    {
        if (!showingError)
        {
            op.uiAttr({ "error": "Arrays length not divisible by 3 !" });
            outArrayLength.set(0);
            showingError = true;
        }
        return;
    }

    if (showingError)
    {
        showingError = false;
        op.uiAttr({ "error": null });
    }

    arr1.length = Math.floor(array1.length / 3);
    arr2.length = Math.floor(array1.length / 3);
    arr3.length = Math.floor(array1.length / 3);

    for (let i = 0; i < array1.length / 3; i++)
    {
        arr1[i] = array1[i * 3];
        arr2[i] = array1[i * 3 + 1];
        arr3[i] = array1[i * 3 + 2];
    }

    outArray1.set(null);
    outArray2.set(null);
    outArray3.set(null);
    outArray1.set(arr1);
    outArray2.set(arr2);
    outArray3.set(arr3);
    outArrayLength.set(arr1.length);
}


};

Ops.Array.ArrayUnpack3.prototype = new CABLES.Op();
CABLES.OPS["fa671f66-6957-41e6-ac35-d615b7c29285"]={f:Ops.Array.ArrayUnpack3,objName:"Ops.Array.ArrayUnpack3"};




// **************************************************************
// 
// Ops.Gl.Meshes.TextMesh_v2
// 
// **************************************************************

Ops.Gl.Meshes.TextMesh_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"textmesh_frag":"UNI sampler2D tex;\n#ifdef DO_MULTEX\n    UNI sampler2D texMul;\n#endif\n#ifdef DO_MULTEX_MASK\n    UNI sampler2D texMulMask;\n#endif\nIN vec2 texCoord;\nIN vec2 texPos;\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\n\nvoid main()\n{\n    vec4 col=texture(tex,texCoord);\n    col.a=col.r;\n    col.r*=r;\n    col.g*=g;\n    col.b*=b;\n    col*=a;\n\n    if(col.a==0.0)discard;\n\n    #ifdef DO_MULTEX\n        col*=texture(texMul,texPos);\n    #endif\n\n    #ifdef DO_MULTEX_MASK\n        col*=texture(texMulMask,texPos).r;\n    #endif\n\n    outColor=col;\n}","textmesh_vert":"UNI sampler2D tex;\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\nUNI float scale;\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN mat4 instMat;\nIN vec2 attrTexOffsets;\nIN vec2 attrTexSize;\nIN vec2 attrTexPos;\nOUT vec2 texPos;\n\nOUT vec2 texCoord;\n\nvoid main()\n{\n    texCoord=(attrTexCoord*(attrTexSize)) + attrTexOffsets;\n    mat4 instMVMat=instMat;\n    instMVMat[3][0]*=scale;\n\n    texPos=attrTexPos;\n\n    vec4 vert=vec4( vPosition.x*(attrTexSize.x/attrTexSize.y)*scale,vPosition.y*scale,vPosition.z*scale, 1. );\n\n    mat4 mvMatrix=viewMatrix * modelMatrix * instMVMat;\n\n    gl_Position = projMatrix * mvMatrix * vert;\n}\n",};
const
    render = op.inTrigger("Render"),
    str = op.inString("Text", "cables"),
    scale = op.inValueFloat("Scale", 1),
    inFont = op.inString("Font", "Arial"),
    align = op.inValueSelect("align", ["left", "center", "right"], "center"),
    valign = op.inValueSelect("vertical align", ["Top", "Middle", "Bottom"], "Middle"),
    lineHeight = op.inValueFloat("Line Height", 1),
    letterSpace = op.inValueFloat("Letter Spacing"),

    tfilter = op.inSwitch("filter", ["nearest", "linear", "mipmap"], "mipmap"),
    aniso = op.inSwitch("Anisotropic", [0, 1, 2, 4, 8, 16], 0),

    inMulTex = op.inTexture("Texture Color"),
    inMulTexMask = op.inTexture("Texture Mask"),
    next = op.outTrigger("Next"),
    textureOut = op.outTexture("texture"),
    outLines = op.outNumber("Total Lines", 0),
    outWidth = op.outNumber("Width", 0),
    loaded = op.outBoolNum("Font Available", 0);

const cgl = op.patch.cgl;

op.setPortGroup("Masking", [inMulTex, inMulTexMask]);

const textureSize = 1024;
let fontLoaded = false;
let needUpdate = true;

align.onChange =
    str.onChange =
    lineHeight.onChange = generateMeshLater;

function generateMeshLater()
{
    needUpdate = true;
}

let canvasid = null;
CABLES.OpTextureMeshCanvas = {};
let valignMode = 0;

const geom = null;
let mesh = null;

let createMesh = true;
let createTexture = true;

aniso.onChange =
tfilter.onChange = () =>
{
    getFont().texture = null;
    createTexture = true;
};

inMulTexMask.onChange =
inMulTex.onChange = function ()
{
    shader.toggleDefine("DO_MULTEX", inMulTex.get());
    shader.toggleDefine("DO_MULTEX_MASK", inMulTexMask.get());
};

textureOut.set(null);
inFont.onChange = function ()
{
    createTexture = true;
    createMesh = true;
    checkFont();
};

op.patch.on("fontLoaded", (fontName) =>
{
    if (fontName == inFont.get())
    {
        createTexture = true;
        createMesh = true;
    }
});

function checkFont()
{
    const oldFontLoaded = fontLoaded;
    try
    {
        fontLoaded = document.fonts.check("20px \"" + inFont.get() + "\"");
    }
    catch (ex)
    {
        op.logError(ex);
    }

    if (!oldFontLoaded && fontLoaded)
    {
        loaded.set(true);
        createTexture = true;
        createMesh = true;
    }

    if (!fontLoaded) setTimeout(checkFont, 250);
}

valign.onChange = function ()
{
    if (valign.get() == "Middle")valignMode = 0;
    else if (valign.get() == "Top")valignMode = 1;
    else if (valign.get() == "Bottom")valignMode = 2;
};

function getFont()
{
    canvasid = "" + inFont.get();
    if (CABLES.OpTextureMeshCanvas.hasOwnProperty(canvasid))
        return CABLES.OpTextureMeshCanvas[canvasid];

    const fontImage = document.createElement("canvas");
    fontImage.dataset.font = inFont.get();
    fontImage.id = "texturetext_" + CABLES.generateUUID();
    fontImage.style.display = "none";
    const body = document.getElementsByTagName("body")[0];
    body.appendChild(fontImage);
    const _ctx = fontImage.getContext("2d");
    CABLES.OpTextureMeshCanvas[canvasid] =
        {
            "ctx": _ctx,
            "canvas": fontImage,
            "chars": {},
            "characters": "",
            "fontSize": 320
        };
    return CABLES.OpTextureMeshCanvas[canvasid];
}

op.onDelete = function ()
{
    if (canvasid && CABLES.OpTextureMeshCanvas[canvasid])
        CABLES.OpTextureMeshCanvas[canvasid].canvas.remove();
};

const shader = new CGL.Shader(cgl, "TextMesh");
shader.setSource(attachments.textmesh_vert, attachments.textmesh_frag);
const uniTex = new CGL.Uniform(shader, "t", "tex", 0);
const uniTexMul = new CGL.Uniform(shader, "t", "texMul", 1);
const uniTexMulMask = new CGL.Uniform(shader, "t", "texMulMask", 2);
const uniScale = new CGL.Uniform(shader, "f", "scale", scale);

const
    r = op.inValueSlider("r", 1),
    g = op.inValueSlider("g", 1),
    b = op.inValueSlider("b", 1),
    a = op.inValueSlider("a", 1),
    runiform = new CGL.Uniform(shader, "f", "r", r),
    guniform = new CGL.Uniform(shader, "f", "g", g),
    buniform = new CGL.Uniform(shader, "f", "b", b),
    auniform = new CGL.Uniform(shader, "f", "a", a);
r.setUiAttribs({ "colorPick": true });

op.setPortGroup("Display", [scale, inFont]);
op.setPortGroup("Alignment", [align, valign]);
op.setPortGroup("Color", [r, g, b, a]);

let height = 0;
const vec = vec3.create();
let lastTextureChange = -1;
let disabled = false;

render.onTriggered = function ()
{
    if (needUpdate)
    {
        generateMesh();
        needUpdate = false;
    }
    const font = getFont();
    if (font.lastChange != lastTextureChange)
    {
        createMesh = true;
        lastTextureChange = font.lastChange;
    }

    if (createTexture) generateTexture();
    if (createMesh)generateMesh();

    if (mesh && mesh.numInstances > 0)
    {
        cgl.pushBlendMode(CGL.BLEND_NORMAL, true);
        cgl.pushShader(shader);
        cgl.setTexture(0, textureOut.get().tex);

        const mulTex = inMulTex.get();
        if (mulTex)cgl.setTexture(1, mulTex.tex);

        const mulTexMask = inMulTexMask.get();
        if (mulTexMask)cgl.setTexture(2, mulTexMask.tex);

        if (valignMode === 2) vec3.set(vec, 0, height, 0);
        else if (valignMode === 1) vec3.set(vec, 0, 0, 0);
        else if (valignMode === 0) vec3.set(vec, 0, height / 2, 0);

        vec[1] -= lineHeight.get();
        cgl.pushModelMatrix();
        mat4.translate(cgl.mMatrix, cgl.mMatrix, vec);
        if (!disabled)mesh.render(cgl.getShader());

        cgl.popModelMatrix();

        cgl.setTexture(0, null);
        cgl.popShader();
        cgl.popBlendMode();
    }

    next.trigger();
};

letterSpace.onChange = function ()
{
    createMesh = true;
};

function generateMesh()
{
    const theString = String(str.get() + "");
    if (!textureOut.get()) return;

    const font = getFont();
    if (!font.geom)
    {
        font.geom = new CGL.Geometry("textmesh");

        font.geom.vertices = [
            1.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            1.0, 0.0, 0.0,
            0.0, 0.0, 0.0
        ];

        font.geom.texCoords = new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);

        font.geom.verticesIndices = [
            0, 1, 2,
            2, 1, 3
        ];
    }

    if (!mesh)mesh = new CGL.Mesh(cgl, font.geom);

    const strings = (theString).split("\n");
    outLines.set(strings.length);

    const transformations = [];
    const tcOffsets = [];// new Float32Array(str.get().length*2);
    const tcSize = [];// new Float32Array(str.get().length*2);
    const texPos = [];
    let charCounter = 0;
    createTexture = false;
    const m = mat4.create();

    let maxWidth = 0;

    for (let s = 0; s < strings.length; s++)
    {
        const txt = strings[s];
        const numChars = txt.length;

        let pos = 0;
        let offX = 0;
        let width = 0;

        for (let i = 0; i < numChars; i++)
        {
            const chStr = txt.substring(i, i + 1);
            const char = font.chars[String(chStr)];
            if (char)
            {
                width += (char.texCoordWidth / char.texCoordHeight);
                width += letterSpace.get();
            }
        }

        width -= letterSpace.get();

        height = 0;

        if (align.get() == "left") offX = 0;
        else if (align.get() == "right") offX = width;
        else if (align.get() == "center") offX = width / 2;

        height = (s + 1) * lineHeight.get();

        for (let i = 0; i < numChars; i++)
        {
            const chStr = txt.substring(i, i + 1);
            const char = font.chars[String(chStr)];

            if (!char)
            {
                createTexture = true;
                return;
            }
            else
            {
                texPos.push(pos / width * 0.99 + 0.005, (1.0 - (s / (strings.length - 1))) * 0.99 + 0.005);
                tcOffsets.push(char.texCoordX, 1 - char.texCoordY - char.texCoordHeight);
                tcSize.push(char.texCoordWidth, char.texCoordHeight);

                mat4.identity(m);
                mat4.translate(m, m, [pos - offX, 0 - s * lineHeight.get(), 0]);

                pos += (char.texCoordWidth / char.texCoordHeight) + letterSpace.get();
                maxWidth = Math.max(maxWidth, pos - offX);

                transformations.push(Array.prototype.slice.call(m));

                charCounter++;
            }
        }
    }

    const transMats = [].concat.apply([], transformations);

    disabled = false;
    if (transMats.length == 0)disabled = true;

    mesh.numInstances = transMats.length / 16;

    if (mesh.numInstances == 0)
    {
        disabled = true;
        return;
    }

    outWidth.set(maxWidth * scale.get());
    mesh.setAttribute("instMat", new Float32Array(transMats), 16, { "instanced": true });
    mesh.setAttribute("attrTexOffsets", new Float32Array(tcOffsets), 2, { "instanced": true });
    mesh.setAttribute("attrTexSize", new Float32Array(tcSize), 2, { "instanced": true });
    mesh.setAttribute("attrTexPos", new Float32Array(texPos), 2, { "instanced": true });

    createMesh = false;

    if (createTexture) generateTexture();
}

function printChars(fontSize, simulate)
{
    const font = getFont();
    if (!simulate) font.chars = {};

    const ctx = font.ctx;

    ctx.font = fontSize + "px " + inFont.get();
    ctx.textAlign = "left";

    let posy = 0;
    let posx = 0;
    const lineHeight = fontSize * 1.4;
    const result =
        {
            "fits": true
        };

    for (let i = 0; i < font.characters.length; i++)
    {
        const chStr = String(font.characters.substring(i, i + 1));
        const chWidth = (ctx.measureText(chStr).width);

        if (posx + chWidth >= textureSize)
        {
            posy += lineHeight + 2;
            posx = 0;
        }

        if (!simulate)
        {
            font.chars[chStr] =
                {
                    "str": chStr,
                    "texCoordX": posx / textureSize,
                    "texCoordY": posy / textureSize,
                    "texCoordWidth": chWidth / textureSize,
                    "texCoordHeight": lineHeight / textureSize,
                };

            ctx.fillText(chStr, posx, posy + fontSize);
        }

        posx += chWidth + 12;
    }

    if (posy > textureSize - lineHeight)
    {
        result.fits = false;
    }

    result.spaceLeft = textureSize - posy;

    return result;
}

function generateTexture()
{
    let filter = CGL.Texture.FILTER_LINEAR;
    if (tfilter.get() == "nearest") filter = CGL.Texture.FILTER_NEAREST;
    if (tfilter.get() == "mipmap") filter = CGL.Texture.FILTER_MIPMAP;

    const font = getFont();
    let string = String(str.get());
    if (string == null || string == undefined)string = "";
    for (let i = 0; i < string.length; i++)
    {
        const ch = string.substring(i, i + 1);
        if (font.characters.indexOf(ch) == -1)
        {
            font.characters += ch;
            createTexture = true;
        }
    }

    const ctx = font.ctx;
    font.canvas.width = font.canvas.height = textureSize;

    if (!font.texture)
        font.texture = CGL.Texture.createFromImage(cgl, font.canvas,
            {
                "filter": filter,
                "anisotropic": parseFloat(aniso.get())
            });

    font.texture.setSize(textureSize, textureSize);

    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, textureSize, textureSize);
    ctx.fillStyle = "rgba(255,255,255,255)";

    let fontSize = font.fontSize + 40;
    let simu = printChars(fontSize, true);

    while (!simu.fits)
    {
        fontSize -= 5;
        simu = printChars(fontSize, true);
    }

    printChars(fontSize, false);

    ctx.restore();

    font.texture.initTexture(font.canvas, filter);
    font.texture.unpackAlpha = true;
    textureOut.set(font.texture);

    font.lastChange = CABLES.now();

    createMesh = true;
    createTexture = false;
}


};

Ops.Gl.Meshes.TextMesh_v2.prototype = new CABLES.Op();
CABLES.OPS["2390f6b3-2122-412e-8c8d-5c2f574e8bd1"]={f:Ops.Gl.Meshes.TextMesh_v2,objName:"Ops.Gl.Meshes.TextMesh_v2"};




// **************************************************************
// 
// Ops.Gl.Meshes.Line
// 
// **************************************************************

Ops.Gl.Meshes.Line = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render = op.inTrigger("Render"),
    x1 = op.inValue("X 1"),
    y1 = op.inValue("Y 1"),
    z1 = op.inValue("Z 1"),
    x2 = op.inValue("X 2", 1),
    y2 = op.inValue("Y 2", 1),
    z2 = op.inValue("Z 2", 1),
    next = op.outTrigger("Next");

const cgl = op.patch.cgl;

const geom = new CGL.Geometry("simplespline");
geom.vertices = [x1.get(), y1.get(), z1.get(), x2.get(), y2.get(), x2.get()];
const mesh = new CGL.Mesh(cgl, geom, cgl.gl.LINES);

let changed = true;

x1.onChange = function () { geom.vertices[0] = x1.get(); changed = true; };
y1.onChange = function () { geom.vertices[1] = y1.get(); changed = true; };
z1.onChange = function () { geom.vertices[2] = z1.get(); changed = true; };

x2.onChange = function () { geom.vertices[3] = x2.get(); changed = true; };
y2.onChange = function () { geom.vertices[4] = y2.get(); changed = true; };
z2.onChange = function () { geom.vertices[5] = z2.get(); changed = true; };

render.onTriggered = function ()
{
    if (changed)
    {
        mesh.updateVertices(geom);
        changed = false;
    }

    let shader = cgl.getShader();
    mesh.render(shader);
    next.trigger();
};


};

Ops.Gl.Meshes.Line.prototype = new CABLES.Op();
CABLES.OPS["c6a0d570-a0ac-4655-b17d-74d0870b0799"]={f:Ops.Gl.Meshes.Line,objName:"Ops.Gl.Meshes.Line"};




// **************************************************************
// 
// Ops.Gl.InteractiveRectangle
// 
// **************************************************************

Ops.Gl.InteractiveRectangle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

const render = op.inTrigger("render");
const trigger = op.outTrigger("trigger");

const width = op.inValue("width", 1);
const height = op.inValue("height", 1);

const inId = op.inValueString("id");
const classPort = op.inValueString("Class");

const pivotX = op.inValueSelect("pivot x", ["center", "left", "right"]);
const pivotY = op.inValueSelect("pivot y", ["center", "top", "bottom"]);

const axis = op.inValueSelect("axis", ["xy", "xz"]);

const isInteractive = op.inValueBool("Is Interactive", true);
const renderRect = op.inValueBool("Render Rectangle", true);
const divVisible = op.inValueBool("Show Boundings", true);
const cursorPort = op.inValueSelect("Cursor", ["auto", "crosshair", "pointer", "Hand", "move", "n-resize", "ne-resize", "e-resize", "se-resize", "s-resize", "sw-resize", "w-resize", "nw-resize", "text", "wait", "help", "none"], "pointer");
const active = op.inValueBool("Render", true);


const geomOut = op.outObject("geometry");
geomOut.ignoreValueSerialize = true;

const mouseOver = op.outValue("Pointer Hover", false);
const mouseDown = op.outValue("Pointer Down", false);
const outX = op.outValue("Pointer X");
const outY = op.outValue("Pointer Y");

const outTop = op.outValue("Top");
const outLeft = op.outValue("Left");
const outRight = op.outValue("Right");
const outBottom = op.outValue("Bottom");

const mouseClick = op.outTrigger("Left Click");

const elementPort = op.outObject("Dom Element");

active.setUiAttribs({ "title": "Active" });

const cgl = op.patch.cgl;
axis.set("xy");
pivotX.set("center");
pivotY.set("center");

const geom = new CGL.Geometry(op.name);
let mesh = null;
let div = null;
const m = mat4.create();
const trans = mat4.create();
const pos = vec3.create();
const divAlign = vec3.create();
const divAlignSize = vec3.create();

axis.onChange = rebuild;
pivotX.onChange = rebuild;
pivotY.onChange = rebuild;
width.onChange = rebuild;
height.onChange = rebuild;
cursorPort.onChange = updateCursor;
rebuild();


const modelMatrix = mat4.create();
const identViewMatrix = mat4.create();
const zeroVec3 = vec3.create();

render.onTriggered = function ()
{
    if (!div)
    {
        setUpDiv();
        addListeners();
        updateDivVisibility();
        updateIsInteractive();
    }
    updateDivSize();

    if (active.get() && renderRect.get() && mesh) mesh.render(cgl.getShader());

    trigger.trigger();
};

function rebuild()
{
    let w = width.get();
    let h = height.get();
    let x = 0;
    let y = 0;

    if (typeof w == "string")w = parseFloat(w);
    if (typeof h == "string")h = parseFloat(h);

    if (pivotX.get() == "center")
    {
        x = 0;
        divAlign[0] = -w / 2;
    }
    if (pivotX.get() == "right")
    {
        x = -w / 2;
    }
    if (pivotX.get() == "left")
    {
        x = w / 2;
    }

    if (pivotY.get() == "center")
    {
        y = 0;
        divAlign[1] = -h / 2;
    }
    if (pivotY.get() == "top") y = -h / 2;
    if (pivotY.get() == "bottom") y = +h / 2;

    const verts = [];
    const tc = [];
    const norms = [];
    const indices = [];

    const numRows = 1;
    const numColumns = 1;

    const stepColumn = w / numColumns;
    const stepRow = h / numRows;

    let c, r;

    for (r = 0; r <= numRows; r++)
    {
        for (c = 0; c <= numColumns; c++)
        {
            verts.push(c * stepColumn - width.get() / 2 + x);
            if (axis.get() == "xz") verts.push(0.0);
            verts.push(r * stepRow - height.get() / 2 + y);
            if (axis.get() == "xy") verts.push(0.0);

            tc.push(c / numColumns);
            tc.push(1.0 - r / numRows);

            if (axis.get() == "xz")
            {
                norms.push(0);
                norms.push(1);
                norms.push(0);
            }

            if (axis.get() == "xy")
            {
                norms.push(0);
                norms.push(0);
                norms.push(-1);
            }
        }
    }

    for (c = 0; c < numColumns; c++)
    {
        for (r = 0; r < numRows; r++)
        {
            const ind = c + (numColumns + 1) * r;
            const v1 = ind;
            const v2 = ind + 1;
            const v3 = ind + numColumns + 1;
            const v4 = ind + 1 + numColumns + 1;

            indices.push(v1);
            indices.push(v3);
            indices.push(v2);

            indices.push(v2);
            indices.push(v3);
            indices.push(v4);
        }
    }

    geom.clear();
    geom.vertices = verts;
    geom.texCoords = tc;
    geom.verticesIndices = indices;
    geom.vertexNormals = norms;

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);

    geomOut.set(null);
    geomOut.set(geom);
}

let divX = 0;
let divY = 0;
let divWidth = 0;
let divHeight = 0;

const mMatrix = mat4.create();
divVisible.onChange = updateDivVisibility;
inId.onChange = updateId;
classPort.onChange = updateClassNames;

function updateDivVisibility()
{
    if (div)
    {
        if (divVisible.get()) div.style.border = "1px solid red";
        else div.style.border = "none";
    }
}

function updateCursor()
{
    if (div)
    {
        div.style.cursor = cursorPort.get();
    }
}

function updateId()
{
    if (div)
    {
        div.setAttribute("id", inId.get());
    }
}

function updateDivSize()
{
    // var vp=cgl.getViewPort();


    mat4.multiply(mMatrix, cgl.vMatrix, cgl.mMatrix);
    vec3.transformMat4(pos, divAlign, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);


    const x1 = (trans[0] * cgl.canvasWidth / 2) + cgl.canvasWidth / 2;
    const y1 = (trans[1] * cgl.canvasHeight / 2) + cgl.canvasHeight / 2;


    divAlignSize[0] = divAlign[0] + width.get();
    divAlignSize[1] = divAlign[1];

    vec3.transformMat4(pos, divAlignSize, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);

    const x2 = ((trans[0] * cgl.canvasWidth / 2) + cgl.canvasWidth / 2);
    const y2 = ((trans[1] * cgl.canvasHeight / 2) + cgl.canvasHeight / 2);


    divAlignSize[0] = divAlign[0];
    divAlignSize[1] = divAlign[1] + height.get();

    vec3.transformMat4(pos, divAlignSize, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);

    const x3 = ((trans[0] * cgl.canvasWidth / 2) + cgl.canvasWidth / 2);
    const y3 = ((trans[1] * cgl.canvasHeight / 2) + cgl.canvasHeight / 2);


    divAlignSize[0] = divAlign[0] + width.get();
    divAlignSize[1] = divAlign[1] + height.get();

    vec3.transformMat4(pos, divAlignSize, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);

    const x4 = ((trans[0] * cgl.canvasWidth / 2) + cgl.canvasWidth / 2);
    const y4 = ((trans[1] * cgl.canvasHeight / 2) + cgl.canvasHeight / 2);


    divX = Math.min(x1, x2, x3, x4);
    divY = Math.min(cgl.canvasHeight - y1, cgl.canvasHeight - y2, cgl.canvasHeight - y3, cgl.canvasHeight - y4);

    const xb = Math.max(x1, x2, x3, x4);
    const yb = Math.max(cgl.canvasHeight - y1, cgl.canvasHeight - y2, cgl.canvasHeight - y3, cgl.canvasHeight - y4);

    outTop.set(divY);
    outLeft.set(divX);
    outRight.set(xb);
    outBottom.set(yb);

    divWidth = Math.abs(xb - divX);
    divHeight = Math.abs(yb - divY);


    divX /= op.patch.cgl.pixelDensity;
    divY /= op.patch.cgl.pixelDensity;
    divWidth /= op.patch.cgl.pixelDensity;
    divHeight /= op.patch.cgl.pixelDensity;

    // div.style.left=divX+'px';
    // div.style.top=divY+'px';
    // div.style.width=divWidth+'px';
    // div.style.height=divHeight+'px';

    const divXpx = divX + "px";
    const divYpx = divY + "px";
    const divWidthPx = divWidth + "px";
    const divHeightPx = divHeight + "px";
    if (divXpx != div.style.left) div.style.left = divXpx;
    if (divYpx != div.style.top) div.style.top = divYpx;
    if (div.style.width != divWidthPx) div.style.width = divWidthPx;
    if (div.style.height != divHeightPx) div.style.height = divHeightPx;
}

function updateClassNames()
{
    if (div)
    {
        div.className = classPort.get();
    }
}

op.onDelete = function ()
{
    if (div)div.remove();
};

function setUpDiv()
{
    if (!div)
    {
        div = document.createElement("div");
        div.dataset.op = op.id;
        div.oncontextmenu = function (e)
        {
            e.preventDefault();
        };

        div.style.padding = "0px";
        div.style.position = "absolute";
        div.style["box-sizing"] = "border-box";
        div.style.border = "1px solid red";
        // div.style['border-left']="1px solid blue";
        // div.style['border-top']="1px solid green";
        div.style["z-index"] = "1000";

        div.style["-webkit-user-select"] = "none";
        div.style["user-select"] = "none";
        div.style["-webkit-tap-highlight-color"] = "rgba(0,0,0,0)";
        div.style["-webkit-touch-callout"] = "none";

        const canvas = op.patch.cgl.canvas.parentElement;
        canvas.appendChild(div);
        updateCursor();
        updateIsInteractive();
        updateId();
        updateClassNames();
    }
    updateDivSize();
    elementPort.set(div);
}

let listenerElement = null;

function onMouseMove(e)
{
    const offsetX = -width.get() / 2;
    const offsetY = -height.get() / 2;

    outX.set(Math.max(0.0, Math.min(1.0, e.offsetX / divWidth)));
    outY.set(Math.max(0.0, Math.min(1.0, 1.0 - e.offsetY / divHeight)));
}

function onMouseLeave(e)
{
    mouseDown.set(false);
    mouseOver.set(false);
}

function onMouseEnter(e)
{
    mouseOver.set(true);
}

function onMouseDown(e)
{
    mouseDown.set(true);
}

function onMouseUp(e)
{
    mouseDown.set(false);
}

function onmouseclick(e)
{
    mouseClick.trigger();
}

function onTouchMove(e)
{
    const targetEle = document.elementFromPoint(e.targetTouches[0].pageX, e.targetTouches[0].pageY);

    if (targetEle == div)
    {
        mouseOver.set(true);
        if (e.touches && e.touches.length > 0)
        {
            const rect = div.getBoundingClientRect(); // e.target
            const x = e.targetTouches[0].pageX - rect.left;
            const y = e.targetTouches[0].pageY - rect.top;

            const touch = e.touches[0];

            outX.set(Math.max(0.0, Math.min(1.0, x / divWidth)));
            outY.set(Math.max(0.0, Math.min(1.0, 1.0 - y / divHeight)));

            onMouseMove(touch);
        }
    }
    else
    {
        mouseOver.set(false);
    }
}


active.onChange = updateActiveRender;
function updateActiveRender()
{
    if (active.get())
    {
        addListeners();
        if (div) div.style.display = "block";
    }
    else
    {
        removeListeners();
        if (div) div.style.display = "none";
    }
}

isInteractive.onChange = updateIsInteractive;
function updateIsInteractive()
{
    if (isInteractive.get())
    {
        addListeners();
        if (div)div.style["pointer-events"] = "initial";
    }
    else
    {
        removeListeners();
        mouseDown.set(false);
        mouseOver.set(false);
        if (div)div.style["pointer-events"] = "none";
    }
}

function removeListeners()
{
    if (listenerElement)
    {
        document.removeEventListener("touchmove", onTouchMove);
        listenerElement.removeEventListener("touchend", onMouseUp);
        listenerElement.removeEventListener("touchstart", onMouseDown);

        listenerElement.removeEventListener("click", onmouseclick);
        listenerElement.removeEventListener("mousemove", onMouseMove);
        listenerElement.removeEventListener("mouseleave", onMouseLeave);
        listenerElement.removeEventListener("mousedown", onMouseDown);
        listenerElement.removeEventListener("mouseup", onMouseUp);
        listenerElement.removeEventListener("mouseenter", onMouseEnter);
        // listenerElement.removeEventListener('contextmenu', onClickRight);
        listenerElement = null;
    }
}

function addListeners()
{
    if (listenerElement)removeListeners();

    listenerElement = div;

    if (listenerElement)
    {
        document.addEventListener("touchmove", onTouchMove);
        listenerElement.addEventListener("touchend", onMouseUp);
        listenerElement.addEventListener("touchstart", onMouseDown);

        listenerElement.addEventListener("click", onmouseclick);
        listenerElement.addEventListener("mousemove", onMouseMove);
        listenerElement.addEventListener("mouseleave", onMouseLeave);
        listenerElement.addEventListener("mousedown", onMouseDown);
        listenerElement.addEventListener("mouseup", onMouseUp);
        listenerElement.addEventListener("mouseenter", onMouseEnter);
        // listenerElement.addEventListener('contextmenu', onClickRight);
    }
}


};

Ops.Gl.InteractiveRectangle.prototype = new CABLES.Op();
CABLES.OPS["eeebdb51-9d8c-404d-a538-f5d9cf409200"]={f:Ops.Gl.InteractiveRectangle,objName:"Ops.Gl.InteractiveRectangle"};




// **************************************************************
// 
// Ops.String.AddLineBreaks
// 
// **************************************************************

Ops.String.AddLineBreaks = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inStr=op.inString("String",""),
    inMaxLineChars=op.inInt("Max Characters per Line",20),
    outStr=op.outString("Result");

inMaxLineChars.onChange=
    inStr.onChange=update;

function update()
{
    const str=inStr.get();
    if(!str)
    {
        outStr.set("");
        return;
    }

    const numChars=inMaxLineChars.get();
    const parts=str.split(" ");
    const lines=[];
    var line="";
    for(var i=0;i<parts.length;i++)
    {
        var word=parts[i]+" ";

        if(line.length+word.length>numChars)
        {
            lines.push(line);
            line="";
        }

        line+=word;
    }
    lines.push(line);
    outStr.set(lines.join("\n"));
}


};

Ops.String.AddLineBreaks.prototype = new CABLES.Op();
CABLES.OPS["9746be6e-bf86-4a5f-86d9-d3b1c26d7f28"]={f:Ops.String.AddLineBreaks,objName:"Ops.String.AddLineBreaks"};




// **************************************************************
// 
// Ops.String.String_v2
// 
// **************************************************************

Ops.String.String_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    v=op.inString("value",""),
    result=op.outString("String");

v.onChange=function()
{
    result.set(v.get());
};



};

Ops.String.String_v2.prototype = new CABLES.Op();
CABLES.OPS["d697ff82-74fd-4f31-8f54-295bc64e713d"]={f:Ops.String.String_v2,objName:"Ops.String.String_v2"};




// **************************************************************
// 
// Ops.Math.Incrementor
// 
// **************************************************************

Ops.Math.Incrementor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    increment = op.inTriggerButton("Increment"),
    decrement = op.inTriggerButton("Decrement"),
    inLength = op.inValueInt("Length"),
    inLimit = op.inBool("Limit", true),
    reset = op.inTriggerButton("Reset"),
    inMode = op.inSwitch("Mode", ["Rewind", "Stop at Max"], "Rewind"),
    inDefault = op.inValueInt("Default", 0),
    outChanged = op.outTrigger("Changed"),
    value = op.outNumber("Value"),
    outRestarted = op.outTrigger("Restarted");

value.ignoreValueSerialize = true;
inLength.set(10);
let val = 0;
value.set(0);

inLength.onTriggered = reset;
inDefault.onChange = doReset;
reset.onTriggered = doReset;

const MODE_REWIND = 0;
const MODE_STOP = 1;

let mode = MODE_REWIND;

inMode.onChange = function ()
{
    if (inMode.get() == "Rewind")
    {
        mode = MODE_REWIND;
    }
    if (inMode.get() == "Stop at Max")
    {
        mode = MODE_STOP;
    }
};

inLimit.onChange = () =>
{
    inLength.setUiAttribs({ "greyout": !inLimit.get() });
};

function doReset()
{
    value.set(null);
    val = inDefault.get();
    value.set(val);
    outRestarted.trigger();
}

decrement.onTriggered = function ()
{
    val--;
    if (inLimit.get())
    {
        if (mode == MODE_REWIND && val < 0)val = inLength.get() - 1;
        if (mode == MODE_STOP && val < 0)val = 0;
    }
    value.set(val);

    outChanged.trigger();
};

increment.onTriggered = function ()
{
    val++;
    if (inLimit.get())
    {
        if (mode == MODE_REWIND && val >= inLength.get())
        {
            val = 0;
            outRestarted.trigger();
        }
        if (mode == MODE_STOP && val >= inLength.get())val = inLength.get() - 1;
    }

    value.set(val);

    outChanged.trigger();
};


};

Ops.Math.Incrementor.prototype = new CABLES.Op();
CABLES.OPS["45cc0011-ada8-4423-8f5b-39a3810b8389"]={f:Ops.Math.Incrementor,objName:"Ops.Math.Incrementor"};




// **************************************************************
// 
// Ops.Vars.VarSetNumber_v2
// 
// **************************************************************

Ops.Vars.VarSetNumber_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const val = op.inValueFloat("Value", 0);
op.varName = op.inDropDown("Variable", [], "", true);

new CABLES.VarSetOpWrapper(op, "number", val, op.varName);


};

Ops.Vars.VarSetNumber_v2.prototype = new CABLES.Op();
CABLES.OPS["b5249226-6095-4828-8a1c-080654e192fa"]={f:Ops.Vars.VarSetNumber_v2,objName:"Ops.Vars.VarSetNumber_v2"};




// **************************************************************
// 
// Ops.Value.SwitchNumber
// 
// **************************************************************

Ops.Value.SwitchNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const idx = op.inValueInt("Index");
const valuePorts = [];
const result = op.outNumber("Result");

idx.onChange = update;

for (let i = 0; i < 16; i++)
{
    let p = op.inValue("Value " + i);
    valuePorts.push(p);
    p.onChange = update;
}

function update()
{
    if (idx.get() >= 0 && valuePorts[idx.get()])
    {
        result.set(valuePorts[idx.get()].get());
    }
}


};

Ops.Value.SwitchNumber.prototype = new CABLES.Op();
CABLES.OPS["fbb89f72-f2e3-4d34-ad01-7d884a1bcdc0"]={f:Ops.Value.SwitchNumber,objName:"Ops.Value.SwitchNumber"};




// **************************************************************
// 
// Ops.Vars.VarGetNumber_v2
// 
// **************************************************************

Ops.Vars.VarGetNumber_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const val = op.outNumber("Value");
op.varName = op.inValueSelect("Variable", [], "", true);

new CABLES.VarGetOpWrapper(op, "number", op.varName, val);


};

Ops.Vars.VarGetNumber_v2.prototype = new CABLES.Op();
CABLES.OPS["421f5b52-c0fa-47c4-8b7a-012b9e1c864a"]={f:Ops.Vars.VarGetNumber_v2,objName:"Ops.Vars.VarGetNumber_v2"};




// **************************************************************
// 
// Ops.Anim.Smooth
// 
// **************************************************************

Ops.Anim.Smooth = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exec = op.inTrigger("Update"),
    inMode = op.inBool("Separate inc/dec", false),
    inVal = op.inValue("Value"),
    next = op.outTrigger("Next"),
    inDivisorUp = op.inValue("Inc factor", 4),
    inDivisorDown = op.inValue("Dec factor", 4),
    result = op.outNumber("Result", 0);

let val = 0;
let goal = 0;
let oldVal = 0;
let lastTrigger = 0;

op.toWorkPortsNeedToBeLinked(exec);

let divisorUp;
let divisorDown;
let divisor = 4;
let finished = true;

let selectIndex = 0;
const MODE_SINGLE = 0;
const MODE_UP_DOWN = 1;

onFilterChange();
getDivisors();

inMode.setUiAttribs({ "hidePort": true });

inDivisorUp.onChange = inDivisorDown.onChange = getDivisors;
inMode.onChange = onFilterChange;
update();

function onFilterChange()
{
    const selectedMode = inMode.get();
    if (!selectedMode) selectIndex = MODE_SINGLE;
    else selectIndex = MODE_UP_DOWN;

    if (selectIndex == MODE_SINGLE)
    {
        inDivisorDown.setUiAttribs({ "greyout": true });
        inDivisorUp.setUiAttribs({ "title": "Inc/Dec factor" });
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        inDivisorDown.setUiAttribs({ "greyout": false });
        inDivisorUp.setUiAttribs({ "title": "Inc factor" });
    }

    getDivisors();
    update();
}

function getDivisors()
{
    if (selectIndex == MODE_SINGLE)
    {
        divisorUp = inDivisorUp.get();
        divisorDown = inDivisorUp.get();
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        divisorUp = inDivisorUp.get();
        divisorDown = inDivisorDown.get();
    }

    if (divisorUp <= 0.2 || divisorUp != divisorUp)divisorUp = 0.2;
    if (divisorDown <= 0.2 || divisorDown != divisorDown)divisorDown = 0.2;
}

inVal.onChange = function ()
{
    finished = false;
    let oldGoal = goal;
    goal = inVal.get();
};

inDivisorUp.onChange = function ()
{
    getDivisors();
};

function update()
{
    let tm = 1;
    if (performance.now() - lastTrigger > 500 || lastTrigger === 0) val = inVal.get() || 0;
    else tm = (performance.now() - lastTrigger) / (performance.now() - lastTrigger);
    lastTrigger = performance.now();

    if (val != val)val = 0;

    if (divisor <= 0)divisor = 0.0001;

    const diff = goal - val;

    if (diff >= 0) val += (diff) / (divisorDown * tm);
    else val += (diff) / (divisorUp * tm);

    if (Math.abs(diff) < 0.00001)val = goal;

    if (divisor != divisor)val = 0;
    if (val != val || val == -Infinity || val == Infinity)val = inVal.get();

    if (oldVal != val)
    {
        result.set(val);
        oldVal = val;
    }

    if (val == goal && !finished)
    {
        finished = true;
        result.set(val);
    }

    next.trigger();
}

exec.onTriggered = function ()
{
    update();
};


};

Ops.Anim.Smooth.prototype = new CABLES.Op();
CABLES.OPS["5677b5b5-753a-4fbf-9e91-64c81ec68a2f"]={f:Ops.Anim.Smooth,objName:"Ops.Anim.Smooth"};




// **************************************************************
// 
// Ops.String.SwitchString
// 
// **************************************************************

Ops.String.SwitchString = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    idx=op.inValueInt("Index"),
    result=op.outString("Result");

const valuePorts=[];

idx.onChange=update;

for(var i=0;i<10;i++)
{
    var p=op.inString("String "+i);
    valuePorts.push( p );
    p.onChange=update;
}

function update()
{
    if(idx.get()>=0 && valuePorts[idx.get()])
    {
        result.set( valuePorts[idx.get()].get() );
    }
}

};

Ops.String.SwitchString.prototype = new CABLES.Op();
CABLES.OPS["2a7a0c68-f7c9-4249-b19a-d2de5cb4862c"]={f:Ops.String.SwitchString,objName:"Ops.String.SwitchString"};




// **************************************************************
// 
// Ops.Ui.Comment_v2
// 
// **************************************************************

Ops.Ui.Comment_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inTitle = op.inString("title", "New comment"),
    inText = op.inTextarea("text");
inTitle.setUiAttribs({ "hidePort": true });
inText.setUiAttribs({ "hidePort": true });

op.init =
    inTitle.onChange =
    inText.onChange =
    op.onLoaded = update;

update();

function update()
{
    if (CABLES.UI)
    {
        op.uiAttr(
            {
                "comment_title": inTitle.get(),
                "comment_text": inText.get()
            });

        op.name = inTitle.get();
    }
}


};

Ops.Ui.Comment_v2.prototype = new CABLES.Op();
CABLES.OPS["93492eeb-bf35-4a62-98f7-d85b0b79bfe5"]={f:Ops.Ui.Comment_v2,objName:"Ops.Ui.Comment_v2"};




// **************************************************************
// 
// Ops.Math.MapRange
// 
// **************************************************************

Ops.Math.MapRange = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    v = op.inValueFloat("value", 0),
    old_min = op.inValueFloat("old min", 0),
    old_max = op.inValueFloat("old max", 1),
    new_min = op.inValueFloat("new min", -1),
    new_max = op.inValueFloat("new max", 1),
    easing = op.inValueSelect("Easing", ["Linear", "Smoothstep", "Smootherstep"], "Linear"),
    result = op.outNumber("result", 0);

op.setPortGroup("Input Range", [old_min, old_max]);
op.setPortGroup("Output Range", [new_min, new_max]);

let ease = 0;
let r = 0;

v.onChange =
    old_min.onChange =
    old_max.onChange =
    new_min.onChange =
    new_max.onChange = exec;

exec();

easing.onChange = function ()
{
    if (easing.get() == "Smoothstep") ease = 1;
    else if (easing.get() == "Smootherstep") ease = 2;
    else ease = 0;
};

function exec()
{
    const nMin = new_min.get();
    const nMax = new_max.get();
    const oMin = old_min.get();
    const oMax = old_max.get();
    let x = v.get();

    if (x >= Math.max(oMax, oMin))
    {
        result.set(nMax);
        return;
    }
    else
    if (x <= Math.min(oMax, oMin))
    {
        result.set(nMin);
        return;
    }

    let reverseInput = false;
    const oldMin = Math.min(oMin, oMax);
    const oldMax = Math.max(oMin, oMax);
    if (oldMin != oMin) reverseInput = true;

    let reverseOutput = false;
    const newMin = Math.min(nMin, nMax);
    const newMax = Math.max(nMin, nMax);
    if (newMin != nMin) reverseOutput = true;

    let portion = 0;

    if (reverseInput) portion = (oldMax - x) * (newMax - newMin) / (oldMax - oldMin);
    else portion = (x - oldMin) * (newMax - newMin) / (oldMax - oldMin);

    if (reverseOutput) r = newMax - portion;
    else r = portion + newMin;

    if (ease === 0)
    {
        result.set(r);
    }
    else
    if (ease == 1)
    {
        x = Math.max(0, Math.min(1, (r - nMin) / (nMax - nMin)));
        result.set(nMin + x * x * (3 - 2 * x) * (nMax - nMin)); // smoothstep
    }
    else
    if (ease == 2)
    {
        x = Math.max(0, Math.min(1, (r - nMin) / (nMax - nMin)));
        result.set(nMin + x * x * x * (x * (x * 6 - 15) + 10) * (nMax - nMin)); // smootherstep
    }
}


};

Ops.Math.MapRange.prototype = new CABLES.Op();
CABLES.OPS["2617b407-60a0-4ff6-b4a7-18136cfa7817"]={f:Ops.Math.MapRange,objName:"Ops.Math.MapRange"};




// **************************************************************
// 
// Ops.Math.Sine
// 
// **************************************************************

Ops.Math.Sine = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    value = op.inValue("value"),
    phase = op.inValue("phase", 0.0),
    mul = op.inValue("frequency", 1.0),
    amplitude = op.inValue("amplitude", 1.0),
    invert = op.inValueBool("asine", false),
    result = op.outNumber("result");

let calculate = Math.sin;

mul.onChange =
amplitude.onChange =
phase.onChange =
value.onChange = function ()
{
    result.set(
        amplitude.get() * calculate((value.get() * mul.get()) + phase.get())
    );
};

invert.onChange = function ()
{
    if (invert.get()) calculate = Math.asin;
    else calculate = Math.sin;
};


};

Ops.Math.Sine.prototype = new CABLES.Op();
CABLES.OPS["d24da018-9f3d-428b-85c9-6ff14d77548b"]={f:Ops.Math.Sine,objName:"Ops.Math.Sine"};




// **************************************************************
// 
// Ops.Html.HyperLink_v2
// 
// **************************************************************

Ops.Html.HyperLink_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exec = op.inTriggerButton("Open"),
    inUrl = op.inString("URL", "https://cables.gl"),
    inTarget = op.inString("Target Name", "_self"),
    inSpecs = op.inString("Specs", "");

exec.onTriggered = function ()
{
    // document.location.href=inUrl.get();
    window.open(inUrl.get(), inTarget.get(), inSpecs.get());
};


};

Ops.Html.HyperLink_v2.prototype = new CABLES.Op();
CABLES.OPS["a669d4f7-1e35-463c-bf8b-08c9f1b68e04"]={f:Ops.Html.HyperLink_v2,objName:"Ops.Html.HyperLink_v2"};




// **************************************************************
// 
// Ops.Devices.Keyboard.KeyPressLearn
// 
// **************************************************************

Ops.Devices.Keyboard.KeyPressLearn = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const learnedKeyCode = op.inValueInt("key code");
const canvasOnly = op.inValueBool("canvas only", true);
const modKey = op.inValueSelect("Mod Key", ["none", "alt"], "none");
const inEnable = op.inValueBool("Enabled", true);
const preventDefault = op.inValueBool("Prevent Default");
const learn = op.inTriggerButton("learn");
const onPress = op.outTrigger("on press");
const onRelease = op.outTrigger("on release");
const outPressed = op.outBoolNum("Pressed", false);
const outKey = op.outString("Key");

const cgl = op.patch.cgl;
let learning = false;

modKey.onChange = learnedKeyCode.onChange = updateKeyName;

function onKeyDown(e)
{
    if (learning)
    {
        learnedKeyCode.set(e.keyCode);
        if (CABLES.UI)
        {
            op.refreshParams();
        }
        // op.log("Learned key code: " + learnedKeyCode.get());
        learning = false;
        removeListeners();
        addListener();

        if (CABLES.UI)gui.emitEvent("portValueEdited", op, learnedKeyCode, learnedKeyCode.get());
    }
    else
    {
        if (e.keyCode == learnedKeyCode.get())
        {
            if (modKey.get() == "alt")
            {
                if (e.altKey === true)
                {
                    onPress.trigger();
                    outPressed.set(true);
                    if (preventDefault.get())e.preventDefault();
                }
            }
            else
            {
                onPress.trigger();
                outPressed.set(true);
                if (preventDefault.get())e.preventDefault();
            }
        }
    }
}

function onKeyUp(e)
{
    if (e.keyCode == learnedKeyCode.get())
    {
        // op.log("Key released, key code: " + e.keyCode);
        onRelease.trigger();
        outPressed.set(false);
    }
}

op.onDelete = function ()
{
    cgl.canvas.removeEventListener("keyup", onKeyUp, false);
    cgl.canvas.removeEventListener("keydown", onKeyDown, false);
    document.removeEventListener("keyup", onKeyUp, false);
    document.removeEventListener("keydown", onKeyDown, false);
};

learn.onTriggered = function ()
{
    // op.log("Listening for key...");
    learning = true;
    addDocumentListener();

    setTimeout(function ()
    {
        learning = false;
        removeListeners();
        addListener();
    }, 3000);
};

function addListener()
{
    if (canvasOnly.get()) addCanvasListener();
    else addDocumentListener();
}

function removeListeners()
{
    document.removeEventListener("keydown", onKeyDown, false);
    document.removeEventListener("keyup", onKeyUp, false);
    cgl.canvas.removeEventListener("keydown", onKeyDown, false);
    cgl.canvas.removeEventListener("keyup", onKeyUp, false);
    outPressed.set(false);
}

function addCanvasListener()
{
    cgl.canvas.addEventListener("keydown", onKeyDown, false);
    cgl.canvas.addEventListener("keyup", onKeyUp, false);
}

function addDocumentListener()
{
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
}

inEnable.onChange = function ()
{
    if (!inEnable.get())
    {
        removeListeners();
    }
    else
    {
        addListener();
    }
};

canvasOnly.onChange = function ()
{
    removeListeners();
    addListener();
};

function updateKeyName()
{
    let keyName = CABLES.keyCodeToName(learnedKeyCode.get());
    const modKeyName = modKey.get();
    if (modKeyName && modKeyName !== "none")
    {
        keyName = modKeyName.charAt(0).toUpperCase() + modKeyName.slice(1) + "-" + keyName;
    }
    op.setUiAttribs({ "extendTitle": keyName });
    outKey.set(keyName);
}

addCanvasListener();


};

Ops.Devices.Keyboard.KeyPressLearn.prototype = new CABLES.Op();
CABLES.OPS["f069c0db-4051-4eae-989e-6ef7953787fd"]={f:Ops.Devices.Keyboard.KeyPressLearn,objName:"Ops.Devices.Keyboard.KeyPressLearn"};




// **************************************************************
// 
// Ops.Html.MailtoLink
// 
// **************************************************************

Ops.Html.MailtoLink = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inEmail = op.inString("Email", "test@test.com"),
    inSubject = op.inString("Subject", ""),
    exec = op.inTriggerButton("Execute");

exec.onTriggered = function ()
{
    let str = "mailto:";
    str += inEmail.get();
    if (inSubject.get())str += "?subject=" + inSubject.get();
    window.location.href = str;
};


};

Ops.Html.MailtoLink.prototype = new CABLES.Op();
CABLES.OPS["6d03ec3b-f8b2-4544-bdb3-df771e857069"]={f:Ops.Html.MailtoLink,objName:"Ops.Html.MailtoLink"};




// **************************************************************
// 
// Ops.Devices.TouchGesture
// 
// **************************************************************

Ops.Devices.TouchGesture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// inputs
const inEnabled = op.inBool("Active", true);
let enableVerticalSwipePort = op.inValueBool("Vertical Swipe", true);
let enableVerticalPanPort = op.inValueBool("Vertical Pan", true);

// outputs
let pressPort = op.outTrigger("Press");
let pressUpPort = op.outTrigger("Press Up");
let panLeftPort = op.outTrigger("Pan Left");
let panRightPort = op.outTrigger("Pan Right");
let swipeLeftPort = op.outTrigger("Swipe Left");
let swipeRightPort = op.outTrigger("Swipe Right");
let swipeUpPort = op.outTrigger("Swipe Up");
let swipeDownPort = op.outTrigger("Swipe Down");
let eventPort = op.outObject("Event");

let canvas = op.patch.cgl.canvas;

// create a simple instance
// by default, it only adds horizontal recognizers
let mc = new Hammer(canvas);

// change listeners
enableVerticalSwipePort.onChange = onEnableVerticalSwipePortChange;
enableVerticalPanPort.onChange = onEnableVerticalPanPortChange;

// init
onEnableVerticalSwipePortChange();
onEnableVerticalPanPortChange();

function onEnableVerticalSwipePortChange()
{
    let direction = Hammer.DIRECTION_HORIZONTAL;
    if (enableVerticalSwipePort.get())
    {
        direction = Hammer.DIRECTION_ALL;
    }
    mc.get("swipe").set({ "direction": direction });
}

function onEnableVerticalPanPortChange()
{
    let direction = Hammer.DIRECTION_HORIZONTAL;
    if (enableVerticalPanPort.get())
    {
        direction = Hammer.DIRECTION_ALL;
    }
    mc.get("pan").set({ "direction": direction });
}

/*
mc.on("panleft panright tap press", function(ev) {
    myElement.textContent = ev.type +" gesture detected.";
});
*/

mc.on("panleft", onPanLeft);
mc.on("panright", onPanRight);
mc.on("swipeleft", onSwipeLeft);
mc.on("swiperight", onSwipeRight);
mc.on("swipeup", onSwipeUp);
mc.on("swipedown", onSwipeDown);
mc.on("press", onPress);
mc.on("pressup", onPressUp);

function onPress(ev)
{
    if (!inEnabled.get()) return;
    eventPort.set(ev);
    pressPort.trigger();
}

function onPressUp(ev)
{
    if (!inEnabled.get()) return;
    eventPort.set(ev);
    pressUpPort.trigger();
}

function onPanLeft(ev)
{
    if (!inEnabled.get()) return;
    eventPort.set(ev);
    panLeftPort.trigger();
}

function onPanRight(ev)
{
    if (!inEnabled.get()) return;
    eventPort.set(ev);
    panRightPort.trigger();
}

function onSwipeLeft(ev)
{
    if (!inEnabled.get()) return;
    eventPort.set(ev);
    swipeLeftPort.trigger();
}

function onSwipeRight(ev)
{
    if (!inEnabled.get()) return;
    eventPort.set(ev);
    swipeRightPort.trigger();
}

function onSwipeUp(ev)
{
    if (!inEnabled.get()) return;
    eventPort.set(ev);
    swipeUpPort.trigger();
}

function onSwipeDown(ev)
{
    if (!inEnabled.get()) return;
    eventPort.set(ev);
    swipeDownPort.trigger();
}

/*
// By default it adds a set of tap, doubletap, press,
// horizontal pan and swipe, and the multi-touch pinch
// and rotate recognizers. The pinch and rotate recognizers
// are disabled by default because they would make the
// element blocking, but you can enable them by calling:
hammertime.get('pinch').set({ enable: true });
hammertime.get('rotate').set({ enable: true });

// Enabling vertical or all directions for the pan and swipe recognizers:
hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
hammertime.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
*/


};

Ops.Devices.TouchGesture.prototype = new CABLES.Op();
CABLES.OPS["08c5d91e-32d2-4852-ac18-d4cae543dd37"]={f:Ops.Devices.TouchGesture,objName:"Ops.Devices.TouchGesture"};




// **************************************************************
// 
// Ops.Math.SmootherStep
// 
// **************************************************************

Ops.Math.SmootherStep = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    val = op.inValueFloat("val", 0),
    min = op.inValueFloat("min", 0),
    max = op.inValueFloat("max", 1),
    result = op.outNumber("result");

val.onChange = max.onChange = min.onChange = exec;
exec();

function exec()
{
    let x = Math.max(0, Math.min(1, (val.get() - min.get()) / (max.get() - min.get())));
    result.set(x * x * x * (x * (x * 6 - 15) + 10) * (max.get() - min.get())); // smootherstep
}


};

Ops.Math.SmootherStep.prototype = new CABLES.Op();
CABLES.OPS["c66da84f-ff2f-45de-b3c2-557bdf1cb946"]={f:Ops.Math.SmootherStep,objName:"Ops.Math.SmootherStep"};




// **************************************************************
// 
// Ops.Sidebar.Slider_v3
// 
// **************************************************************

Ops.Sidebar.Slider_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// constants
const STEP_DEFAULT = 0.00001;

// inputs
const parentPort = op.inObject("link");
const labelPort = op.inString("Text", "Slider");
const minPort = op.inValue("Min", 0);
const maxPort = op.inValue("Max", 1);
const stepPort = op.inValue("Step", STEP_DEFAULT);
const labelSuffix = op.inString("Suffix", "");

const inGreyOut = op.inBool("Grey Out", false);
const inVisible = op.inBool("Visible", true);

const inputValuePort = op.inValue("Input", 0.5);
const setDefaultValueButtonPort = op.inTriggerButton("Set Default");
const reset = op.inTriggerButton("Reset");

let parent = null;

const defaultValuePort = op.inValue("Default", 0.5);
defaultValuePort.setUiAttribs({ "hidePort": true, "greyout": true });

// outputs
const siblingsPort = op.outObject("childs");
const valuePort = op.outNumber("Result", defaultValuePort.get());

op.toWorkNeedsParent("Ops.Sidebar.Sidebar");
op.setPortGroup("Range", [minPort, maxPort, stepPort]);
op.setPortGroup("Display", [inGreyOut, inVisible]);

// vars
const el = document.createElement("div");
el.addEventListener("dblclick", function ()
{
    valuePort.set(parseFloat(defaultValuePort.get()));
    inputValuePort.set(parseFloat(defaultValuePort.get()));
});

el.dataset.op = op.id;
el.classList.add("cablesEle");

el.classList.add("sidebar__item");
el.classList.add("sidebar__slider");
el.classList.add("sidebar__reloadable");

op.patch.on("sidebarStylesChanged", () => { updateActiveTrack(); });

const label = document.createElement("div");
label.classList.add("sidebar__item-label");

const greyOut = document.createElement("div");
greyOut.classList.add("sidebar__greyout");
el.appendChild(greyOut);
greyOut.style.display = "none";

const labelText = document.createTextNode(labelPort.get());
label.appendChild(labelText);
el.appendChild(label);

const value = document.createElement("input");
value.value = defaultValuePort.get();
value.classList.add("sidebar__text-input-input");
value.setAttribute("type", "text");
value.oninput = onTextInputChanged;
el.appendChild(value);

const suffixEle = document.createElement("span");
// setValueFieldValue(defaultValuePort).get();
// value.setAttribute("type", "text");
// value.oninput = onTextInputChanged;

el.appendChild(suffixEle);

labelSuffix.onChange = () =>
{
    suffixEle.innerHTML = labelSuffix.get();
};

const inputWrapper = document.createElement("div");
inputWrapper.classList.add("sidebar__slider-input-wrapper");
el.appendChild(inputWrapper);

const activeTrack = document.createElement("div");
activeTrack.classList.add("sidebar__slider-input-active-track");
inputWrapper.appendChild(activeTrack);
const input = document.createElement("input");
input.classList.add("sidebar__slider-input");
input.setAttribute("min", minPort.get());
input.setAttribute("max", maxPort.get());
input.setAttribute("type", "range");
input.setAttribute("step", stepPort.get());
input.setAttribute("value", defaultValuePort.get());
input.style.display = "block"; /* needed because offsetWidth returns 0 otherwise */
inputWrapper.appendChild(input);

updateActiveTrack();
input.addEventListener("input", onSliderInput);

// events
parentPort.onChange = onParentChanged;
labelPort.onChange = onLabelTextChanged;
inputValuePort.onChange = onInputValuePortChanged;
defaultValuePort.onChange = onDefaultValueChanged;
setDefaultValueButtonPort.onTriggered = onSetDefaultValueButtonPress;
minPort.onChange = onMinPortChange;
maxPort.onChange = onMaxPortChange;
stepPort.onChange = stepPortChanged;
op.onDelete = onDelete;

// op.onLoadedValueSet=function()
op.onLoaded = op.onInit = function ()
{
    if (op.patch.config.sidebar)
    {
        op.patch.config.sidebar[labelPort.get()];
        valuePort.set(op.patch.config.sidebar[labelPort.get()]);
    }
    else
    {
        valuePort.set(parseFloat(defaultValuePort.get()));
        inputValuePort.set(parseFloat(defaultValuePort.get()));
        // onInputValuePortChanged();
    }
};

reset.onTriggered = function ()
{
    const newValue = parseFloat(defaultValuePort.get());
    valuePort.set(newValue);
    setValueFieldValue(newValue);
    setInputFieldValue(newValue);
    inputValuePort.set(newValue);
    updateActiveTrack();
};

inGreyOut.onChange = function ()
{
    greyOut.style.display = inGreyOut.get() ? "block" : "none";
};

inVisible.onChange = function ()
{
    el.style.display = inVisible.get() ? "block" : "none";
};

function onTextInputChanged(ev)
{
    let newValue = parseFloat(ev.target.value);
    if (isNaN(newValue)) newValue = 0;
    const min = minPort.get();
    const max = maxPort.get();
    if (newValue < min) { newValue = min; }
    else if (newValue > max) { newValue = max; }
    // setInputFieldValue(newValue);
    valuePort.set(newValue);
    updateActiveTrack();
    inputValuePort.set(newValue);
    op.refreshParams();
}

function onInputValuePortChanged()
{
    let newValue = parseFloat(inputValuePort.get());
    const minValue = minPort.get();
    const maxValue = maxPort.get();
    if (newValue > maxValue) { newValue = maxValue; }
    else if (newValue < minValue) { newValue = minValue; }
    setValueFieldValue(newValue);
    setInputFieldValue(newValue);
    valuePort.set(newValue);
    updateActiveTrack();
}

function onSetDefaultValueButtonPress()
{
    let newValue = parseFloat(inputValuePort.get());
    const minValue = minPort.get();
    const maxValue = maxPort.get();
    if (newValue > maxValue) { newValue = maxValue; }
    else if (newValue < minValue) { newValue = minValue; }
    setValueFieldValue(newValue);
    setInputFieldValue(newValue);
    valuePort.set(newValue);
    defaultValuePort.set(newValue);
    op.refreshParams();

    updateActiveTrack();
}

function onSliderInput(ev)
{
    ev.preventDefault();
    ev.stopPropagation();
    setValueFieldValue(ev.target.value);
    const inputFloat = parseFloat(ev.target.value);
    valuePort.set(inputFloat);
    inputValuePort.set(inputFloat);
    op.refreshParams();

    updateActiveTrack();
    return false;
}

function stepPortChanged()
{
    const step = stepPort.get();
    input.setAttribute("step", step);
    updateActiveTrack();
}

function updateActiveTrack(val)
{
    let valueToUse = parseFloat(input.value);
    if (typeof val !== "undefined") valueToUse = val;
    let availableWidth = activeTrack.parentElement.getBoundingClientRect().width || 220;
    if (parent) availableWidth = parseInt(getComputedStyle(parent.parentElement).getPropertyValue("--sidebar-width")) - 20;

    const trackWidth = CABLES.map(
        valueToUse,
        parseFloat(input.min),
        parseFloat(input.max),
        0,
        availableWidth - 16 /* subtract slider thumb width */
    );
    activeTrack.style.width = trackWidth + "px";
}

function onMinPortChange()
{
    const min = minPort.get();
    input.setAttribute("min", min);
    updateActiveTrack();
}

function onMaxPortChange()
{
    const max = maxPort.get();
    input.setAttribute("max", max);
    updateActiveTrack();
}

function onDefaultValueChanged()
{
    const defaultValue = defaultValuePort.get();
    valuePort.set(parseFloat(defaultValue));
    onMinPortChange();
    onMaxPortChange();
    setInputFieldValue(defaultValue);
    setValueFieldValue(defaultValue);

    updateActiveTrack(defaultValue); // needs to be passed as argument, is this async?
}

function onLabelTextChanged()
{
    const labelText = labelPort.get();
    label.textContent = labelText;
    if (CABLES.UI) op.setTitle("Slider: " + labelText);
}

function onParentChanged()
{
    siblingsPort.set(null);
    parent = parentPort.get();
    if (parent && parent.parentElement)
    {
        parent.parentElement.appendChild(el);
        siblingsPort.set(parent);
    }
    else if (el.parentElement) el.parentElement.removeChild(el);

    updateActiveTrack();
}

function setValueFieldValue(v)
{
    value.value = v;
}

function setInputFieldValue(v)
{
    input.value = v;
}

function showElement(el)
{
    if (el)el.style.display = "block";
}

function hideElement(el)
{
    if (el)el.style.display = "none";
}

function onDelete()
{
    removeElementFromDOM(el);
}

function removeElementFromDOM(el)
{
    if (el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el);
}


};

Ops.Sidebar.Slider_v3.prototype = new CABLES.Op();
CABLES.OPS["74730122-5cba-4d0d-b610-df334ec6220a"]={f:Ops.Sidebar.Slider_v3,objName:"Ops.Sidebar.Slider_v3"};




// **************************************************************
// 
// Ops.Sidebar.NumberInput_v2
// 
// **************************************************************

Ops.Sidebar.NumberInput_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// inputs
const parentPort = op.inObject("Link");
const labelPort = op.inString("Text", "Number");
const inputValuePort = op.inValue("Input", 0);
const setDefaultValueButtonPort = op.inTriggerButton("Set Default");
const defaultValuePort = op.inValue("Default", 0);
defaultValuePort.setUiAttribs({ "hidePort": true, "greyout": true });

// outputs
const siblingsPort = op.outObject("Children");
const valuePort = op.outNumber("Result", defaultValuePort.get());

// vars
const el = document.createElement("div");
el.addEventListener("dblclick", function ()
{
    valuePort.set(parseFloat(defaultValuePort.get()));
    inputValuePort.set(parseFloat(defaultValuePort.get()));
});
el.dataset.op = op.id;
el.classList.add("cablesEle");
el.classList.add("sidebar__item");
el.classList.add("sidebar__text-input");
el.classList.add("sidebar__reloadable");

const label = document.createElement("div");
label.classList.add("sidebar__item-label");
const labelTextNode = document.createTextNode(labelPort.get());
label.appendChild(labelTextNode);
el.appendChild(label);
// var inputWrapper = document.createElement('div');
// inputWrapper.classList.add('sidebar__text-input-input-wrapper');
// el.appendChild(inputWrapper);
const input = document.createElement("input");
input.classList.add("sidebar__text-input-input");
input.setAttribute("type", "text");
input.setAttribute("value", defaultValuePort.get());
// inputWrapper.appendChild(input);
el.appendChild(input);
input.addEventListener("input", onInput);

// events
parentPort.onChange = onParentChanged;
labelPort.onChange = onLabelTextChanged;
defaultValuePort.onChange = onDefaultValueChanged;
op.onDelete = onDelete;
inputValuePort.onChange = onInputValuePortChanged;
setDefaultValueButtonPort.onTriggered = setDefaultValue;

// functions

function setDefaultValue()
{
    defaultValuePort.set(parseFloat(inputValuePort.get()));
    op.refreshParams();
}

function onInputValuePortChanged()
{
    let val = parseFloat(inputValuePort.get());
    if (isNaN(val)) { val = 0; }
    input.value = val;
    valuePort.set(val);
}

function onInput(ev)
{
    let newVal = parseFloat(ev.target.value);
    if (isNaN(newVal)) { newVal = 0; }
    valuePort.set(newVal);
    inputValuePort.set(newVal);
    op.refreshParams();
}

function onDefaultValueChanged()
{
    /*
    var defaultValue = defaultValuePort.get();
    valuePort.set(defaultValue);
    input.value = defaultValue;
    */
}

function onLabelTextChanged()
{
    const labelText = labelPort.get();
    label.textContent = labelText;
    if (CABLES.UI)
    {
        op.setTitle("Number Input: " + labelText);
    }
}

function onParentChanged()
{
    siblingsPort.set(null);
    const parent = parentPort.get();
    if (parent && parent.parentElement)
    {
        parent.parentElement.appendChild(el);
        siblingsPort.set(parent);
    }
    else
    { // detach
        if (el.parentElement)
        {
            el.parentElement.removeChild(el);
        }
    }
}

function showElement(element)
{
    if (element)
    {
        element.style.display = "block";
    }
}

function hideElement(element)
{
    if (element)
    {
        element.style.display = "none";
    }
}

function onDelete()
{
    removeElementFromDOM(el);
}

function removeElementFromDOM(element)
{
    if (element && element.parentNode && element.parentNode.removeChild)
    {
        element.parentNode.removeChild(element);
    }
}


};

Ops.Sidebar.NumberInput_v2.prototype = new CABLES.Op();
CABLES.OPS["c4f3f1d7-de07-4c06-921e-32baeef4fc68"]={f:Ops.Sidebar.NumberInput_v2,objName:"Ops.Sidebar.NumberInput_v2"};




// **************************************************************
// 
// Ops.Cables.FPS_v2
// 
// **************************************************************

Ops.Cables.FPS_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    active = op.inBool("Active", true),
    outFPS = op.outNumber("FPS"),
    outMS = op.outNumber("MS");

const listener = op.patch.addEventListener("performance", update);

op.onDelete = function ()
{
    op.patch.removeEventListener(listener);
};

function update(p)
{
    if (active.get())
    {
        outFPS.set(p.fps);
        outMS.set(p.ms);
    }
}


};

Ops.Cables.FPS_v2.prototype = new CABLES.Op();
CABLES.OPS["6dbb866c-b57a-4875-9f1d-22172162eaa8"]={f:Ops.Cables.FPS_v2,objName:"Ops.Cables.FPS_v2"};



window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
