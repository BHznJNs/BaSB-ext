import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getMonth, getTodayDate, getWeekNumber, getYear } from './utils/date';
import { createFile } from './utils/file';

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
        const terminal = vscode.window.terminals.find(t => t.name === "NPM Build") ||
                         vscode.window.createTerminal("NPM Build");
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
        let summaryFolderPath: string | undefined = context.workspaceState.get('summary-path');
        if (summaryFolderPath === undefined) {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select Folder'
            });
            const hasSelectedFolder = folderUri && folderUri[0];
            if (!hasSelectedFolder) {
                vscode.window.showInformationMessage('No folder selected');
                return;
            }
            const folderPath = folderUri[0].fsPath;
            summaryFolderPath = folderPath;
            context.workspaceState.update('summary-path', folderPath);
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
        switch (selectedType) {
            case SummaryType.Daily:
                title = vscode.l10n.t('{0} Summary', getTodayDate()); break;
            case SummaryType.Weekly:
                title = vscode.l10n.t('Week {0} Summary', getWeekNumber()); break;
            case SummaryType.Monthly:
                title = vscode.l10n.t('{0} {1} Monthly Summary', getYear(), getMonth()); break;
            case SummaryType.HalfMonthly:
                title = vscode.l10n.t('{0} {1} Half-Month Summary', getYear(), getMonth()); break;
            case SummaryType.Yearly:
                title = vscode.l10n.t('{0} Yearly Summary', getYear()); break;
            case SummaryType.HalfYearly:
                title = vscode.l10n.t('{0} Half-Year Summary', getYear()); break;
        }
        const summaryPath = path.join(summaryFolderPath, title + '.md');
        const initialContent = '# ' + title;
        await createFile(summaryPath, initialContent);
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
}

export function deactivate() {}
