import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { CstChildrenDictionary, IToken, CstNode } from "chevrotain";
import { BaseVNSVisitor } from "./parser";
import { PosType, FadeController, VNSEffect, VNSFile, VNSEvent, ShowEvent, HideEvent, ScaleEvent, MoveEvent, PlayEvent, StopEvent, VolumeEvent, SayEvent, WaitEvent, AutoPlayEvent, VNSDrawing, HideTextboxEvent, UnloadTexturesEvent } from "./types";

interface FileContent {
    filePath: string,
    range: Range,
    operation: string
}

class VNSChecker extends BaseVNSVisitor {

    imageFileList: FileContent[];
    musicFileList: FileContent[];

    constructor() {
        super();
        this.validateVisitor();
        this.imageFileList = [];
        this.musicFileList = [];
    }

    xyValue(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string, minValue?: number, maxValue?: number }): { x: PosType<number>, y: PosType<number> } {
        let [xT, yT] = [(ctx.x[0] as IToken), (ctx.y[0] as IToken)];
        let [x, y] = [xT, yT].map(t => Number.parseFloat(t.image));

        if (input.minValue) {
            if (x < input.minValue) {
                input.errors.push({
                    severity: DiagnosticSeverity.Error,
                    message: `The representing X value here should be no less than ${input.minValue}.`,
                    range: transformRange(xT)
                });
            }
            if (y < input.minValue) {
                input.errors.push({
                    severity: DiagnosticSeverity.Error,
                    message: `The representing Y value here should be no less than ${input.minValue}.`,
                    range: transformRange(yT)
                });
            }
        }

        if (input.maxValue) {
            if (x > input.maxValue) {
                input.errors.push({
                    severity: DiagnosticSeverity.Error,
                    message: `The representing X value here should be no more than ${input.maxValue}.`,
                    range: transformRange(xT)
                });
            }
            if (y > input.maxValue) {
                input.errors.push({
                    severity: DiagnosticSeverity.Error,
                    message: `The representing Y value here should be no more than ${input.maxValue}.`,
                    range: transformRange(yT)
                });
            }
        }
        return {
            x: { range: transformRange(xT), content: x },
            y: { range: transformRange(yT), content: y }
        };
    }

    fadeFunction(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): FadeController {
        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);
        let transT = ctx.transition[0] as IToken;
        let transition = transT.image;

        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
        return {
            transitionTime: {
                range: transformRange(timeT),
                content: transitionTime
            },
            effect: {
                range: transformRange(transT),
                content: transition as unknown as VNSEffect
            }
        };
    }

    showCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): ShowEvent {
        let pathT = ctx.filePath[0] as IToken;
        let imagePosition = this.visit(ctx.imagePosition[0] as CstNode, input);
        let canvasPivot = this.visit(ctx.canvasPivot[0] as CstNode, input);
        let imageScale = this.visit(ctx.imageScale[0] as CstNode, input);
        let drawingT = ctx.drawing[0] as IToken;

        this.imageFileList.push({
            filePath: pathT.image,
            operation: "show",
            range: transformRange(pathT)
        });

        let item: ShowEvent = {
            type: "show",
            filePath: { range: transformRange(pathT), content: pathT.image },
            imagePosX: imagePosition.x,
            imagePosY: imagePosition.y,
            canvasPivotX: canvasPivot.x,
            canvasPivotY: canvasPivot.y,
            imageScaleX: imageScale.x,
            imageScaleY: imageScale.y,
            drawing: { range: transformRange(drawingT), content: drawingT.image as unknown as VNSDrawing }
        };

        if (ctx.fadeFunction) {
            item.fade = this.visit(ctx.fadeFunction[0] as CstNode, input);
        }

        if (ctx.scale) {
            item.scaling = { range: transformRange(ctx.scale[0] as IToken), content: true };
        }

        return item;
    }

    hideCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): HideEvent {
        let pathT = ctx.filePath[0] as IToken;
        this.imageFileList.push({
            filePath: pathT.image,
            operation: "hide",
            range: transformRange(pathT)
        });

        let fade = this.visit(ctx.fadeFunction[0] as CstNode, input);

        let item: HideEvent = {
            type: "hide",
            filePath: { range: transformRange(pathT), content: pathT.image },
            fade: fade
        };

        return item;
    }

    scaleCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        let pathT = ctx.filePath[0] as IToken;
        let imageScale = this.visit(ctx.imageScale[0] as CstNode, input);
        let timeT = ctx.transitionTime[0] as IToken;
        let transT = ctx.transition[0] as IToken;

        this.imageFileList.push({
            filePath: pathT.image,
            operation: "scale",
            range: transformRange(pathT)
        });

        let transitionTime = Number.parseFloat(timeT.image);
        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }

        let item: ScaleEvent = {
            type: "scale",
            filePath: { range: transformRange(pathT), content: pathT.image },
            imageScaleX: imageScale.x,
            imageScaleY: imageScale.y,
            transitionTime: { range: transformRange(timeT), content: transitionTime },
            effect: { range: transformRange(transT), content: transT.image as unknown as VNSEffect }
        };

        return item;
    }

    moveCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): MoveEvent {
        let pathT = ctx.filePath[0] as IToken;
        let timeT = ctx.transitionTime[0] as IToken;
        let move = this.visit(ctx.movement[0] as CstNode, input);
        let transT = ctx.transition[0] as IToken;

        this.imageFileList.push({
            filePath: pathT.image,
            operation: "move",
            range: transformRange(pathT)
        });

        let transitionTime = Number.parseFloat(timeT.image);
        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }

        let item: MoveEvent = {
            type: "move",
            filePath: { range: transformRange(pathT), content: pathT.image },
            moveX: move.x,
            moveY: move.y,
            transitionTime: { range: transformRange(timeT), content: transitionTime },
            effect: { range: transformRange(transT), content: transT.image as unknown as VNSEffect }
        };

        return item;
    }

    playCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): PlayEvent {
        let pathT = ctx.filePath[0] as IToken;
        let timeT = ctx.transitionTime[0] as IToken;

        this.musicFileList.push({
            filePath: pathT.image,
            operation: ctx.loop ? "loop" : "play",
            range: transformRange(pathT)
        });

        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }

        let item: PlayEvent = {
            type: "play",
            filePath: { range: transformRange(pathT), content: pathT.image },
            fadeInTime: { range: transformRange(timeT), content: transitionTime }
        };

        if (ctx.loop) {
            item.loop = { range: transformRange(ctx.loop[0] as IToken), content: true };

            if (ctx.loopStartTime) {
                let startT = ctx.loopStartTime[0] as IToken;
                let endT = ctx.loopEndTime[0] as IToken;
                let start = Number.parseFloat(startT.image);
                let end = Number.parseFloat(endT.image);

                if (!Number.isInteger(start)) {
                    input.errors.push({
                        severity: DiagnosticSeverity.Error,
                        message: `The start timestamp should be integer.`,
                        range: transformRange(startT)
                    });
                }
                if (!Number.isInteger(end)) {
                    input.errors.push({
                        severity: DiagnosticSeverity.Error,
                        message: `The end timestamp should be integer.`,
                        range: transformRange(endT)
                    });
                }
                if (start < 0) {
                    input.errors.push({
                        severity: DiagnosticSeverity.Error,
                        message: `The start timestamp should be no less than 0.`,
                        range: transformRange(startT)
                    });
                }
                if (end < 0) {
                    input.errors.push({
                        severity: DiagnosticSeverity.Error,
                        message: `The end timestamp should be no less than 0.`,
                        range: transformRange(endT)
                    });
                }
                if (end <= start) {
                    input.errors.push({
                        severity: DiagnosticSeverity.Error,
                        message: `The loop endpoint should be later than the loop startpoint.`,
                        range: transformRange(endT),
                        relatedInformation: [{
                            message: "Loop startpoint",
                            location: { uri: input.uri, range: transformRange(startT) }
                        }]
                    });
                }
                item.loopStartTime = { range: transformRange(startT), content: start };
                item.loopEndTime = { range: transformRange(endT), content: end };
            }
        }

        return item;
    }

    stopCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): StopEvent {
        let pathT = ctx.filePath[0] as IToken;
        let timeT = ctx.transitionTime[0] as IToken;

        this.musicFileList.push({
            filePath: pathT.image,
            operation: "stop",
            range: transformRange(pathT)
        });

        let transitionTime = Number.parseFloat(timeT.image);
        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }

        let item: StopEvent = {
            type: "stop",
            filePath: { range: transformRange(pathT), content: pathT.image },
            fadeOutTime: { range: transformRange(timeT), content: transitionTime }
        };
        return item;
    }

    volumeCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): VolumeEvent {
        let pathT = ctx.filePath[0] as IToken;
        let vT = ctx.volumeAfter[0] as IToken;
        let timeT = ctx.transitionTime[0] as IToken;

        this.musicFileList.push({
            filePath: pathT.image,
            operation: "volume",
            range: transformRange(pathT)
        });

        let volumeAfter = Number.parseFloat(vT.image);
        if (volumeAfter < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The volume should be no less than 0.`,
                range: transformRange(vT)
            });
            // } else if (volumeAfter > 1) {
            //     input.errors.push({
            //         severity: DiagnosticSeverity.Error,
            //         message: `The volume should be no more than 1.`,
            //         range: transformRange(vT)
            //     });
        }

        let transitionTime = Number.parseFloat(timeT.image);
        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }

        let item: VolumeEvent = {
            type: "volume",
            filePath: { range: transformRange(pathT), content: pathT.image },
            volume: { range: transformRange(vT), content: volumeAfter },
            transitionTime: { range: transformRange(timeT), content: transitionTime }
        };

        return item;
    }

    sayCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): SayEvent {
        let content = ctx.content[0] as IToken;

        if (content.endLine - content.startLine >= 3) {
            input.errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The say content should be no more than 3 lines.`,
                range: transformRange(content)
            });
        }

        let item: SayEvent = {
            type: "say",
            contents: { range: transformRange(content), content: content.image }
        };

        return item;
    }

    waitCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): WaitEvent {
        let timeT = ctx.time[0] as IToken;
        let time = Number.parseFloat(timeT.image);

        if (time < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The wait time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }

        let item: WaitEvent = {
            type: "wait",
            delay: { range: transformRange(timeT), content: time }
        };

        if (ctx.clear) {
            item.clear = { range: transformRange(ctx.clear[0] as IToken), content: true };
        }

        return item;
    }

    autoCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): AutoPlayEvent {
        let timeT = ctx.time[0] as IToken;

        let time = Number.parseFloat(timeT.image);
        if (time < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The autoplay time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }

        let item: AutoPlayEvent = {
            type: "auto",
            autoPlayTime: { range: transformRange(timeT), content: time }
        };

        return item;
    }

    hideTextboxCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): HideTextboxEvent {
        let item: HideTextboxEvent = {
            type: "hidetextbox",
        };

        return item;
    }

    unloadTexturesCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): UnloadTexturesEvent {
        let item: UnloadTexturesEvent = {
            type: "unload_textures",
        };

        return item;
    }

    vns(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }): VNSEvent[] {
        // initialize lists
        this.imageFileList = [];
        this.musicFileList = [];
        let commandList: VNSEvent[] = [];

        const COMMAND_ENTRIES: string[] = [
            "waitCommand", "autoCommand", "hideTextboxCommand", "unloadTexturesCommand",
            "showCommand", "hideCommand", "scaleCommand", "moveCommand",
            "playCommand", "stopCommand", "volumeCommand", "sayCommand",
        ];

        // visit all commands
        for (let i = 0; i < COMMAND_ENTRIES.length; i++) {
            if (ctx[COMMAND_ENTRIES[i]]) {
                ctx[COMMAND_ENTRIES[i]].forEach((value) => { let item = this.visit(value as CstNode, input); commandList.push({ range: transformRange(value as IToken), content: item }); });
            }
        }

        // check file paths
        checkFilepaths(this.imageFileList, this.musicFileList, input.errors, input.uri);

        // sort commands
        commandList.sort((a, b) => {
            if (a.range.start.line < b.range.start.line) {
                return -1;
            } else if (a.range.start.line === b.range.start.line && a.range.start.character <= b.range.start.character) {
                return -1;
            } else {
                return 1;
            }
        });

        return commandList;
    }
}

