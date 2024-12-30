import * as path from 'path';
import * as vscode from 'vscode';
import { getMonth, getTodayDate, getWeekNumber, getYear } from '../utils/date';
import { createFile, getStoredFolder } from '../utils/file';
import { isValidWorkspace } from '../utils/workspace';

export default function registerSummaryCommand(context: vscode.ExtensionContext) {
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
