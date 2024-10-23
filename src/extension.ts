// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
'use strict';
import * as VscodePython from "@vscode/python-extension";
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    const activeEditor = vscode.window.activeTextEditor;
    const pythonExtension = await VscodePython.PythonExtension.api()

    activeEditor && await onActiveTextEditorChange(activeEditor, pythonExtension);

    let disposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        editor && await onActiveTextEditorChange(editor, pythonExtension)
    });

    context.subscriptions.push(disposable);

	// let disposable_command = vscode.commands.registerCommand('poetry-monorepo.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Changed environment and paths for poetry');
	// });
}

async function onActiveTextEditorChange(editor: vscode.TextEditor | undefined, pythonExtension: VscodePython.PythonExtension) {
    if (!editor || editor.document.languageId !== 'python') return;

    const pythonFile = editor.document.uri.fsPath;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(pythonFile));
    if (!workspaceFolder) return;

    let paths = FindClosestPyProjectTomlInPath(pythonFile, workspaceFolder.uri.fsPath);
    if (!paths) return;

    const [poetryPath, packageDirPath] = paths;

    setPythonInterpreter(poetryPath, packageDirPath, pythonExtension, workspaceFolder);
}

function FindClosestPyProjectTomlInPath(pythonFile: string, workspaceRoot: string) {
    let currentDir = pythonFile;
    let prevDir;
    do {
        currentDir = path.dirname(currentDir);
        const pyprojectTomlPath = path.join(currentDir, 'pyproject.toml');
        if (fs.existsSync(pyprojectTomlPath)) {
            return [currentDir, prevDir || currentDir];
        }
        prevDir = currentDir;
    } while (currentDir !== workspaceRoot)
    return undefined;
}

async function setPythonInterpreter(poetryPath: string, poetryPackagePath: string, pythonExtension: VscodePython.PythonExtension, workspaceFolder: vscode.WorkspaceFolder) {
    const pythonInterpreterPath = path.join(poetryPath, '.venv', 'bin', 'python');
    // const currentDefaultInterpreter = vscode.workspace.getConfiguration('python').get('defaultInterpreterPath')
    // const currentInterpreter = vscode.extensions.getExtension('ms-python.python')?.exports.environments.getActiveEnvironmentPath().path
    const currentInterpreter = pythonExtension.environments.getActiveEnvironmentPath().path
    if (pythonInterpreterPath !== currentInterpreter && fs.existsSync(pythonInterpreterPath)) {
        await pythonExtension.environments.updateActiveEnvironmentPath(pythonInterpreterPath);
	    
        vscode.window.showInformationMessage(`Python interpreter\n\nInterpreter: ${pythonInterpreterPath}.\n\n`)

        // vscode.workspace.getConfiguration('python').update('defaultInterpreterPath', pythonInterpreterPath).then(_ => {
        //     vscode.commands.executeCommand('python.setInterpreter')
        // });
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
