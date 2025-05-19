import * as vscode from 'vscode';
import { activateExtension } from './autoDollar';

export function activate(context: vscode.ExtensionContext) {
    activateExtension(context);
}

export function deactivate() {
    //
}