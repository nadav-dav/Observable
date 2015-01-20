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

    it("should be able to emit and subscribe to data", function () {
        obsv.subscribe(listener);
        obsv.emit("hello");
        assert(listener.calledWith("hello"));
    });

    it("should able to map values", function () {
        obsv.map(function (x) {
            return x + 1;
        })
            .subscribe(listener);
        obsv.emit(50);
        assert(listener.calledWith(51));
    });

    it("should be able to filter values", function () {
        obsv.filter(function (x) {
            return x > 100;
        })
            .subscribe(listener);
        obsv.emit(50);
        obsv.emit(200);

        assert(listener.calledOnce);
        assert(listener.calledWith(200));
    });

    it("should be able to flatten", function () {
        obsv.flatten()
            .subscribe(listener);
        obsv.emit([1, 2, 3]);

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
        obsv.emit("str");

        assert(listener.callCount === 3);
        assert(listener.calledWith("s"));
        assert(listener.calledWith("t"));
        assert(listener.calledWith("r"));
    });

    it("should be able to async map", function () {
        obsv.map(function (x, done) {
            setTimeout(function () {
                done(x + 1)
            }, 1)
        })
            .subscribe(listener);
        obsv.emit(10);

        clock.tick(100);
        assert(listener.calledWith(11));
    });

    it("should be able to async flatMap", function () {
        obsv.flatMap(function (str, done) {
            setTimeout(function () {
                done(str.split(""))
            }, 1)
        })
            .subscribe(listener);

        obsv.emit("ok");

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

        s1.emit(1);
        s2.emit(2);

        assert(listener.callCount === 2);
        assert(listener.calledWith(1));
        assert(listener.calledWith(2));
    });

    it("should be able to create an Observable from a function", function () {
        var sayHello = function (firstName, lastName) {
            return "hello " + firstName + " " + lastName + "!";
        };
        var sayHelloObservable = Observable.fromFunction(sayHello);
        sayHelloObservable("foo", "bar").subscribe(listener);
        clock.tick(100);
        assert(listener.calledWith("hello foo bar!"));
    });

    it("should be able to create an Observable from a function with a callback", function () {
        var addOne = function (number, callback) {
            callback(number + 1);
        };
        var addOneObservable = Observable.fromCallbackFunction(addOne);
        addOneObservable(1).subscribe(listener);
        clock.tick(100);
        assert(listener.calledWith(2));
    });


    it("should be able to create an Observable from a NodeJs style function with a callback", function () {
        var shout = function (text, callback) {
            callback(null, text.toUpperCase()+"!");
        };
        var shoutObservable = Observable.fromNodeCallbackFunction(shout);
        shoutObservable("what?").subscribe(listener);
        clock.tick(100);
        assert(listener.calledWith("WHAT?!"));
    });
});
```
