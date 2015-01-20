var fs = require('fs');
var readline = require('readline');
var Observable = require("../../");

// OUR MAGNIFICENT PIPE LINE
var folderToRead    = Observable.create();
var filesInFolder   = folderToRead.map(readFolder).flatten();
var logFiles        = filesInFolder.filter(isAccessLog);
var logLines        = logFiles.map(readFileLines);
var logEntries      = logLines.map(parseLine);
var errorEntries    = logEntries.filter(isErrorEntry);

errorEntries.subscribe(console.log);
// DROP A PENNY IN ONE END AND LET IT ROLL!
folderToRead.send(__dirname);

function readFolder (folder, send){
    fs.readdir(folder, function(err, result){
        send(result)
    });
}

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

function readFileLines (file, send) {
    readline
        .createInterface({ input: fs.createReadStream(file), output: process.stdout, terminal: false})
        .on('line', function(line) { send(line); });
}

function isAccessLog (filename){
	return filename.toLowerCase().substr(-11) === ".access.log"
}
function isErrorEntry (entry){
    return entry.status >= 400
}

