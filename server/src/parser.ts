import { vnsToken } from "./lexer";
import { CstParser, EOF } from "chevrotain";

class VNSParser extends CstParser {
    constructor() {
        super(vnsToken, { recoveryEnabled: true, nodeLocationTracking: "full" });
        this.performSelfAnalysis();
    }

    public xyValue = this.RULE("xyValue", () => {
        this.CONSUME1(vnsToken.numberContent, { LABEL: "x" });
        this.CONSUME(vnsToken.colon);
        this.CONSUME2(vnsToken.numberContent, { LABEL: "y" });
    });

    public fadeFunction = this.RULE("fadeFunction", () => {
        this.CONSUME(vnsToken.fade);
        this.CONSUME(vnsToken.leftBrace);
        this.CONSUME(vnsToken.numberContent, { LABEL: "transitionTime" });
        this.CONSUME(vnsToken.comma);
        this.CONSUME(vnsToken.transition, { LABEL: "transition" });
        this.CONSUME(vnsToken.rightBrace);
    });

    public showCommand = this.RULE("showCommand", () => {
        this.CONSUME(vnsToken.show);
        this.CONSUME(vnsToken.stringContent, { LABEL: "filePath" });
        this.SUBRULE1(this.xyValue, { LABEL: "imagePosition" });
        this.SUBRULE2(this.xyValue, { LABEL: "canvasPivot" });
        this.SUBRULE3(this.xyValue, { LABEL: "imageScale" });
        this.OPTION1(() => {
            this.SUBRULE(this.fadeFunction);
        });
        this.CONSUME(vnsToken.drawing, { LABEL: "drawing" });
        this.OPTION2(() => {
            this.CONSUME(vnsToken.scale, { LABEL: "scale" });
        });
    });

    public hideCommand = this.RULE("hideCommand", () => {
        this.CONSUME(vnsToken.hide);
        this.CONSUME(vnsToken.stringContent, { LABEL: "filePath" });
        this.SUBRULE(this.fadeFunction);
    });

    public scaleCommand = this.RULE("scaleCommand", () => {
        this.CONSUME(vnsToken.scale);
        this.CONSUME(vnsToken.stringContent, { LABEL: "filePath" });
        this.SUBRULE(this.xyValue, { LABEL: "imageScale" });
        this.CONSUME(vnsToken.numberContent, { LABEL: "transitionTime" });
        this.CONSUME(vnsToken.transition, { LABEL: "transition" });
    });

    public moveCommand = this.RULE("moveCommand", () => {
        this.CONSUME(vnsToken.move);
        this.CONSUME(vnsToken.stringContent, { LABEL: "filePath" });
        this.SUBRULE(this.xyValue, { LABEL: "movement" });
        this.CONSUME(vnsToken.numberContent, { LABEL: "transitionTime" });
        this.CONSUME(vnsToken.transition, { LABEL: "transition" });
    });

    public playCommand = this.RULE("playCommand", () => {
        this.CONSUME(vnsToken.play);
        this.CONSUME(vnsToken.stringContent, { LABEL: "filePath" });
        this.CONSUME1(vnsToken.numberContent, { LABEL: "transitionTime" });
        this.OPTION1(() => {
            this.CONSUME(vnsToken.loop, { LABEL: "loop" });
            this.OPTION2(() => {
                this.CONSUME2(vnsToken.numberContent, { LABEL: "loopStartTime" });
                this.CONSUME(vnsToken.colon);
                this.CONSUME3(vnsToken.numberContent, { LABEL: "loopEndTime" });
            });
        });
    });

    public stopCommand = this.RULE("stopCommand", () => {
        this.CONSUME(vnsToken.stop);
        this.CONSUME(vnsToken.stringContent, { LABEL: "filePath" });
        this.CONSUME(vnsToken.numberContent, { LABEL: "transitionTime" });
    });

    public volumeCommand = this.RULE("volumeCommand", () => {
        this.CONSUME(vnsToken.volume);
        this.CONSUME(vnsToken.stringContent, { LABEL: "filePath" });
        this.CONSUME1(vnsToken.numberContent, { LABEL: "volumeAfter" });
        this.CONSUME2(vnsToken.numberContent, { LABEL: "transitionTime" });
    });

    public sayCommand = this.RULE("sayCommand", () => {
        this.CONSUME(vnsToken.say);
        this.CONSUME(vnsToken.stringContent, { LABEL: "content" });
    });

    public waitCommand = this.RULE("waitCommand", () => {
        this.CONSUME(vnsToken.wait);
        this.CONSUME(vnsToken.numberContent, { LABEL: "time" });
        this.OPTION(() => {
            this.CONSUME(vnsToken.clear, { LABEL: "clear" });
        });
    });

    public autoCommand = this.RULE("autoCommand", () => {
        this.CONSUME(vnsToken.auto);
        this.CONSUME(vnsToken.numberContent, { LABEL: "time" });
    });

    public hideTextboxCommand = this.RULE("hideTextboxCommand", () => {
        this.CONSUME(vnsToken.hidetextbox);
    });

    public unloadTexturesCommand = this.RULE("unloadTexturesCommand", () => {
        this.CONSUME(vnsToken.unloadtextures);
    });

    public endlineCommand = this.RULE("endlineCommand", () => {
        this.CONSUME(vnsToken.endline);
    });

    public vns = this.RULE("vns", () => {
        this.MANY_SEP({
            DEF: () => {
                this.OR([
                    { ALT: () => this.CONSUME(EOF) },
                    { ALT: () => this.SUBRULE(this.hideTextboxCommand) },
                    { ALT: () => this.SUBRULE(this.unloadTexturesCommand) },
                    { ALT: () => this.SUBRULE(this.showCommand) },
                    { ALT: () => this.SUBRULE(this.hideCommand) },
                    { ALT: () => this.SUBRULE(this.scaleCommand) },
                    { ALT: () => this.SUBRULE(this.moveCommand) },
                    { ALT: () => this.SUBRULE(this.playCommand) },
                    { ALT: () => this.SUBRULE(this.stopCommand) },
                    { ALT: () => this.SUBRULE(this.volumeCommand) },
                    { ALT: () => this.SUBRULE(this.sayCommand) },
                    { ALT: () => this.SUBRULE(this.waitCommand) },
                    { ALT: () => this.SUBRULE(this.autoCommand) },
                ]);
            },
            SEP: vnsToken.endline
        });
        // this.OPTION(() => {
        //     this.MANY1(() => {
        //         this.OR1([
        //             { ALT: () => this.CONSUME(vnsToken.endline) },
        //         ]);
        //     });
        // });
    });
}

export const vnsParser = new VNSParser();
export const BaseVNSVisitor = vnsParser.getBaseCstVisitorConstructorWithDefaults();
