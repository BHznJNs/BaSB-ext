import * as vscode from 'vscode';
import {
    registerTerminalCommand,
    registerSummaryCommand,
    registerImportResourcesCommand,
} from './commands';

export function activate(context: vscode.ExtensionContext) {
    registerTerminalCommand(context);
    registerSummaryCommand(context);
    registerImportResourcesCommand(context);

    vscode.commands.executeCommand('markdown-blog-ext.preview');
}

export function deactivate() {}
