var rek = require("rekuire");
var spawn = require('child_process').spawn;
var readline = require('readline');
var Observable = rek("Observable");
rek("Observable.aggregate");
var macvendor = require('macvendor');

var WIRELESS_INTERFACE = "en0";
var SUBNET = "10.0.0.0";


/**
 Some terms:
 Destination Address (DA) : Final recipient of the frame
 Source Address (SA) : Original source of the frame
 Receiver Address (RA) : Immediate receiver of the frame.
 Transmitter Address (TA) : Immediate sender of the frame.
 */

var capturedFrames = command('tcpdump', ('-I -e -i ' + WIRELESS_INTERFACE).split(" "));

var sourceAddressFromFrames = capturedFrames
    .filter(contains(/SA\:/))
    .map(extractSaMacAddress)
    .map(lookupMacAddressVendor);

var ipsInNetwork = command("nmap", (SUBNET + "/24 -sn").split(" "))
    .filter(contains(/Nmap scan report for/))
    .map(extractIp);

var beacons = capturedFrames
    .filter(contains(/Beacon \((.+)\)/))
    .map(readBeaconName)
    .aggregateByTime(2000, [], aggregateUnique);

beacons
    .on("data", console.log)
    .on("error", console.error);


function readBeaconName(line) {
    var regex = /Beacon \((.+)\)/;
    var parts = line.match(regex);
    return parts[1];
}

function extractSaMacAddress(line) {
    var regex = /SA:([^ ]+)/;
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

function aggregateUnique(aggregator, data) {
    if (aggregator.indexOf(data) === -1) {
        return aggregator.concat(data);
    } else {
        return aggregator;
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

