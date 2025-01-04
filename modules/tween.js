/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 */

const _Group = function () {
    this._tweens = {};
    this._tweensAddedDuringUpdate = {};
};

_Group.prototype = {
    getAll: function () {
        return Object.keys(this._tweens).map(function (tweenId) {
            return this._tweens[tweenId];
        }.bind(this));
    },

    removeAll: function () {
        this._tweens = {};
    },

    add: function (tween) {
        this._tweens[tween.getId()] = tween;
        this._tweensAddedDuringUpdate[tween.getId()] = tween;
    },

    remove: function (tween) {
        delete this._tweens[tween.getId()];
        delete this._tweensAddedDuringUpdate[tween.getId()];
    },

    update: function (time = performance.now(), preserve = false) {
        let tweenIds = Object.keys(this._tweens);

        if (tweenIds.length === 0) {
            return false;
        }

        while (tweenIds.length > 0) {
            this._tweensAddedDuringUpdate = {};

            for (let i = 0; i < tweenIds.length; i++) {
                const tween = this._tweens[tweenIds[i]];

                if (tween && tween.update(time) === false && !preserve) {
                    delete this._tweens[tweenIds[i]];
                }
            }

            tweenIds = Object.keys(this._tweensAddedDuringUpdate);
        }

        return true;
    }
};

const TWEEN = new _Group();

TWEEN.Group = _Group;
TWEEN._nextId = 0;
TWEEN.nextId = function () {
    return TWEEN._nextId++;
};

class Tween {
    constructor(object, group) {
        this._object = object;
        this._group = group || TWEEN;
        this._initial = {};
        this._valuesStart = {};
        this._valuesEnd = {};
        this._duration = 1000;
        this._delayTime = 0;
        this._startTime = null;
        this._easingFunction = TWEEN.Easing.Linear.None;
        this._interpolationFunction = TWEEN.Interpolation.Linear;
        this._chainedTweens = [];
        this._onStartCallback = null;
        this._onStartCallbackFired = false;
        this._onUpdateCallback = null;
        this._onCompleteCallback = null;
        this._onStopCallback = null;
        this._id = TWEEN.nextId();
        this._isPlaying = false;
        this._reversed = false;
        this._delayTime = 0;
        this._repeat = 0;
        this._yoyo = false;
        this._repeatDelayTime = undefined;
    }

    getId() {
        return this._id;
    }

    to(properties, duration) {
        this._valuesEnd = Object.assign({}, properties);
        if (duration !== undefined) {
            this._duration = duration;
        }
        return this;
    }

    start(time) {
        this._group.add(this);
        this._isPlaying = true;
        this._onStartCallbackFired = false;
        this._startTime = time !== undefined ? time : TWEEN.now();
        this._startTime += this._delayTime;
        for (const property in this._valuesEnd) {
            this._valuesStart[property] = this._object[property];
            this._initial[property] = this._valuesStart[property];
        }
        return this;
    }

    stop() {
        if (!this._isPlaying) {
            return this;
        }
        this._group.remove(this);
        this._isPlaying = false;
        if (this._onStopCallback !== null) {
            this._onStopCallback(this._object);
        }
        this.stopChainedTweens();
        return this;
    }

    update(time) {
        if (time < this._startTime) {
            return true;
        }
        if (this._onStartCallbackFired === false) {
            if (this._onStartCallback !== null) {
                this._onStartCallback(this._object);
            }
            this._onStartCallbackFired = true;
        }
        const elapsed = (time - this._startTime) / this._duration;
        const value = this._easingFunction(Math.min(1, Math.max(0, elapsed)));
        for (const property in this._valuesEnd) {
            const start = this._valuesStart[property];
            const end = this._valuesEnd[property];
            this._object[property] = start + (end - start) * value;
        }
        if (this._onUpdateCallback !== null) {
            this._onUpdateCallback(this._object, elapsed);
        }
        if (elapsed === 1) {
            if (this._repeat > 0) {
                if (isFinite(this._repeat)) {
                    this._repeat--;
                }
                for (const property in this._initial) {
                    if (this._yoyo) {
                        const tmp = this._valuesStart[property];
                        this._valuesStart[property] = this._valuesEnd[property];
                        this._valuesEnd[property] = tmp;
                    }
                    this._valuesStart[property] = this._initial[property];
                }
                if (this._yoyo) {
                    this._reversed = !this._reversed;
                }
                if (this._repeatDelayTime !== undefined) {
                    this._startTime = time + this._repeatDelayTime;
                } else {
                    this._startTime = time + this._delayTime;
                }
                return true;
            } else {
                if (this._onCompleteCallback !== null) {
                    this._onCompleteCallback(this._object);
                }
                for (let i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
                    this._chainedTweens[i].start(this._startTime + this._duration);
                }
                return false;
            }
        }
        return true;
    }
}

TWEEN.Tween = Tween;

// Easing functions
TWEEN.Easing = {
    Linear: {
        None: function (k) {
            return k;
        }
    },
    Quadratic: {
        In: function (k) {
            return k * k;
        },
        Out: function (k) {
            return k * (2 - k);
        },
        InOut: function (k) {
            if ((k *= 2) < 1) return 0.5 * k * k;
            return -0.5 * (--k * (k - 2) - 1);
        }
    }
};

// Interpolation functions
TWEEN.Interpolation = {
    Linear: function (v, k) {
        const m = v.length - 1;
        const f = m * k;
        const i = Math.floor(f);
        const fn = TWEEN.Interpolation.Utils.Linear;

        if (k < 0) return fn(v[0], v[1], f);
        if (k > 1) return fn(v[m], v[m - 1], m - f);

        return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
    },

    Utils: {
        Linear: function (p0, p1, t) {
            return (p1 - p0) * t + p0;
        }
    }
};

export { TWEEN }; 