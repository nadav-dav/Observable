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
        obsv.subscribe(listener);
        obsv.send("hello");
        assert(listener.calledWith("hello"));
    });

    it("should able to map values", function () {
        obsv.map(function (x) {
            return x + 1;
        })
            .subscribe(listener);
        obsv.send(50);
        assert(listener.calledWith(51));
    });

    it("should be able to filter values", function () {
        obsv.filter(function (x) {
            return x > 100;
        })
            .subscribe(listener);
        obsv.send(50);
        obsv.send(200);

        assert(listener.calledOnce);
        assert(listener.calledWith(200));
    });

    it("should be able to flatten", function () {
        obsv.flatten()
            .subscribe(listener);
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
            .subscribe(listener);
        obsv.send("str");

        assert(listener.callCount === 3);
        assert(listener.calledWith("s"));
        assert(listener.calledWith("t"));
        assert(listener.calledWith("r"));
    });

    it("should be able to async map", function () {
        obsv.map(function (x, send) {
            setTimeout(function () {
                send(x + 1)
            }, 1)
        })
            .subscribe(listener);
        obsv.send(10);

        clock.tick(100);
        assert(listener.calledWith(11));
    });

    it("should be able to async flatMap", function () {
        obsv.flatMap(function (str, send) {
            setTimeout(function () {
                send(str.split(""))
            }, 1)
        })
            .subscribe(listener);

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

        s3.subscribe(listener);

        s1.send(1);
        s2.send(2);

        assert(listener.callCount === 2);
        assert(listener.calledWith(1));
        assert(listener.calledWith(2));
    });

    it("should be able to pipe Observables", function(){
        var s1 = Observable.create();
        var s2 = Observable.create();
        s1.pipe(s2);
        s2.subscribe(listener);

        s1.send("hello");
        assert(listener.calledWith("hello"));
    });
});
```
