import * as vscode from 'vscode';
import { isValidWorkspace } from '../utils/workspace';

function registerCommand(context: vscode.ExtensionContext, commandName: string, terminalCommand: string) {
    const disposable = vscode.commands.registerCommand('basb-ext.' + commandName, () => {
        const workspaceFolders = vscode.workspace.workspaceFolders as vscode.WorkspaceFolder[];
        if (workspaceFolders.length === 0) {
            vscode.window.showErrorMessage(
                vscode.l10n.t('No workspace folder is open. Please open a folder and try again.'));
            return;
        }
        if (!isValidWorkspace) {
            vscode.window.showErrorMessage(
                vscode.l10n.t('Not a BaSB workspace.'));
            return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const terminalName = commandName === "preview" ? "BaSB preview" : "BaSB command";
        const terminal = vscode.window.terminals.find(t => t.name === terminalName) ||
                         vscode.window.createTerminal(terminalName);
        terminal.show();
        terminal.sendText(`cd "${workspaceRoot}"`);
        terminal.sendText(terminalCommand);
    });
    context.subscriptions.push(disposable);
}

export default function registerTerminalCommand(context: vscode.ExtensionContext) {
    const commandList = [
        ['prepublish', 'basb-cli build; basb-cli count; basb-cli backup'],
        ['build'     , 'basb-cli build'   ],
        ['indexing'  , 'basb-cli indexing'],
        ['count'     , 'basb-cli count'   ],
        ['backup'    , 'basb-cli backup'  ],
        ['restore'   , 'basb-cli restore' ],
        ['preview'   , 'basb-cli preview' ],
        ['watch'     , 'basb-cli watch'   ],
    ];
    for (const [commandName, terminalCommand] of commandList) {
        registerCommand(context, commandName, terminalCommand);
    }
}
