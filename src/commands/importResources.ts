import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { audioExtArr, imageExtArr, videoExtArr } from '../utils/file';
import { isValidWorkspace } from '../utils/workspace';

export default function registerImportResourcesCommand(context: vscode.ExtensionContext) {
    interface IInsertMediaFile {
        useFilenameAsAlt?: boolean,
        insertNewline?: boolean,
        editCallback?: (editor: vscode.TextEditor) => any,
    }
    async function insertMediaFile(editor: vscode.TextEditor, filePath: string, options: IInsertMediaFile={}) {
        const {
            useFilenameAsAlt=true,
            insertNewline=false,
            editCallback=() => {},
        } = options;

        const fileNameWithoutExt = path.basename(filePath, path.extname(filePath));
        const extname = path.extname(filePath).replace('.', '');
        let insertedText;
        if (imageExtArr.includes(extname)) {
            insertedText = `![${useFilenameAsAlt ? fileNameWithoutExt : ''}](${filePath})`;
        } else if (audioExtArr.includes(extname)) {
            insertedText = `:[${useFilenameAsAlt ? fileNameWithoutExt : ''}](${filePath})`;
        } else if (videoExtArr.includes(extname)) {
            insertedText = `?[${useFilenameAsAlt ? fileNameWithoutExt : ''}](${filePath})`;
        } else { return; }

        if (insertNewline) {
            insertedText += '\n';
        }
        await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, insertedText);})
        editCallback(editor);
    }

    const disposable = vscode.commands.registerCommand('basb-ext.import-resources', async () => {
        if (!isValidWorkspace) {
            vscode.window.showErrorMessage(
                vscode.l10n.t('Not a BaSB workspace.'));
            return;
        }
        const files = await vscode.window.showOpenDialog({
            canSelectMany: true,
            canSelectFiles: true,
            canSelectFolders: false,
            filters: {
              'Media Files': imageExtArr.concat(audioExtArr, videoExtArr)
            },
            openLabel: 'Select Media Files'
        });
        if (!files || files.length === 0) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        const editingPath = editor!.document.uri.fsPath;
        const editingFileNameWithoutExt = path.basename(editingPath, path.extname(editingPath));
        const parentPath = path.dirname(editingPath);
        const resourceFolderPath = parentPath + '/.' + editingFileNameWithoutExt;
        if (!fs.existsSync(resourceFolderPath)) {
            fs.mkdirSync(resourceFolderPath);
        }
        if (files.length === 0) {
            return;
        }
        if (files.length === 1) {
            const currentFileName = files[0].fsPath;
            const extname = path.extname(currentFileName);
            const fileNameWithoutExt = path.basename(currentFileName, extname);
            const newFilenameWithoutExt = await vscode.window.showInputBox({
                prompt: 'Enter the new file name (without extension)',
                value: fileNameWithoutExt,
            });
            const finalFilename = (newFilenameWithoutExt || fileNameWithoutExt) + extname;
            const relativePath = `.${editingFileNameWithoutExt}/${finalFilename}`;
            const targetPath = path.join(resourceFolderPath, finalFilename);
            fs.copyFileSync(currentFileName, targetPath);
            await insertMediaFile(editor!, relativePath, {
                useFilenameAsAlt: false,
                editCallback: (editor: vscode.TextEditor) => {
                    const currentPosition = editor.selection.active;
                    const newPosition = new vscode.Position(
                        currentPosition.line,
                        currentPosition.character - 3 - relativePath.length
                    );
                    editor.selection = new vscode.Selection(newPosition, newPosition);        
                },
            });
            return;
        }
        for (const file of files) {
            const sourcePath = file.fsPath;
            const fileName = path.basename(sourcePath);
            const targetPath = path.join(resourceFolderPath, fileName);
            try {
                fs.copyFileSync(sourcePath, targetPath);
                const relativePath = `.${editingFileNameWithoutExt}/${fileName}`;
                await insertMediaFile(editor!, relativePath, {insertNewline: true});
            } catch (err) {
                vscode.window.showErrorMessage(
                    `Failed to copy file: ${fileName}`);
            }
        }
    });
    context.subscriptions.push(disposable);
}
