import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { CstChildrenDictionary, IToken, CstNode, ICstVisitor, CstNodeLocation } from "chevrotain";
import { BaseVNSVisitor } from "./parser";
import { vnsToken } from "./lexer";

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

    xyValue(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string, minValue?: number, maxValue?: number }) {
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
    }

    fadeFunction(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    showCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        this.imageFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "show",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        this.visit(ctx.imagePosition[0] as CstNode, input);
        this.visit(ctx.canvasPivot[0] as CstNode, input);
        this.visit(ctx.imageScale[0] as CstNode, input);
        this.visit(ctx.fadeFunction[0] as CstNode, input);
    }

    hideCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        this.imageFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "hide",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        this.visit(ctx.fadeFunction[0] as CstNode, input);
    }

    scaleCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        this.imageFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "scale",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        this.visit(ctx.imageScale[0] as CstNode, input);

        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    moveCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        this.imageFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "move",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        this.visit(ctx.movement[0] as CstNode, input);

        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    playCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        this.musicFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: ctx.loop ? "loop" : "play",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }

        if (ctx.loop) {
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
            }
        }
    }

    stopCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        this.musicFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "stop",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    volumeCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        this.musicFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "volume",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        let vT = ctx.volumeAfter[0] as IToken;
        let volumeAfter = Number.parseFloat(vT.image);

        if (volumeAfter < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The volume should be no less than 0.`,
                range: transformRange(vT)
            });
        } else if (volumeAfter > 1) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The volume should be no more than 1.`,
                range: transformRange(vT)
            });
        }

        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The transition time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    sayCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        let content = ctx.content[0] as IToken;
        if (content.endLine - content.startLine >= 3) {
            input.errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The say content should be no more than 3 lines.`,
                range: transformRange(content)
            });
        }
    }

    waitCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        let timeT = ctx.time[0] as IToken;
        let time = Number.parseFloat(timeT.image);

        if (time < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The wait time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    autoCommand(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        let timeT = ctx.time[0] as IToken;
        let time = Number.parseFloat(timeT.image);

        if (time < 0) {
            input.errors.push({
                severity: DiagnosticSeverity.Error,
                message: `The autoplay time should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    vns(ctx: CstChildrenDictionary, input: { errors: Diagnostic[], uri: string }) {
        // initialize lists
        this.imageFileList = [];
        this.musicFileList = [];

        // visit all commands
        ctx.showCommand.forEach((value) => { this.visit(value as CstNode, input); });
        ctx.hideCommand.forEach((value) => { this.visit(value as CstNode, input); });
        ctx.scaleCommand.forEach((value) => { this.visit(value as CstNode, input); });
        ctx.moveCommand.forEach((value) => { this.visit(value as CstNode, input); });
        ctx.playCommand.forEach((value) => { this.visit(value as CstNode, input); });
        ctx.stopCommand.forEach((value) => { this.visit(value as CstNode, input); });
        ctx.volumeCommand.forEach((value) => { this.visit(value as CstNode, input); });
        ctx.sayCommand.forEach((value) => { this.visit(value as CstNode, input); });
        ctx.waitCommand.forEach((value) => { this.visit(value as CstNode, input); });
        ctx.autoCommand.forEach((value) => { this.visit(value as CstNode, input); });

        // check file paths
        checkFilepaths(this.imageFileList, this.musicFileList, input.errors, input.uri);
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
export const checkVNS = (vns: CstNode, uri: string): Diagnostic[] => {
    let errors: Diagnostic[] = [];
    checker.visit(vns, { errors: errors, uri: uri });
    return errors;
};
