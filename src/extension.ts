import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getMonth, getTodayDate, getWeekNumber, getYear } from './utils/date';
import { createFile } from './utils/file';

const isValidWorkspace: boolean = (function(): boolean {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('No workspace folder is open. Please open a folder and try again.');
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
			vscode.window.showErrorMessage('Not a markdown-blog workspace.');
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

		vscode.window.showInformationMessage(`Running: ${terminalCommand} in ${workspaceRoot}`);
		const terminal = vscode.window.terminals.find(t => t.name === "NPM Build") || vscode.window.createTerminal("NPM Build");
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
			{ id: SummaryType.Daily      , label: 'Daily Summary'        },
			{ id: SummaryType.Weekly     , label: 'Weekly Summary'       },
			{ id: SummaryType.Monthly    , label: 'Monthly Summary'      },
			{ id: SummaryType.HalfMonthly, label: 'Half-monthly Summary' },
			{ id: SummaryType.Yearly     , label: 'Yearly Summary'       },
			{ id: SummaryType.HalfYearly , label: 'Half-yearly Summary'  },
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
				title = `${getTodayDate()} Summary`; break;
			case SummaryType.Weekly:
				title = `Week ${getWeekNumber()} Summary`; break;
			case SummaryType.Monthly:
				title = `${getYear()}-${getMonth()} Monthly Summary`; break;
			case SummaryType.HalfMonthly:
				title = `${getYear()}-${getMonth()} Half-Month Summary`; break;
			case SummaryType.Yearly:
				title = `${getYear()} Yearly Summary`; break;
			case SummaryType.HalfYearly:
				title = `${getYear()} Half-Year Summary`; break;
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
