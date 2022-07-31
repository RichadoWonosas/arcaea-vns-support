import { EOF } from "chevrotain";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";

import { TextDocument } from "vscode-languageserver-textdocument";

import { vnsLexer } from "./lexer";
import { vnsParser } from "./parser";
import { checkVNS } from "./checker";
import { VNSFile } from "./types";

export const inspectVNS = (file: TextDocument): { file: VNSFile, errors: Diagnostic[] } => {
    let errors: Diagnostic[] = [];
    let fileResult: VNSFile = null;

    // TODO: inspect vns file
    const text = file.getText();
    const lexingResult = vnsLexer.tokenize(text);

    if (lexingResult.errors.length > 0) {
        errors = errors.concat(lexingResult.errors.map((e) => ({
            severity: DiagnosticSeverity.Error,
            message: e.message,
            range: {
                start: { line: e.line - 1, character: e.column - 1 },
                end: file.positionAt(file.offsetAt({ line: e.line - 1, character: e.column - 1 }) + e.length)
            }
        })));
    }

    vnsParser.input = lexingResult.tokens;
    const parsingResult = vnsParser.vns();

    if (vnsParser.errors.length > 0) {
        // shoot errors
        errors = errors.concat(vnsParser.errors.map((e) => ({
            severity: DiagnosticSeverity.Error,
            message: e.message,
            range: e.token.tokenType === EOF ? {
                start: file.positionAt(text.length),
                end: file.positionAt(text.length)
            } : {
                start: { line: e.token.startLine - 1, character: e.token.startColumn - 1 },
                end: { line: e.token.endLine - 1, character: e.token.endColumn }
            }
        })));
    } else {
        // check values
        const checkResult = checkVNS(parsingResult, file.uri);
        fileResult = { events: checkResult.commands };
        errors = errors.concat(checkResult.errors);
    }

    return { file: fileResult, errors: errors };
};
