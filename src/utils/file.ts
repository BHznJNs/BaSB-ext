import * as vscode from 'vscode';

export async function createFile(path: string, content: string) {
    const newFileUri = vscode.Uri.file(path);
    const encoder = new TextEncoder();
    const fileData = encoder.encode(content);

    try {
        await vscode.workspace.fs.writeFile(newFileUri, fileData);
        const document = await vscode.workspace.openTextDocument(newFileUri);
        await vscode.window.showTextDocument(document);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage('Error creating or file: ' + errorMessage);
    }
}

export async function getStoredFolder(context: vscode.ExtensionContext, pathId: string): Promise<string | undefined> {
    let folderPath: string | undefined = context.workspaceState.get(pathId);
    if (typeof folderPath === 'string') {
        return folderPath;
    }
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
    folderPath = folderUri[0].fsPath;
    context.workspaceState.update(pathId, folderPath);
    return folderPath;
}

export const videoExtArr = [
    'rmvb', 'rm',
    'avchd',
    'avi',
    'mov',
    'mp4',
    'flv',
    'wmv',
    'asf',
    'asx',
    '3gp',
    'mkv',
    'f4v',
];
export const audioExtArr = [
    'aiff', 'aif',
    'midi', 'mid',
    'flac',
    'ogg',
    'cda',
    'wav',
    'mp3',
    'm4a',
    'wma',
    'ra',
    'vqf',
    'ape',
];
export const imageExtArr = [
    'jpeg', 'jpg',
    'tiff', 'tif',
    'webp',
    'indd',
    'png',
    'gif',
    'ico',
    'svg',
    'eps',
    'psd',
    'raw',
];
