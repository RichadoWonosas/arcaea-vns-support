import { DiagnosticSeverity } from "vscode-languageserver";
import { Position } from "vscode-languageserver-textdocument";
import exp = require("constants");

export class PosType<T> {
    start: Position;
    end: Position;
    value: T;
}

export class VNSEffect {
    value: "linear" |
        "sinein" | "sineout" | "sineinout" |
        "cubein" | "cubeout" | "cubeinout" |
        "easein" | "easeout" | "easeinout";
}

export class VNSDrawing {
    value: "normal" | "overlay";
}

export class FadeController {
    static type = "fade";
    transitionTime: PosType<number>;
    effect: PosType<VNSEffect>;
}

export class ShowEvent {
    static type = "show";
    filePath: PosType<string>;
    imagePosX: PosType<number>;
    imagePosY: PosType<number>;
    canvasPivotX: PosType<number>;
    canvasPivotY: PosType<number>;
    imageScaleX: PosType<number>;
    imageScaleY: PosType<number>;
    fade?: PosType<FadeController>;
    drawing?: PosType<VNSDrawing>;
    scaling?: PosType<"scale">;
}

export class HideEvent {
    static type = "hide";
    filePath: PosType<string>;
    fade: PosType<FadeController>;
    effect: PosType<VNSEffect>;
}

export class ScaleEvent {
    static type = "scale";
    filePath: PosType<string>;
    imageScaleX: PosType<number>;
    imageScaleY: PosType<number>;
    transitionTime: PosType<number>;
    effect: PosType<VNSEffect>;
}

export class MoveEvent {
    static type = "move";
    filePath: PosType<string>;
    moveX: PosType<number>;
    moveY: PosType<number>;
    transitionTime: PosType<number>;
    effect: PosType<VNSEffect>;
}

export class PlayEvent {
    static type = "play";
    filePath: PosType<string>;
    fadeInTime: PosType<number>;
    loop?: PosType<"loop">;
    loopStartTime?: PosType<number>;
    loopEndTime?: PosType<number>;
}

export class StopEvent {
    static type = "stop";
    filePath: PosType<string>;
    fadeOutTime: PosType<number>;
}

export class VolumeEvent {
    static type = "volume";
    filePath: PosType<string>;
    volume: PosType<number>;
    transitionTime: PosType<number>;
}

export class SayEvent {
    static type = "say";
    contents: PosType<string>;
}

export class WaitEvent {
    static type = "wait";
    delay: PosType<number>;
    clear?: PosType<"clear">;
}

export class AutoPlayEvent {
    static type = "auto";
    autoPlayTime: PosType<number>;
}

export const effectList = [
    "linear",
    "sinein", "sineout", "sineinout",
    "cubein", "cubeout", "cubeinout",
    "easein", "easeout", "easeinout"
];

export const commandList = ["show", "hide", "scale", "move", "play", "stop", "volume", "say", "wait", "auto"];

export const drawingList = ["normal", "overlay"];
