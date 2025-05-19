import * as vscode from 'vscode';
import * as path from 'path';
import { detectVariables } from './detectors/variableDetector';
import { applyEditsToDocument } from './editors/documentEditor';

export function activateExtension(context: vscode.ExtensionContext) {

    // Registrar comando para adicionar cifrões manualmente
    let disposable = vscode.commands.registerCommand('php-auto-dollar.addDollarSigns', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            addDollarSigns(editor);
        }
    });

    context.subscriptions.push(disposable);

    // Adicionar cifrões automaticamente ao salvar arquivos PHP
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument(event => {
            if (path.extname(event.document.fileName).toLowerCase() === '.php') {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document === event.document) {
                    event.waitUntil(Promise.resolve(addDollarSigns(editor)));
                }
            }
        })
    );
}

async function addDollarSigns(editor: vscode.TextEditor): Promise<vscode.TextEdit[]> {
    const document = editor.document;

    // Detectar variáveis e gerar edits
    const edits = detectVariables(document);

    // Aplicar as edições ao documento
    if (edits.length > 0) {
        await applyEditsToDocument(document, edits);
    }

    return edits;
}