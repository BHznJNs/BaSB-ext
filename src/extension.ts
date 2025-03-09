import * as vscode from 'vscode';
import {
    registerTerminalCommand,
    registerSummaryCommand,
    registerImportResourcesCommand,
} from './commands';
import { isValidWorkspace } from './utils/workspace';

export function activate(context: vscode.ExtensionContext) {
    registerTerminalCommand(context);
    registerSummaryCommand(context);
    registerImportResourcesCommand(context);

    if (isValidWorkspace) {
        vscode.commands.executeCommand('basb-ext.preview');
    }
}

export function deactivate() {}
