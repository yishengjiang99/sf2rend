"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.renderFrames = exports.mkcanvas = exports.chart = exports.resetCanvas = exports.HEIGHT = exports.WIDTH = void 0;
//@ts-ignore
var mkdiv_js_1 = require("../node_modules/mkdiv/mkdiv.js");
exports.WIDTH = 480; // / 2,
exports.HEIGHT = 320;
function get_w_h(canvasCtx) {
    return [
        canvasCtx.canvas.getAttribute("width")
            ? parseInt(canvasCtx.canvas.getAttribute("width"))
            : exports.WIDTH,
        canvasCtx.canvas.getAttribute("height")
            ? parseInt(canvasCtx.canvas.getAttribute("height"))
            : exports.HEIGHT,
    ];
}
function resetCanvas(c) {
    if (!c)
        return;
    var canvasCtx = c;
    var _a = get_w_h(canvasCtx), _width = _a[0], _height = _a[1];
    canvasCtx.clearRect(0, 0, _width, _height);
    canvasCtx.fillStyle = "black";
    canvasCtx.fillRect(0, 0, _width, _height);
}
exports.resetCanvas = resetCanvas;
function chart(canvasCtx, dataArray) {
    resetCanvas(canvasCtx);
    var _a = get_w_h(canvasCtx), _width = _a[0], _height = _a[1];
    var max = 0, min = 0, x = 0;
    var iWIDTH = _width / dataArray.length; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)
    for (var i = 1; i < dataArray.length; i++) {
        max = dataArray[i] > max ? dataArray[i] : max;
        min = -1 * max; /// dataArray[i] < min ? dataArray[i] : min;
    }
    canvasCtx.beginPath();
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = "rbga(0xff,0xff,0x00,.5)";
    canvasCtx.moveTo(0, _height / 2);
    canvasCtx.lineTo(_width, _height / 2);
    canvasCtx.stroke();
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "white";
    canvasCtx.moveTo(0, _height / 2);
    for (var i = 1; i < dataArray.length; i++) {
        x += iWIDTH;
        canvasCtx.lineTo(x, _height / 2 - _height / 2 * dataArray[i]);
    }
    canvasCtx.stroke();
    canvasCtx.restore();
    canvasCtx.font = "1em Arial";
}
exports.chart = chart;
function mkcanvas(params) {
    if (params === void 0) { params = {}; }
    var _a = Object.assign(params, {
        container: document.body,
        title: "",
        width: exports.WIDTH,
        height: exports.HEIGHT
    }), width = _a.width, height = _a.height, container = _a.container, title = _a.title;
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", "" + width);
    canvas.setAttribute("height", "" + height);
    var canvasCtx = canvas.getContext("2d");
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "white";
    canvasCtx.fillStyle = "black";
    canvasCtx.font = "2em";
    var wrap = mkdiv_js_1.mkdiv("div", {}, [title ? mkdiv_js_1.mkdiv("h5", {}, title) : "", canvas]);
    container.append(wrap);
    canvas.ondblclick = function () { return resetCanvas(canvasCtx); };
    return canvasCtx;
}
exports.mkcanvas = mkcanvas;
function renderFrames(canvsCtx, arr, fps, samplesPerFrame) {
    if (fps === void 0) { fps = 60; }
    if (samplesPerFrame === void 0) { samplesPerFrame = 1024; }
    return __awaiter(this, void 0, void 0, function () {
        function onclick(_a) {
            var _b, _c;
            var x = _a.x, y = _a.y, target = _a.target;
            offset +=
                (x < target.clientWidth / 2 ? -1 : 1) * samplesPerFrame;
            chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));
            var existingSlider = (_c = (_b = canvsCtx.canvas) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.querySelector("input[type='range']");
            var slider = existingSlider ||
                mkdiv_js_1.mkdiv("input", {
                    type: "range",
                    min: 0,
                    max: 100,
                    value: 100,
                    step: 0,
                    oninput: function (e) {
                        var _a = e.target, max = _a.max, value = _a.value;
                        offset = (arr.length * parseInt(value)) / parseInt(max);
                        chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));
                    }
                }).attachTo(canvsCtx.canvas.parentElement);
        }
        var nextframe, offset;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    offset = 0;
                    _a.label = 1;
                case 1:
                    if (!(arr.length > offset)) return [3 /*break*/, 3];
                    if (!nextframe || performance.now() > nextframe) {
                        chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));
                        nextframe = 1 / fps + performance.now();
                        offset += samplesPerFrame / 4;
                    }
                    return [4 /*yield*/, new Promise(function (r) { return requestAnimationFrame(r); })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3:
                    canvsCtx.canvas.addEventListener("click", onclick);
                    canvsCtx.canvas.addEventListener("dblclick", function (e) {
                        e.x;
                        offset += (e.x < canvsCtx.canvas.width / 2 ? -1 : 1) * samplesPerFrame;
                        chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
exports.renderFrames = renderFrames;
