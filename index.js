function Observable() {
    this._listeners = [];
}

Observable.create = function () {
    return new Observable();
};

Observable.combine = function (observables) {
    var s = Observable.create();
    observables.forEach(function(observable){
        observable.subscribe(function (value) {
            s.emit(value);
        });
    });
    return s;
};

Observable.prototype.emit = function (data) {
    this._listeners.forEach(function (listener) {
        listener(data);
    })
};

Observable.prototype.subscribe = function (listener) {
    this._listeners.push(listener);
};

Observable.prototype.filter = function (filterFunction) {
    var s = Observable.create();
    this.subscribe(function (value) {
        if (filterFunction(value)){
            s.emit(value);
        }
    });
    return s;
};

Observable.prototype.flatten = function () {
    var s = Observable.create();
    this.subscribe(function (arrValue) {
        if (arrValue instanceof Array){
            arrValue.forEach(function(value){
                s.emit(value);
            });
        }
    });
    return s;
};

Observable.prototype.map = function (mappingFunction) {
    var s = Observable.create();

    //sync function
    if (mappingFunction.length === 1){
        this.subscribe(function (value) {
            s.emit(mappingFunction(value));
        });
    }
    //async function
    if (mappingFunction.length === 2){
        this.subscribe(function (value) {
            mappingFunction(value, function(mappedValue){
                s.emit(mappedValue);
            });
        });
    }

    return s;
};

Observable.prototype.flatMap = function (mappingFunction) {
    return this.map(mappingFunction).flatten();
};

module.exports = Observable;