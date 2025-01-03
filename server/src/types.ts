import { DiagnosticSeverity } from "vscode-languageserver";
import { Range } from "vscode-languageserver-textdocument";
import exp = require("constants");

export interface PosType<T> {
    range: Range;
    content: T;
}

export interface VNSEffect {
    value: "linear" |
    "sinein" | "sineout" | "sineinout" | "sineoutin" |
    "cubein" | "cubeout" | "cubeinout" | "cubeoutin" |
    "easein" | "easeout" | "easeinout" | "easeoutin";
}

export interface VNSDrawing {
    value: "normal" | "overlay";
}

export interface FadeController {
    transitionTime: PosType<number>;
    effect: PosType<VNSEffect>;
}

export interface ShowEvent {
    type: "show";
    filePath: PosType<string>;
    imagePosX: PosType<number>;
    imagePosY: PosType<number>;
    canvasPivotX: PosType<number>;
    canvasPivotY: PosType<number>;
    imageScaleX: PosType<number>;
    imageScaleY: PosType<number>;
    fade?: PosType<FadeController>;
    drawing: PosType<VNSDrawing>;
    scaling?: PosType<boolean>;
}

export interface HideEvent {
    type: "hide";
    filePath: PosType<string>;
    fade: PosType<FadeController>;
}

export interface ScaleEvent {
    type: "scale";
    filePath: PosType<string>;
    imageScaleX: PosType<number>;
    imageScaleY: PosType<number>;
    transitionTime: PosType<number>;
    effect: PosType<VNSEffect>;
}

export interface MoveEvent {
    type: "move";
    filePath: PosType<string>;
    moveX: PosType<number>;
    moveY: PosType<number>;
    transitionTime: PosType<number>;
    effect: PosType<VNSEffect>;
}

export interface PlayEvent {
    type: "play";
    filePath: PosType<string>;
    fadeInTime: PosType<number>;
    loop?: PosType<boolean>;
    loopStartTime?: PosType<number>;
    loopEndTime?: PosType<number>;
}

export interface StopEvent {
    type: "stop";
    filePath: PosType<string>;
    fadeOutTime: PosType<number>;
}

export interface VolumeEvent {
    type: "volume";
    filePath: PosType<string>;
    volume: PosType<number>;
    transitionTime: PosType<number>;
}

export interface SayEvent {
    type: "say";
    contents: PosType<string>;
}

export interface WaitEvent {
    type: "wait";
    delay: PosType<number>;
    clear?: PosType<boolean>;
}

export interface AutoPlayEvent {
    type: "auto";
    autoPlayTime: PosType<number>;
}

export interface HideTextboxEvent {
    type: "hidetextbox";
}

export interface UnloadTexturesEvent {
    type: "unload_textures";
}

export type VNSEvent = PosType<ShowEvent | HideEvent | ScaleEvent | MoveEvent | PlayEvent | StopEvent | VolumeEvent | SayEvent | WaitEvent | AutoPlayEvent | HideTextboxEvent | UnloadTexturesEvent>;

export type VNSFile = {
    events: VNSEvent[]
};

export const effectList = [
    "linear",
    "sinein", "sineout", "sineinout", "sineoutin",
    "cubein", "cubeout", "cubeinout", "cubeoutin",
    "easein", "easeout", "easeinout", "easeoutin"
];

export const commandList = ["show", "hide", "scale", "move", "play", "stop", "volume", "say", "wait", "auto", "hidetextbox", "unload_textures"];

export const drawingList = ["normal", "overlay"];
