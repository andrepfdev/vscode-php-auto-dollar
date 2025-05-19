import * as vscode from 'vscode';
import { PHP_KEYWORDS, isPhpOpeningTag, collectClassNames } from '../utils/phpHelpers';
import { detectContext } from './contextDetector';

/**
 * Define expressões regulares para diferentes tipos de variáveis PHP
 */
const REGEX = {
    // Variáveis em atribuições (ex: nome = valor)
    assignment: /\b(?<![\$\\])([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|\.=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=)/g,
    
    // Parâmetros de função (ex: function test(param))
    functionParam: /function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(\s*(?:[^)(]*?(?:,\s*)?)?(?<![\$\\])([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*(?:,|\)))/g,
    
    // Uso de variáveis (ex: echo nome;)
    variableUsage: /(?<![.\$\"'\w]|\bfunction\s+)([a-zA-Z_][a-zA-Z0-9_]*)(?!\s*\(|\s*=|\s*:)(?=\s*[\.,;\)\]}\s]|$)/g
};

/**
 * Detecta todas as variáveis no documento e gera edits para adicionar cifrões
 * 
 * @param document O documento a ser analisado
 * @returns Array de TextEdit para adicionar os cifrões
 */
export function detectVariables(document: vscode.TextDocument): vscode.TextEdit[] {
    const text = document.getText();
    const edits: vscode.TextEdit[] = [];
    
    // Coletar nomes de classes para evitar adicionar $ a eles
    const classNames = collectClassNames(text);
    
    // Processar variáveis em atribuições
    processAssignmentVariables(document, text, classNames, edits);
    
    // Processar parâmetros de funções
    processFunctionParameters(document, text, classNames, edits);
    
    // Processar uso de variáveis
    processVariableUsage(document, text, classNames, edits);
    
    return edits;
}

/**
 * Processa variáveis em expressões de atribuição
 */
function processAssignmentVariables(
    document: vscode.TextDocument, 
    text: string, 
    classNames: Set<string>, 
    edits: vscode.TextEdit[]
): void {
    let match;
    while ((match = REGEX.assignment.exec(text)) !== null) {
        const varName = match[1];
        if (!shouldSkipVariable(varName, classNames) && 
            !isPhpOpeningTag(text, match.index)) {
            const position = document.positionAt(match.index);
            edits.push(vscode.TextEdit.insert(position, '$'));
        }
    }
}

/**
 * Processa parâmetros de funções
 */
function processFunctionParameters(
    document: vscode.TextDocument, 
    text: string, 
    classNames: Set<string>, 
    edits: vscode.TextEdit[]
): void {
    let match;
    while ((match = REGEX.functionParam.exec(text)) !== null) {
        const varName = match[1];
        const paramPosition = text.indexOf(varName, match.index);
        if (!shouldSkipVariable(varName, classNames) && 
            !isPhpOpeningTag(text, paramPosition)) {
            const position = document.positionAt(paramPosition);
            edits.push(vscode.TextEdit.insert(position, '$'));
        }
    }
}

/**
 * Processa uso de variáveis
 */
function processVariableUsage(
    document: vscode.TextDocument, 
    text: string, 
    classNames: Set<string>, 
    edits: vscode.TextEdit[]
): void {
    let match;
    while ((match = REGEX.variableUsage.exec(text)) !== null) {
        const varName = match[1];
        const matchIndex = match.index;
        const line = document.lineAt(document.positionAt(matchIndex).line);
        const lineText = line.text;
        const posInLine = document.positionAt(matchIndex).character;

        // Verificar se está em comentário ou string
        const { inComment, inString } = detectContext(lineText, posInLine);

        if (!shouldSkipVariable(varName, classNames) && 
            !inComment && 
            !inString && 
            !isPhpOpeningTag(text, matchIndex)) {
            const position = document.positionAt(matchIndex);
            edits.push(vscode.TextEdit.insert(position, '$'));
        }
    }
}

/**
 * Verifica se a variável deve ser ignorada (palavra-chave PHP ou nome de classe)
 */
function shouldSkipVariable(varName: string, classNames: Set<string>): boolean {
    return PHP_KEYWORDS.includes(varName.toLowerCase()) || classNames.has(varName);
}