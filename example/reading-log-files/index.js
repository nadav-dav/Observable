var fs = require('fs');
var readline = require('readline');
var Observable = require("../../");

var readDir = Observable.fromNodeCallbackFunction(fs.readdir);

var filesInFolder   = readDir(__dirname).flatten();
var logFiles        = filesInFolder.filter(isAccessLog);
var logLines        = logFiles.map(readFileLines);
var logEntries      = logLines.map(parseLine);
var errorEntries    = logEntries.filter(isErrorEntry);

errorEntries.subscribe(console.log);


function parseLine (line) {
	var regex = /^([0-9\.]+(?:, [0-9\.]+)*) \S+ \S+ \[([^\]]+)\] "([A-Z]+) ([^"]*) HTTP\/(\S+)" (\d+) (\S+) "[^"]*" "([^"]*)"/;
	var parts = line.match(regex);
	var i = 0;
    return {
        ips: parts[++i],
        date: parts[++i],
        method: parts[++i],
        path: parts[++i],
        httpVersion: parts[++i],
        status: parseInt(parts[++i]),
        size: parseInt(parts[++i]),
        userAgent: parts[++i]
    };
}

function readFileLines (file, emit) {
    readline
        .createInterface({ input: fs.createReadStream(file), output: process.stdout, terminal: false})
        .on('line', function(line) { emit(line); });
}

function isAccessLog (filename){
	return filename.toLowerCase().substr(-11) === ".access.log"
}
function isErrorEntry (entry){
    return entry.status >= 400
}

