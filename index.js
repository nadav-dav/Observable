function Observable() {
    this._listeners = [];
    this._endListeners = [];
    this._errorListeners = [];
    this._children = [];
}

// CREATION
/**
 * @returns {Observable}
 */
Observable.create = function () {
    return new Observable();
};

/**
 *
 * @param observables
 * @returns {Observable}
 */
Observable.combine = function (observables) {
    var s = Observable.create();
    observables.forEach(function (observable) {
        observable.on("data", function (value) {
            s.send(value);
        });
    });
    return s;
};

/**
 * @param data
 * @returns {Observable}
 */
Observable.prototype.send = function (data) {
    this._listeners.forEach(function (listener) {
        listener(data);
    });
    return this;
};

/**
 * @returns {Observable}
 */
Observable.prototype.end = function () {
    this._endListeners.forEach(function (listener) {
        listener();
    });
    this._children.forEach(function (childObservable) {
        childObservable.end();
    });
    return this;
};

/**
 * @param error
 * @param {Observable} root
 * @returns {Observable}
 */
Observable.prototype.error = function (error, root) {
    if(root === undefined){
        root = this;
    }
    this._errorListeners.forEach(function (listener) {
        listener(error, root);
    });
    this._children.forEach(function (childObservable) {
        childObservable.error(error, root);
    });
    return this;
};

/**
 * @param type
 * @param listener
 * @returns {Observable}
 */
Observable.prototype.on = function (type, listener) {
    if (type === "data")    this._listeners.push(listener);
    if (type === "end")     this._endListeners.push(listener);
    if (type === "error")   this._errorListeners.push(listener);

    return this;
};

/**
 * @param filterFunction
 * @returns {Observable}
 */
Observable.prototype.filter = function (filterFunction) {
    var s = this._clone();
    this.on("data", function (value) {
        if (filterFunction(value)){
            s.send(value);
        }
    });
    return s;
};

/**
 * @returns {Observable}
 */
Observable.prototype.flatten = function () {
    var s = this._clone();
    this.on("data", function (arrValue) {
        if (arrValue instanceof Array){
            arrValue.forEach(function (value) {
                s.send(value);
            });
        }
    });
    return s;
};

/**
 * @param mappingFunction
 * @returns {Observable}
 */
Observable.prototype.map = function (mappingFunction) {
    var s = this._clone();

    //sync function
    if (mappingFunction.length === 1){
        this.on("data", function (value) {
            s.send(mappingFunction(value));
        });
    }
    //async function
    if (mappingFunction.length === 2){
        this.on("data", function (value) {
            mappingFunction(value, s);
        });
    }

    return s;
};

/**
 * @param mappingFunction
 * @returns {Observable}
 */
Observable.prototype.flatMap = function (mappingFunction) {
    return this.map(mappingFunction).flatten();
};

/**
 * @param {Observable} anotherObservable
 */
Observable.prototype.pipe = function (anotherObservable) {
    this.on("data", function (data) {
        anotherObservable.send(data);
    });

    this.on("end", function () {
        anotherObservable.end();
    });

    this.on("error", function (error, root) {
        anotherObservable.error(error, root);
    });
};

Observable.prototype._clone = function () {
    var s = new Observable();
    this._children.push(s);
    return s;
};

module.exports = Observable;