import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getMonth, getTodayDate, getWeekNumber, getYear } from './utils/date';
import { audioExtArr, createFile, getStoredFolder, imageExtArr, videoExtArr } from './utils/file';

const isValidWorkspace: boolean = (function(): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('No workspace folder is open. Please open a folder and try again.'));
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

function registerCommand(context: vscode.ExtensionContext, commandName: string, terminalCommand: string) {
    const disposable = vscode.commands.registerCommand(commandName, () => {
        const workspaceFolders = vscode.workspace.workspaceFolders as vscode.WorkspaceFolder[];
        if (!isValidWorkspace) {
            return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        vscode.window.showInformationMessage(
            vscode.l10n.t('Running: {0} in {1}.', terminalCommand, workspaceRoot));
        const terminal = vscode.window.terminals.find(t => t.name === "markdown-blog command") ||
                         vscode.window.createTerminal("markdown-blog command");
        terminal.show();
        terminal.sendText(`cd "${workspaceRoot}"`);
        terminal.sendText(terminalCommand);
    });

    context.subscriptions.push(disposable);
}

function registerSummaryCommand(context: vscode.ExtensionContext) {
    enum SummaryType {
        Daily,
        Weekly,
        Monthly,
        HalfMonthly,
        Yearly,
        HalfYearly,
    }

    const disposable = vscode.commands.registerCommand('markdown-blog-ext.create-summary', async () => {
        if (!isValidWorkspace) {
            return;
        }
        const options = [
            { id: SummaryType.Daily      , label: vscode.l10n.t('Daily Summary')        },
            { id: SummaryType.Weekly     , label: vscode.l10n.t('Weekly Summary')       },
            { id: SummaryType.Monthly    , label: vscode.l10n.t('Monthly Summary')      },
            { id: SummaryType.HalfMonthly, label: vscode.l10n.t('Half-monthly Summary') },
            { id: SummaryType.Yearly     , label: vscode.l10n.t('Yearly Summary')       },
            { id: SummaryType.HalfYearly , label: vscode.l10n.t('Half-yearly Summary')  },
        ];
        const selectedOption = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select a summary type',
        });
        if (selectedOption === undefined) {
            return;
        }
        const { id: selectedType } = selectedOption;
        let title = '';
        let pathId = '';
        switch (selectedType) {
            case SummaryType.Daily:
                title = vscode.l10n.t('{0} Diary', getTodayDate());
                pathId = 'diary-path';
                break;
            case SummaryType.Weekly:
                title = vscode.l10n.t('Week {0} Summary', getWeekNumber());
                pathId = 'weekly-summary-path';
                break;
            case SummaryType.Monthly:
                title = vscode.l10n.t('{0} {1} Monthly Summary', getYear(), getMonth());
                pathId = 'monthly-summary-path';
                break;
            case SummaryType.HalfMonthly:
                title = vscode.l10n.t('{0} {1} Half-Month Summary', getYear(), getMonth());
                pathId = 'half-monthly-summary-path';
                break;
            case SummaryType.Yearly:
                title = vscode.l10n.t('{0} Yearly Summary', getYear());
                pathId = 'yearly-summary-path';
                break;
            case SummaryType.HalfYearly:
                title = vscode.l10n.t('{0} Half-Year Summary', getYear());
                pathId = 'half-yearly-summary-path';
                break;
        }

        const targetFolderPath = await getStoredFolder(context, pathId);
        if (targetFolderPath === undefined) {
            return;
        }
        const summaryPath = path.join(targetFolderPath, title + '.md');
        const initialContent = '# ' + title;
        await createFile(summaryPath, initialContent);
    });
    context.subscriptions.push(disposable);
}

function registerImportResourcesCommand(context: vscode.ExtensionContext) {
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

    const disposable = vscode.commands.registerCommand('markdown-blog-ext.import-resources', async () => {
        if (!isValidWorkspace) {
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
            const targetPath = path.join(resourceFolderPath, finalFilename);
            fs.copyFileSync(currentFileName, targetPath);
            await insertMediaFile(editor!, finalFilename, {
                useFilenameAsAlt: false,
                editCallback: (editor: vscode.TextEditor) => {
                    const currentPosition = editor.selection.active;
                    const newPosition = new vscode.Position(
                        currentPosition.line,
                        currentPosition.character - 3 - finalFilename.length
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

export function activate(context: vscode.ExtensionContext) {
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
    registerSummaryCommand(context);
    registerImportResourcesCommand(context);
}

export function deactivate() {}
