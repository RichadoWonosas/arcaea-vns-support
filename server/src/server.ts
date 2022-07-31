import {
    createConnection,
    TextDocuments,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult,
    DocumentColorRequest,
    HandlerResult,
    Hover
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { inspectVNS } from './inspector';

import { VNSFile } from "./types";
import { checkHoverInfo } from './hover';

let connection = createConnection(ProposedFeatures.all);

let documents = new TextDocuments(TextDocument);

const documentElements: Map<string, VNSFile> = new Map();

// adjust paramters for initializing
connection.onInitialize((params) => {
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            hoverProvider: true
        }
    };
});

// register configuration notification channel to listen
connection.onInitialized(() => {
    connection.client.register(DidChangeConfigurationNotification.type);
});

// reinspect all files when configs has been changed
connection.onDidChangeConfiguration((change) => {
    console.log(`config has been changed`);
    // inspect all files
    documents.all().forEach(inspect);
});

// reinspect changed files
documents.onDidChangeContent((change) => {
    console.log(`${change.document.uri} has been changed`);
    // inspect changed files
    inspect(change.document);
});

// clear diagnostics when closing document
documents.onDidClose((change) => {
    console.log(`${change.document.uri} has been closed`);
    connection.sendDiagnostics({
        uri: change.document.uri,
        diagnostics: []
    });
});

// show hover infos
connection.onHover((params, token, workDoneProgress, resultProgress?): HandlerResult<Hover, null> => {
    let result: Hover = null;

    // TODO: query for hover infos
    let file = params.textDocument;
    if (documentElements.has(file.uri)) {
        result = { contents: checkHoverInfo(documentElements.get(file.uri), params.position) };
        if (result.contents === null) {
            result = null;
        }
    }

    return result;
});

// inspect files asynchronically
const inspect = async (file: TextDocument) => {
    const inspectResult = inspectVNS(file);

    connection.sendDiagnostics({
        uri: file.uri,
        diagnostics: inspectResult.errors
    });

    if (documentElements.has(file.uri)) {
        documentElements.delete(file.uri);
    }
    documentElements.set(file.uri, inspectResult.file);
};

// register listeners
documents.listen(connection);
connection.listen();
