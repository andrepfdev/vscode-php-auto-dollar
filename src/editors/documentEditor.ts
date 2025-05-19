import * as vscode from 'vscode';

/**
 * Aplica as edições ao documento
 * 
 * @param document O documento a ser editado
 * @param edits Lista de edições a serem aplicadas
 */
export async function applyEditsToDocument(
    document: vscode.TextDocument, 
    edits: vscode.TextEdit[]
): Promise<void> {
    if (edits.length === 0) {
        return;
    }
    
    const workspaceEdit = new vscode.WorkspaceEdit();
    
    edits.forEach(textEdit => {
        workspaceEdit.insert(document.uri, textEdit.range.start, textEdit.newText);
    });
    
    await vscode.workspace.applyEdit(workspaceEdit);
}