var spawn = require('child_process').spawn;
var readline = require('readline');
var Observable = require("../../");
var macvendor = require('macvendor');

var WIRELESS_INTERFACE = "en0";
var SUBNET = "10.0.0.0";


var readingDump = command('tcpdump', ('-I -e -i ' + WIRELESS_INTERFACE).split(" "));

var raRequests = readingDump
    .filter(contains(/RA\:/))
    .map(extractRaMacAddress)
    .map(lookupMacAddressVendor);

var ipsInNetwork = command("nmap", (SUBNET + "/24 -sn").split(" "))
    .filter(contains(/Nmap scan report for/))
    .map(extractIp);

var beacons = readingDump
    .filter(contains(/Beacon \((.+)\)/))
    .map(readBeaconName)
    .map(aggregateUnique(1000));

raRequests.on("data", console.log);

//beacons.on("data", function(data){
//    process.stdout.write('\u001B[2J\u001B[0;0f');
//    console.log("NETWORKS\n=================");
//    console.log(data.join("\n"));
//});


function readBeaconName(line) {
    var regex = /Beacon \((.+)\)/;
    var parts = line.match(regex);
    return parts[1];
}

function extractRaMacAddress(line) {
    var regex = /RA:([^ ]+)/;
    var parts = line.match(regex);
    return parts[1];
}

function extractIp(line) {
    var regex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
    var parts = line.match(regex);
    return parts[1];
}

function lookupMacAddressVendor(data, out) {
    macvendor(data, function (err, vendor) {
        if (err) return out.error(err);
        out.send([data, vendor]);
    });
}

function aggregateUnique(timeout) {
    var collectedData = [];
    var _out;
    setInterval(function () {
        if (_out) {
            _out.send(collectedData.sort());
            collectedData = [];
        }
    }, timeout);

    return function (data, out) {
        _out = out;
        if (collectedData.indexOf(data) === -1) {
            collectedData.push(data);
        }
    }
}

function contains(regex) {
    return function (data) {
        return data.match(regex) != null;
    }
}
function command(cmd, params) {
    var s = Observable.create();
    var running = spawn(cmd, params);

    readline
        .createInterface({input: running.stdout, output: process.stdout, terminal: false})
        .on('line', function (line) {
            s.send(line);
        })
        .on('close', function () {
            s.end();
        });

    running.on('close', function (code, signal) {
        if (code === 0) s.end();
        else s.error(new Error('child process terminated due to receipt of signal ' + signal));
    });

    running.on('disconnect', function () {
        s.error(new Error('Command \'' + cmd + '\' got disconnected'));
    });
    return s;
}

