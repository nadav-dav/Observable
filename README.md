# Observable
Playing around with observables and reactive javascript

```javascript
var Observable = require("../");
var assert = require('assert');
var sinon = require('sinon');

describe("Observable", function () {
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

    it("should be able to send and subscribe to data", function () {
        obsv.on("data", listener);
        obsv.send("hello");
        assert(listener.calledWith("hello"));
    });

    it("should able to map values", function () {
        obsv.map(function (x) {
            return x + 1;
        })
            .on("data", listener);
        obsv.send(50);
        assert(listener.calledWith(51));
    });

    it("should be able to filter values", function () {
        obsv.filter(function (x) {
            return x > 100;
        })
            .on("data", listener);

        obsv.send(50).send(200);

        assert(listener.calledOnce);
        assert(listener.calledWith(200));
    });

    it("should be able to flatten", function () {
        obsv.flatten()
            .on("data", listener);
        obsv.send([1, 2, 3]);

        assert(listener.callCount === 3);
        assert(listener.calledWith(1));
        assert(listener.calledWith(2));
        assert(listener.calledWith(3));
    });

    it("should be able to flatMap", function () {
        obsv.flatMap(function (str) {
            return str.split("");
        })
            .on("data", listener);
        obsv.send("str");

        assert(listener.callCount === 3);
        assert(listener.calledWith("s"));
        assert(listener.calledWith("t"));
        assert(listener.calledWith("r"));
    });

    it("should be able to async map", function () {
        obsv.map(function (x, out) {
            setTimeout(function () {
                out.send(x + 1)
            }, 1)
        })
            .on("data", listener);
        obsv.send(10);

        clock.tick(100);
        assert(listener.calledWith(11));
    });

    it("should be able to async flatMap", function () {
        obsv.flatMap(function (str, out) {
            setTimeout(function () {
                out.send(str.split(""))
            }, 1)
        })
            .on("data", listener);

        obsv.send("ok");

        clock.tick(100);
        assert(listener.callCount === 2);
        assert(listener.calledWith("o"));
        assert(listener.calledWith("k"));
    });

    it("should be able to combine", function () {
        var s1 = Observable.create();
        var s2 = Observable.create();
        var s3 = Observable.combine([s1, s2]);

        s3.on("data", listener);

        s1.send(1)
          .send(2);

        assert(listener.callCount === 2);
        assert(listener.calledWith(1));
        assert(listener.calledWith(2));
    });

    describe("piping", function(){
        it("should be able to pipe 'data' signals", function(){
            var s1 = Observable.create();
            var s2 = Observable.create();
            s1.pipe(s2);
            s2.on("data", listener);

            s1.send("hello");

            assert(listener.callCount === 1);
            assert(listener.calledWith("hello"));
        });

        it("should be able to pipe 'end' signals", function(){
            var s1 = Observable.create();
            var s2 = Observable.create();
            s1.pipe(s2);
            s2.on("end", listener);

            s1.end();
            assert(listener.calledOnce);
        });

        it("should be able to pipe 'error' signals", function(){
            var s1 = Observable.create();
            var s2 = Observable.create();
            s1.pipe(s2);
            s2.on("error", listener);

            s1.error();
            assert(listener.calledOnce);
        });
    });
    describe("ending an observable", function(){
        it("should be able to announce when done", function(){
            obsv.on("end", listener);
            obsv.send(1)
                .send(2)
                .end();

            assert(listener.callCount === 1);
            assert(listener.calledOnce);
        });

        it("should pass the 'end' signal to all mutations too", function(){
            obsv
                .flatten()
                .map(function(x){return x+1;})
                .on("end", listener);

            obsv.end();

            assert(listener.callCount === 1);
            assert(listener.calledOnce);
        });
    });

    describe("error handling", function(){
        it("should be able to send error signals", function(){
            obsv.on("error", listener);
            obsv.error("error text");

            assert(listener.callCount === 1);
            assert(listener.calledWith("error text", obsv));
        });

        it("should pass the 'error' signal to all mutations too", function(){
            obsv
                .flatten()
                .map(function(x){return x+1;})
                .on("error", listener);

            obsv.error("error text");

            assert(listener.callCount === 1);
            assert(listener.calledWith("error text", obsv));
        });
    });
});
```
