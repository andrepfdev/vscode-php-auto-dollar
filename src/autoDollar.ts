import * as vscode from 'vscode';
import * as path from 'path';

export function activateExtension(context: vscode.ExtensionContext) {
    console.log('A extensão "php-auto-dollar" foi ativada!');

    let disposable = vscode.commands.registerCommand('php-auto-dollar.addDollarSigns', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            addDollarSigns(editor);
        }
    });

    context.subscriptions.push(disposable);

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

function isPhpOpeningTag(text: string, index: number): boolean {
    const slice = text.slice(Math.max(0, index - 3), index + 3);
    return slice.startsWith('<?') && slice.includes('php');
}

async function addDollarSigns(editor: vscode.TextEditor): Promise<vscode.TextEdit[]> {
    const document = editor.document;
    const text = document.getText();
    const edits: vscode.TextEdit[] = [];

    const assignmentRegex = /\b(?<![\$\\])([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|\.=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=)/g;
    const functionParamRegex = /function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(\s*(?:[^)(]*?(?:,\s*)?)?(?<![\$\\])([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*(?:,|\)))/g;
    const variableUsageRegex = /(?<![.\$\"'\w]|\bfunction\s+)([a-zA-Z_][a-zA-Z0-9_]*)(?!\s*\(|\s*=|\s*:)(?=\s*[\.,;\)\]}\s]|$)/g;
    const classKeywordRegex = /(?:class|interface|trait)\s+([a-zA-Z_][a-zA-Z0-9_]*)|new\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;

    const phpKeywords = [
        'echo', 'print', 'if', 'else', 'elseif', 'while', 'do', 'for', 'foreach', 'switch',
        'case', 'break', 'continue', 'return', 'require', 'include', 'require_once', 'include_once',
        'function', 'class', 'new', 'public', 'private', 'protected', 'static', 'final',
        'abstract', 'interface', 'trait', 'namespace', 'use', 'extends', 'implements',
        'const', 'true', 'false', 'null', 'self', 'parent', 'global', 'as',
        // Tipos primitivos
        'int', 'float', 'string', 'bool', 'boolean', 'array', 'object', 'mixed', 'void', 'iterable', 'never', 'callable'
    ];

    // Coletar nomes de classes/interfaces/traits
    const classNames = new Set<string>();
    let classMatch;
    while ((classMatch = classKeywordRegex.exec(text)) !== null) {
        const className = classMatch[1] || classMatch[2];
        if (className) {
            classNames.add(className);
        }
    }

    let match;

    while ((match = assignmentRegex.exec(text)) !== null) {
        const varName = match[1];
        if (!phpKeywords.includes(varName.toLowerCase()) &&
            !classNames.has(varName) &&
            !isPhpOpeningTag(text, match.index)) {
            const position = document.positionAt(match.index);
            const edit = vscode.TextEdit.insert(position, '$');
            edits.push(edit);
        }
    }

    while ((match = functionParamRegex.exec(text)) !== null) {
        const varName = match[1];
        const paramPosition = text.indexOf(varName, match.index);
        if (!phpKeywords.includes(varName.toLowerCase()) &&
            !classNames.has(varName) &&
            !isPhpOpeningTag(text, paramPosition)) {
            const position = document.positionAt(paramPosition);
            const edit = vscode.TextEdit.insert(position, '$');
            edits.push(edit);
        }
    }

    while ((match = variableUsageRegex.exec(text)) !== null) {
        const varName = match[1];
        const matchIndex = match.index;
        const line = document.lineAt(document.positionAt(matchIndex).line);
        const lineText = line.text;
        const posInLine = document.positionAt(matchIndex).character;

        let inComment = false;
        let inString = false;
        let stringChar = '';

        for (let i = 0; i < posInLine; i++) {
            if (lineText.substring(i, i + 2) === '//') {
                inComment = true;
                break;
            } else if (!inString && (lineText[i] === "'" || lineText[i] === '"')) {
                inString = true;
                stringChar = lineText[i];
            } else if (inString && lineText[i] === stringChar && lineText[i - 1] !== '\\') {
                inString = false;
            }
        }

        if (!phpKeywords.includes(varName.toLowerCase()) &&
            !classNames.has(varName) &&
            !inComment &&
            !inString &&
            !isPhpOpeningTag(text, matchIndex)) {
            const position = document.positionAt(matchIndex);
            const edit = vscode.TextEdit.insert(position, '$');
            edits.push(edit);
        }
    }

    if (edits.length > 0) {
        const edit = new vscode.WorkspaceEdit();
        edits.forEach(textEdit => {
            edit.insert(document.uri, textEdit.range.start, textEdit.newText);
        });
        await vscode.workspace.applyEdit(edit);
    }

    return edits;
}