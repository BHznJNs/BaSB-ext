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
        vscode.window.showErrorMessage("Error creating or file: " + errorMessage);
    }
}