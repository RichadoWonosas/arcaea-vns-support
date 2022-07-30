import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { CstChildrenDictionary, IToken, CstNode, ICstVisitor, CstNodeLocation } from "chevrotain";
import { BaseVNSVisitor } from "./parser";
import { vnsToken } from "./lexer";

interface FileContent {
    filePath: String,
    range: Range,
    operation: String
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

    xyValue(ctx: CstChildrenDictionary, errors: Diagnostic[], minValue?: Number, maxValue?: Number) {
        let [xT, yT] = [(ctx.x[0] as IToken), (ctx.y[0] as IToken)];
        let [x, y] = [xT, yT].map(t => Number.parseFloat(t.image));

        if (minValue !== undefined) {
            if (x < minValue) {
                errors.push({
                    severity: DiagnosticSeverity.Warning,
                    message: `The value here should be no less than ${minValue}.`,
                    range: transformRange(xT)
                });
            }
            if (y < minValue) {
                errors.push({
                    severity: DiagnosticSeverity.Warning,
                    message: `The value here should be no less than ${minValue}.`,
                    range: transformRange(yT)
                });
            }
        }

        if (maxValue !== undefined) {
            if (x > maxValue) {
                errors.push({
                    severity: DiagnosticSeverity.Warning,
                    message: `The value here should be no more than ${maxValue}.`,
                    range: transformRange(xT)
                });
            }
            if (y > maxValue) {
                errors.push({
                    severity: DiagnosticSeverity.Warning,
                    message: `The value here should be no more than ${maxValue}.`,
                    range: transformRange(yT)
                });
            }
        }
    }

    fadeFunction(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The value here should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    showCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        this.imageFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "show",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        this.visit(ctx.imagePosition[0] as CstNode, errors);
        this.visit(ctx.canvasPivot[0] as CstNode, errors);
        this.visit(ctx.imageScale[0] as CstNode, errors);
        this.visit(ctx.fadeFunction[0] as CstNode, errors);
    }

    hideCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        this.imageFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "hide",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        this.visit(ctx.fadeFunction[0] as CstNode, errors);
    }

    scaleCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        this.imageFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "scale",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        this.visit(ctx.imageScale[0] as CstNode, errors);

        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The value here should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    moveCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        this.imageFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "move",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        this.visit(ctx.movement[0] as CstNode, errors);

        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The value here should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    playCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        this.musicFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: ctx.loop ? "loop" : "play",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The value here should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    stopCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        this.musicFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "stop",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The value here should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    volumeCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        this.musicFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "volume",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        let vT = ctx.volumeAfter[0] as IToken;
        let volumeAfter = Number.parseFloat(vT.image);

        if (volumeAfter < 0) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The value here should be no less than 0.`,
                range: transformRange(vT)
            });
        } else if (volumeAfter > 1) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The value here should be no more than 1.`,
                range: transformRange(vT)
            });
        }

        let timeT = ctx.transitionTime[0] as IToken;
        let transitionTime = Number.parseFloat(timeT.image);

        if (transitionTime < 0) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The value here should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    sayCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        let content = ctx.content[0] as IToken;
        if (content.endLine - content.startLine >= 3) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The say content should be no more than 3 lines.`,
                range: transformRange(content)
            });
        }
    }

    waitCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        let timeT = ctx.time[0] as IToken;
        let time = Number.parseFloat(timeT.image);

        if (time < 0) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The value here should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    autoCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        let timeT = ctx.time[0] as IToken;
        let time = Number.parseFloat(timeT.image);

        if (time < 0) {
            errors.push({
                severity: DiagnosticSeverity.Warning,
                message: `The value here should be no less than 0.`,
                range: transformRange(timeT)
            });
        }
    }

    vns(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        // initialize lists
        this.imageFileList = [];
        this.musicFileList = [];

        // visit all commands
        ctx.showCommand.forEach((value) => { this.visit(value as CstNode, errors); });
        ctx.hideCommand.forEach((value) => { this.visit(value as CstNode, errors); });
        ctx.scaleCommand.forEach((value) => { this.visit(value as CstNode, errors); });
        ctx.moveCommand.forEach((value) => { this.visit(value as CstNode, errors); });
        ctx.playCommand.forEach((value) => { this.visit(value as CstNode, errors); });
        ctx.stopCommand.forEach((value) => { this.visit(value as CstNode, errors); });
        ctx.volumeCommand.forEach((value) => { this.visit(value as CstNode, errors); });
        ctx.sayCommand.forEach((value) => { this.visit(value as CstNode, errors); });
        ctx.waitCommand.forEach((value) => { this.visit(value as CstNode, errors); });
        ctx.autoCommand.forEach((value) => { this.visit(value as CstNode, errors); });

        // check file paths
        checkFilepaths(this.imageFileList, this.musicFileList, errors);
    }
}

const transformRange = (token: IToken): Range => {
    return {
        start: { line: token.startLine - 1, character: token.startColumn - 1 },
        end: { line: token.endLine - 1, character: token.endColumn }
    };
};

const checkFilepaths = (imageFileList: FileContent[], musicFileList: FileContent[], errors: Diagnostic[]): void => {
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
                imageStack.push(image);
                break;
            case "scale":
            case "move":
                idx = backFindIndex(imageStack, i => i.filePath === image.filePath);
                if (idx < 0) {
                    errors.push({
                        severity: DiagnosticSeverity.Warning,
                        message: `Cannot find currently showing instance of ${image.filePath}.`,
                        range: image.range
                    });
                }
                break;
            case "hide":
                idx = backFindIndex(imageStack, i => i.filePath === image.filePath);
                if (idx < 0) {
                    errors.push({
                        severity: DiagnosticSeverity.Warning,
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
                musicStack.push(music);
                break;
            case "volume":
                idx = backFindIndex(musicStack, i => i.filePath === music.filePath);
                if (idx < 0) {
                    errors.push({
                        severity: DiagnosticSeverity.Warning,
                        message: `Cannot find currently playing instance of ${music.filePath}.`,
                        range: music.range
                    });
                }
                break;
            case "stop":
                idx = backFindIndex(musicStack, i => i.filePath === music.filePath);
                if (idx < 0) {
                    errors.push({
                        severity: DiagnosticSeverity.Warning,
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
export const checkVNS = (vns: CstNode): Diagnostic[] => {
    let errors: Diagnostic[] = [];
    checker.visit(vns, errors);
    return errors;
};
