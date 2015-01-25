var rek = require("rekuire");
/** @type {Observable} */
var Observable = rek("Observable");
var assert = require('assert');
var sinon = require('sinon');

describe("Observable.aggregate", function () {
    var obsv, listener;
    var clock;

    beforeEach(function () {
        clock = sinon.useFakeTimers();
        obsv = Observable.create();
        listener = sinon.spy();
    });
    after(function () {
        clock.restore();
    });

    describe("aggregate until 'end' signal", function () {
        it("should be able to aggregate data calls", function () {
            obsv
                .aggregate(2, function (aggregator, data) {
                    return aggregator + data;
                })
                .on("data", listener);

            obsv.send(1);
            obsv.send(1);
            obsv.end();
            assert(listener.calledWith(4));
        });

        it("should be able to aggregate data calls into array", function () {
            obsv
                .aggregate(["foo"], function (aggregator, data) {
                    return aggregator.concat(data);
                })
                .on("data", listener);

            obsv.send("hello");
            obsv.send("world");
            obsv.end();
            assert(listener.calledWith(["foo", "hello", "world"]));
        });
    });

    describe("aggregate by time", function () {
        it("should be able to aggregate data by time calls into ", function () {
            obsv
                .aggregateByTime(1000, [], function (aggregator, data) {
                    return aggregator.concat(data);
                })
                .on("data", listener);

            obsv.send("hello");
            obsv.send("world");
            clock.tick(1000);

            obsv.send("foo");
            obsv.send("bar");
            clock.tick(1000);

            assert(listener.calledWith(["hello", "world"]));
            assert(listener.calledWith(["foo", "bar"]));
        });
    });

});