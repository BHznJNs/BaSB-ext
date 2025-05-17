import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { isValidWorkspace } from '../utils/workspace';

export default function registerImportResourcesCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('basb-ext.create-drawio-diagram', async () => {
        if (!isValidWorkspace) {
            vscode.window.showErrorMessage(
                vscode.l10n.t('Not a BaSB workspace.'));
            return;
        }
        const result = await vscode.window.showInputBox({
            placeHolder: 'Input diagram file name'
        });
        if (result === undefined) return;

        const editor = vscode.window.activeTextEditor!;
        const editingPath = editor.document.uri.fsPath;
        const editingFileNameWithoutExt = path.basename(editingPath, path.extname(editingPath));
        const parentPath = path.dirname(editingPath);
        const resourceFolderPath = parentPath + '/.' + editingFileNameWithoutExt;
        if (!fs.existsSync(resourceFolderPath)) {
            fs.mkdirSync(resourceFolderPath);
        }
        const fileName = `${result}.drawio.svg`;
        const targetPath = path.join(resourceFolderPath, fileName);
        try {
            fs.writeFileSync(targetPath, '');
        } catch (err) {
            vscode.window.showErrorMessage(
                `Failed to create file: ${fileName}`);
        }

        // insert text
        const relativePath = `.${editingFileNameWithoutExt}/${fileName}`;
        const insertedText = `![${result}](${relativePath})`
        await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, insertedText)})

        await vscode.commands.executeCommand(
            'vscode.open',
            vscode.Uri.file(targetPath),
        );
    });
    context.subscriptions.push(disposable);
}
