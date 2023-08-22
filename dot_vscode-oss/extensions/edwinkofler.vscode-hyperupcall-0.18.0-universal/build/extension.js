"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
var vscode = require("vscode");
var env_format_1 = require("./modules/env-format");
var env_sync_1 = require("./modules/env-sync");
var watchers = [];
function activate(context) {
    // env-format
    context.subscriptions.push(env_format_1.logger, env_format_1.formatEditProvider, env_format_1.foldingRangeProvider);
    // env-sync
    var fileWatcher = vscode.workspace.createFileSystemWatcher("**/*.env");
    fileWatcher.onDidCreate(function (file) {
        console.log('createeee');
        (0, env_sync_1.watchFileCreate)(file);
    });
    // context.subscriptions.push(fileWatcher)
    context.subscriptions.push((0, env_sync_1.activateWatchers)(watchers));
    context.subscriptions.push((0, env_sync_1.deactivateWatchers)(watchers));
    vscode.commands.executeCommand('sync-env.activateWatchers');
}
exports.activate = activate;
function deactivate() {
    // env-sync
    vscode.commands.executeCommand('sync-env.deactivateWatchers');
}
exports.deactivate = deactivate;
