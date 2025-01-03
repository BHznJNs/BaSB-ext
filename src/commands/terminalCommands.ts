import * as vscode from 'vscode';
import { isValidWorkspace } from '../utils/workspace';

function registerCommand(context: vscode.ExtensionContext, commandName: string, terminalCommand: string) {
    const disposable = vscode.commands.registerCommand('markdown-blog-ext.' + commandName, () => {
        const workspaceFolders = vscode.workspace.workspaceFolders as vscode.WorkspaceFolder[];
        if (!isValidWorkspace) {
            return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const terminalName = commandName === "preview" ? "markdown-blog preview" : "markdown-blog command";
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
        ['prepublish', 'npm run build; npm run count; npm run backup'],
        ['build'     , 'npm run build'   ],
        ['indexing'  , 'npm run indexing'],
        ['count'     , 'npm run count'   ],
        ['backup'    , 'npm run backup'  ],
        ['restore'   , 'npm run restore' ],
        ['preview'   , 'npm run preview' ],
    ];
    for (const [commandName, terminalCommand] of commandList) {
        registerCommand(context, commandName, terminalCommand);
    }
}
