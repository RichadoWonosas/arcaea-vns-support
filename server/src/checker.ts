import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { CstChildrenDictionary, IToken, CstNode, ICstVisitor, CstNodeLocation } from "chevrotain";
import { BaseVNSVisitor } from "./parser";
import { vnsToken } from "./lexer";

let imageFileList: { filePath: String, range: Range, operation: String }[] = [];
let imageFileStack: String[] = [];
let musicFileList: { filePath: String, range: Range, operation: String }[] = [];
let musicFileStack: String[] = [];

class VNSChecker extends BaseVNSVisitor {
    constructor() {
        super();
        this.validateVisitor();
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
        imageFileList.push({
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
        imageFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "hide",
            range: transformRange(ctx.filePath[0] as IToken)
        });

        this.visit(ctx.fadeFunction[0] as CstNode, errors);
    }

    scaleCommand(ctx: CstChildrenDictionary, errors: Diagnostic[]) {
        imageFileList.push({
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
        imageFileList.push({
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
        musicFileList.push({
            filePath: (ctx.filePath[0] as IToken).image,
            operation: "play",
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
        musicFileList.push({
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
        musicFileList.push({
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
        console.log(ctx);
        this.visit(ctx.showCommand as CstNode[], errors);
        this.visit(ctx.hideCommand as CstNode[], errors);
        this.visit(ctx.scaleCommand as CstNode[], errors);
        this.visit(ctx.moveCommand as CstNode[], errors);
        this.visit(ctx.playCommand as CstNode[], errors);
        this.visit(ctx.stopCommand as CstNode[], errors);
        this.visit(ctx.volumeCommand as CstNode[], errors);
        this.visit(ctx.sayCommand as CstNode[], errors);
        this.visit(ctx.waitCommand as CstNode[], errors);
        this.visit(ctx.autoCommand as CstNode[], errors);
    }
}

const transformRange = (token: IToken): Range => {
    return {
        start: { line: token.startLine - 1, character: token.startColumn - 1 },
        end: { line: token.endLine - 1, character: token.endColumn }
    };
};

const checker = new VNSChecker();
export const checkVNS = (vns: CstNode): Diagnostic[] => {
    let errors: Diagnostic[] = [];
    checker.visit(vns, errors);
    return errors;
};
