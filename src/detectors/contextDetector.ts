import * as vscode from 'vscode';

/**
 * Verifica se uma posição em uma linha de texto está dentro de um comentário
 * ou string, contextos onde não queremos adicionar cifrões
 * 
 * @param lineText O texto da linha atual
 * @param posInLine A posição na linha para verificar
 * @returns Objeto indicando se está em comentário ou string
 */
export function detectContext(lineText: string, posInLine: number): { 
    inComment: boolean, 
    inString: boolean 
} {
    let inComment = false;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < posInLine; i++) {
        // Detecta comentários de linha única
        if (lineText.substring(i, i + 2) === '//') {
            inComment = true;
            break;
        } 
        // Detecta o início de uma string
        else if (!inString && (lineText[i] === "'" || lineText[i] === '"')) {
            inString = true;
            stringChar = lineText[i];
        } 
        // Detecta o fim de uma string (considerando escapes)
        else if (inString && lineText[i] === stringChar && lineText[i - 1] !== '\\') {
            inString = false;
        }
    }

    return { inComment, inString };
}