const transformRange = (token: IToken): Range => {
    return {
        start: { line: token.startLine - 1, character: token.startColumn - 1 },
        end: { line: token.endLine - 1, character: token.endColumn }
    };
};

const checkFilepaths = (imageFileList: FileContent[], musicFileList: FileContent[], errors: Diagnostic[], uri: string): void => {
    let imageStack: FileContent[] = [];
    let musicStack: FileContent[] = [];

    // sort file list
    imageFileList.sort((a, b) => {
        if (a.range.start.line < b.range.start.line) {
            return -1;
        } else if (a.range.start.line === b.range.start.line && a.range.start.character <= b.range.start.character) {
            return -1;
        } else {
            return 1;
        }
    });
    musicFileList.sort((a, b) => {
        if (a.range.start.line < b.range.start.line) {
            return -1;
        } else if (a.range.start.line === b.range.start.line && a.range.start.character <= b.range.start.character) {
            return -1;
        } else {
            return 1;
        }
    });

    // process sorted image file
    imageFileList.forEach(image => {
        let idx = -1;
        switch (image.operation) {
            case "show":
                idx = backFindIndex(imageStack, i => i.filePath === image.filePath);
                if (idx >= 0) {
                    errors.push({
                        severity: DiagnosticSeverity.Warning,
                        message: `Another instance of ${image.filePath} is not hidden.`,
                        range: image.range,
                        relatedInformation: [{
                            message: "Instance not hidden",
                            location: { uri: uri, range: imageStack[idx].range }
                        }]
                    });
                }
                imageStack.push(image);
                break;
            case "scale":
            case "move":
                idx = backFindIndex(imageStack, i => i.filePath === image.filePath);
                if (idx < 0) {
                    errors.push({
                        severity: DiagnosticSeverity.Error,
                        message: `Cannot find currently showing instance of ${image.filePath}.`,
                        range: image.range
                    });
                }
                break;
            case "hide":
                idx = backFindIndex(imageStack, i => i.filePath === image.filePath);
                if (idx < 0) {
                    errors.push({
                        severity: DiagnosticSeverity.Error,
                        message: `Cannot find currently showing instance of ${image.filePath}.`,
                        range: image.range
                    });
                } else {
                    imageStack.splice(idx, 1);
                }
                break;
        }
    });

    // process sorted music file
    musicFileList.forEach(music => {
        let idx: number = -1;
        switch (music.operation) {
            case "loop":
            case "play":
                idx = backFindIndex(imageStack, i => i.filePath === music.filePath && i.operation === "loop");
                if (idx >= 0) {
                    errors.push({
                        severity: DiagnosticSeverity.Warning,
                        message: `Another instance of ${music.filePath} is not stopped.`,
                        range: music.range,
                        relatedInformation: [{
                            message: "Instance not stopped",
                            location: { uri: uri, range: musicStack[idx].range }
                        }]
                    });
                }
                musicStack.push(music);
                break;
            case "volume":
                idx = backFindIndex(musicStack, i => i.filePath === music.filePath);
                if (idx < 0) {
                    errors.push({
                        severity: DiagnosticSeverity.Error,
                        message: `Cannot find currently playing instance of ${music.filePath}.`,
                        range: music.range
                    });
                }
                break;
            case "stop":
                idx = backFindIndex(musicStack, i => i.filePath === music.filePath);
                if (idx < 0) {
                    errors.push({
                        severity: DiagnosticSeverity.Error,
                        message: `Cannot find currently playing instance of ${music.filePath}.`,
                        range: music.range
                    });
                } else {
                    musicStack.splice(idx, 1);
                }
                break;
        }
    });
};

const backFindIndex = <T>(array: T[], criteriaFn: (obj: T) => boolean): number => {
    let i = -1;
    for (i = array.length - 1; i >= 0; --i) {
        if (criteriaFn(array[i])) {
            break;
        }
    }
    return i;
};

const checker = new VNSChecker();
export const checkVNS = (vns: CstNode, uri: string): { commands: VNSEvent[], errors: Diagnostic[] } => {
    let errors: Diagnostic[] = [];
    let commandList = checker.visit(vns, { errors: errors, uri: uri });
    return { commands: commandList, errors: errors };
};
