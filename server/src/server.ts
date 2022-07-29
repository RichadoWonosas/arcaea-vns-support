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
    DocumentColorRequest
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { inspectVNS } from './inspector';

let connection = createConnection(ProposedFeatures.all);

let documents = new TextDocuments(TextDocument);

// adjust paramters for initializing
connection.onInitialize((params) => {
    return { capabilities: { textDocumentSync: TextDocumentSyncKind.Full } };
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

// inspect files asynchronically
const inspect = async (file: TextDocument) => {
    const errors = inspectVNS(file);

    connection.sendDiagnostics({
        uri: file.uri,
        diagnostics: errors
    });
};

// register listeners
documents.listen(connection);
connection.listen();
