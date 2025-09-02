import * as vscode from 'vscode';
import { NamingSuggestor } from './namingSuggestor';

export function activate(context: vscode.ExtensionContext) {
    console.log('Naming Suggestor extension is now active!');

    const namingSuggestor = new NamingSuggestor();

    const disposable = vscode.commands.registerCommand('namingSuggestor.suggestNames', async () => {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor found');
                return;
            }

            const selection = editor.selection;
            if (selection.isEmpty) {
                vscode.window.showWarningMessage('Please select code to get naming suggestions');
                return;
            }

            const selectedText = editor.document.getText(selection);
            await namingSuggestor.suggestNames(editor, selectedText);
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    console.log('Naming Suggestor extension is now deactivated');
}