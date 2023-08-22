"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foldingRangeProvider = exports.formatEditProvider = exports.logger = exports.Logger = void 0;
var vscode_1 = require("vscode");
var Logger = /** @class */ (function () {
    function Logger(output) {
        this.output = output;
        this.output = output;
    }
    Logger.prototype.log = function (msg) {
        var d = new Date();
        var date = d.toISOString().split('T')[0];
        var time = d.toTimeString().split(' ')[0];
        var ms = (d.getMilliseconds() + '').padStart(3, '0');
        this.output.appendLine("[".concat(date, " ").concat(time, ".").concat(ms, "] ").concat(msg));
    };
    Logger.prototype.dispose = function () {
        this.output.dispose();
    };
    return Logger;
}());
exports.Logger = Logger;
exports.logger = new Logger(vscode_1.window.createOutputChannel('env-format'));
exports.logger.log('activating extension');
exports.formatEditProvider = vscode_1.languages.registerDocumentFormattingEditProvider('env', {
    provideDocumentFormattingEdits: function (document) {
        exports.logger.log("formatting ".concat(document.fileName));
        var edits = [];
        for (var i = 0; i < document.lineCount; i++) {
            var ln = document.lineAt(i);
            var st = ln.range.start;
            var tx = ln.text;
            if (ln.isEmptyOrWhitespace) {
                if (tx.length > 0) {
                    edits.push(vscode_1.TextEdit.delete(ln.range));
                }
                continue;
            }
            var fi = ln.firstNonWhitespaceCharacterIndex;
            var fs = new vscode_1.Position(i, fi);
            if (fi > 0) {
                // remove leading whitespace
                edits.push(vscode_1.TextEdit.delete(new vscode_1.Range(st, fs)));
            }
            if (tx.charAt(fi) === '#') {
                // remove trailing whitespace in comments
                edits.push(vscode_1.TextEdit.replace(new vscode_1.Range(fs, ln.range.end), '# ' + tx.substring(fi + 1).trim()));
            }
            else if (tx.substr(fi, 6) === 'export') {
                // remove whitespace between export keywords
                var ex = tx.substring(fi + 7).trim();
                var fe = ex.indexOf('=');
                if (fe > 0) {
                    var key = ex.substring(0, fe).trim();
                    var val = ex.substring(fe + 1).trim();
                    if (val.indexOf(' ') >= 0 &&
                        val[0] !== '"' &&
                        val[val.length - 1] !== '"') {
                        val = "\"".concat(val, "\"");
                    }
                    edits.push(vscode_1.TextEdit.replace(new vscode_1.Range(fs, ln.range.end), 'export ' + key + '=' + val));
                }
                else {
                    edits.push(vscode_1.TextEdit.replace(new vscode_1.Range(fs, ln.range.end), 'export ' + ex));
                }
            }
            else {
                // remove leading and trailing whitespace in quoted string
                var fe = tx.indexOf('=');
                if (fe > 0) {
                    var key = tx.substring(0, fe).trim();
                    var val = tx.substring(fe + 1).trim();
                    if (val.indexOf(' ') >= 0 &&
                        val[0] !== '"' &&
                        val[val.length - 1] !== '"' &&
                        val[0] !== "'" &&
                        val[val.length - 1] !== "'") {
                        val = "\"".concat(val, "\"");
                    }
                    edits.push(vscode_1.TextEdit.replace(new vscode_1.Range(fs, ln.range.end), key + '=' + val));
                }
            }
        }
        return edits;
    },
});
exports.foldingRangeProvider = vscode_1.languages.registerFoldingRangeProvider('env', {
    provideFoldingRanges: function (document) {
        exports.logger.log("folding ".concat(document.fileName));
        var folds = [];
        var start = /^# /, end = /^\s*$/; // regex to detect start and end of region
        var inRegion = false, sectionStart = 0;
        for (var i = 0; i < document.lineCount; i++) {
            if (start.test(document.lineAt(i).text) && !inRegion) {
                inRegion = true;
                sectionStart = i;
            }
            else if (end.test(document.lineAt(i).text) && inRegion) {
                folds.push(new vscode_1.FoldingRange(sectionStart, i - 1, vscode_1.FoldingRangeKind.Region));
                inRegion = false;
            }
        }
        return folds;
    },
});
