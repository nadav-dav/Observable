Observable = require("rekuire")("Observable");

Observable.prototype.aggregate = function (initialValue, aggregateFunction) {
    var s = this._clone();
    var aggregatedValue;
    moveInitialValueToAggregatedValue();

    this.on("data", function (value) {
        aggregatedValue = aggregateFunction(aggregatedValue, value);
    });

    this.on("end", function(){
        s.send(aggregatedValue);
        moveInitialValueToAggregatedValue();
    });

    function moveInitialValueToAggregatedValue(){
        if (initialValue instanceof Array) aggregatedValue = initialValue.concat();
        else aggregatedValue = initialValue;
    }

    return s;
};

Observable.prototype.aggregateByTime = function (timeout, initialValue, aggregateFunction) {
    var s = this._clone();
    var aggregatedValue;
    moveInitialValueToAggregatedValue();

    this.on("data", function (value) {
        aggregatedValue = aggregateFunction(aggregatedValue, value);
    });

    setInterval(function(){
        s.send(aggregatedValue);
        moveInitialValueToAggregatedValue();
    }, timeout);

    function moveInitialValueToAggregatedValue(){
        if (initialValue instanceof Array) aggregatedValue = initialValue.concat();
        else aggregatedValue = initialValue;
    }

    return s;
};