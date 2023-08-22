"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchFile = exports.watchFileCreate = exports.watchFileChange = exports.deactivateWatchers = exports.activateWatchers = void 0;
var vscode = require("vscode");
var fs = require("fs");
/* ------------------------------------------------------ */
/*                          START                         */
/* ------------------------------------------------------ */
function activateWatchers(watchers) {
    return vscode.commands.registerCommand('sync-env.activateWatchers', function () {
        var sourceFile = getEnvSource();
        watchers.push(watchFile(sourceFile));
    });
}
exports.activateWatchers = activateWatchers;
function deactivateWatchers(watchers) {
    return vscode.commands.registerCommand('sync-env.deactivateWatchers', function () {
        watchers.forEach(function (disposable) { return disposable.dispose(); });
        vscode.window.showInformationMessage('Sync-env Deactivated!');
    });
}
exports.deactivateWatchers = deactivateWatchers;
/* ------------------------------------------------------ */
/*                         UTILITY                        */
/* ------------------------------------------------------ */
function getEnvSource() {
    var settings = vscode.workspace.getConfiguration('sync-env');
    var envSource = settings.envSource;
    if (!envSource || !envSource.length) {
        // empty source file provided or invalid...
        // default to `.env`
        envSource = '.env';
    }
    return envSource;
}
function getEnvDestination() {
    var settings = vscode.workspace.getConfiguration('sync-env');
    var sourceEnv = getEnvSource();
    var envDestination = settings.envDestination;
    var destinationComputed = [];
    if (!envDestination || !envDestination.length) {
        // empty destination file provided or invalid...
        // let's default to `.env.example`
        envDestination = '.env.example';
    }
    if (Array.isArray(envDestination)) {
        destinationComputed.push.apply(destinationComputed, envDestination);
    }
    else {
        // it's a string
        destinationComputed.push(envDestination);
    }
    // remove source envFile from destination envFile
    // to fix a bug of unbreakable loop...
    return destinationComputed.filter(function (destinationEnv) { return destinationEnv !== sourceEnv; });
}
function getFileName(path) {
    return path.replace(/\/.*\//, '');
}
function getFilePath(path) {
    return path.replace(/\..*/, '');
}
function writefile(path, data) {
    fs.writeFileSync(path, data, 'utf8');
}
function readfile(path) {
    return fs.readFileSync(path, 'utf8');
}
function envToObjectWithSpace(env) {
    var config = [];
    env.split('\n').forEach(function (line) {
        if (line.startsWith('#')) {
            config.push({
                isSpace: false,
                isComment: true,
                key: '*****comment*****',
                value: line,
            });
        }
        else {
            var lineArray = line.split('=');
            config.push({
                isSpace: !lineArray[0],
                key: lineArray[0] || 'space',
                value: lineArray[1] || '',
            });
        }
    });
    return config;
}
function envToObject(env) {
    var config = [];
    env.split('\n').forEach(function (line) {
        var lineArray = line.split('=');
        config[lineArray[0] || 'space'] = lineArray[1] || '';
    });
    return config;
}
function prepareNewConfig(targetConfig, changedConfig) {
    var targetConfigObject = envToObject(targetConfig);
    var changedConfigObject = envToObjectWithSpace(changedConfig);
    var result = [];
    changedConfigObject.forEach(function (config) {
        if (config.isComment) {
            result.push(config.value);
        }
        else if (config.isSpace) {
            result.push('');
        }
        else if (config.value.match(/["']\s*\${.*}\s*["']/)) {
            result.push("".concat(config.key, "=").concat(config.value));
        }
        else if (config.key in targetConfigObject) {
            result.push("".concat(config.key, "=").concat(targetConfigObject[config.key]));
        }
        else {
            result.push("".concat(config.key, "="));
        }
    });
    return result.join('\n');
}
function isConfigSame(targetConfig, changedConfig) {
    return targetConfig.replace(/=.*/g, '') === changedConfig.replace(/=.*/g, '');
}
/* ------------------------------------------------------ */
/*                        WATCHERS                        */
/* ------------------------------------------------------ */
function watchFileChange(file) {
    var destinationEnv = getEnvDestination();
    var filePath = file.fsPath;
    destinationEnv.forEach(function (destFile) {
        if (fs.existsSync(getFilePath(filePath) + destFile)) {
            var targetFile = readfile("".concat(getFilePath(filePath)).concat(destFile));
            var changedFile = readfile(filePath);
            writefile("".concat(getFilePath(filePath)).concat(destFile), prepareNewConfig(targetFile, changedFile));
        }
    });
}
exports.watchFileChange = watchFileChange;
function watchFileCreate(file) {
    var destinationEnv = getEnvDestination();
    var filePath = file.fsPath;
    destinationEnv.forEach(function (destFile) {
        var _a;
        if (fs.existsSync(getFilePath(filePath) + destFile)) {
            var targetFile_1 = readfile("".concat(getFilePath(filePath)).concat(destFile));
            (_a = vscode.window)
                .showInformationMessage.apply(_a, __spreadArray(["\n\t\t\t\t You just created an env file which you are\n\t\t\t\t watching for changes. Do you want to copy\n\t\t\t\t the content of the child(".concat(destFile, ") to it?")], ['No', 'Yes'], false)).then(function (response) {
                if (response === 'Yes')
                    writefile(filePath, targetFile_1);
            });
        }
    });
}
exports.watchFileCreate = watchFileCreate;
function watchFile(file) {
    var fileWatcher = vscode.workspace.createFileSystemWatcher("**/".concat(file));
    fileWatcher.onDidChange(watchFileChange);
    fileWatcher.onDidCreate(watchFileCreate);
    return fileWatcher;
}
exports.watchFile = watchFile;
