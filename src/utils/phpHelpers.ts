import * as vscode from 'vscode';

/**
 * Lista de palavras-chave do PHP que não devem receber o prefixo $
 */
export const PHP_KEYWORDS = [
    'echo', 'print', 'if', 'else', 'elseif', 'while', 'do', 'for', 'foreach', 'switch',
    'case', 'break', 'continue', 'return', 'require', 'include', 'require_once', 'include_once',
    'function', 'class', 'new', 'public', 'private', 'protected', 'static', 'final',
    'abstract', 'interface', 'trait', 'namespace', 'use', 'extends', 'implements',
    'const', 'true', 'false', 'null', 'self', 'parent', 'global', 'as',
    // Tipos primitivos
    'int', 'float', 'string', 'bool', 'boolean', 'array', 'object', 'mixed', 'void', 'iterable', 'never', 'callable'
];

/**
 * Verifica se um determinado texto contém uma tag de abertura PHP
 * 
 * @param text Texto completo do documento
 * @param index Posição atual no texto
 * @returns Verdadeiro se for uma tag de abertura PHP
 */
export function isPhpOpeningTag(text: string, index: number): boolean {
    const slice = text.slice(Math.max(0, index - 3), index + 3);
    return slice.startsWith('<?') && slice.includes('php');
}

/**
 * Coleta todos os nomes de classes, interfaces e traits do documento
 * 
 * @param text Texto completo do documento
 * @returns Conjunto com os nomes de classes/interfaces/traits encontrados
 */
export function collectClassNames(text: string): Set<string> {
    const classNames = new Set<string>();
    const classKeywordRegex = /(?:class|interface|trait)\s+([a-zA-Z_][a-zA-Z0-9_]*)|new\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;

    let match;
    while ((match = classKeywordRegex.exec(text)) !== null) {
        const className = match[1] || match[2];
        if (className) {
            classNames.add(className);
        }
    }

    return classNames;
}