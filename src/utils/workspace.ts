import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export const isValidWorkspace: boolean = (function(): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return false;
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const filesToCheck = [
        'package.json',
        'index.html',
        'static/',
    ];
    for (const fileName of filesToCheck) {
        const fullPath = path.join(workspaceRoot, fileName);
        if (!fs.existsSync(fullPath)) {
            vscode.window.showErrorMessage(
                vscode.l10n.t('Not a markdown-blog workspace.'));
            return false;
        }
    }
    return true;
})();
