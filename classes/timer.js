class Timer {
    /**
     * Creates an instance of Timer.
     *
     * @constructor
     * @param {number} duration - The duration of the timer in mins.
     * @param {string} name - The name of the timer.
     * @param {string} userId - The ID of the user associated with the timer.
     * @param {Function|null} [callback=null] - Optional callback function to be called when the timer completes.
     * @param {string} [type='countdown'] - The type of the timer, default is 'countdown'.
     */
    constructor(duration, name, userId, callback = null, type = 'countdown') {
        this.id = crypto.randomUUID();
        this.duration = duration;
        this.remainingTime = duration;
        this.name = name;
        this.userId = userId;
        this.status = 'initialized';
        this.startTime = null;
        this.endTime = null;
        this.callback = callback;
        this.type = type;
        this.intervals = [];
    }

    /**
     * Starts the timer if it is in the 'initialized' or 'paused' state.
     * Changes the status to 'running' and sets the start time.
     * Returns a promise that resolves when the timer completes.
     *
     * @returns {Promise<Timer|boolean>} A promise that resolves with the Timer instance when completed,
     *                                   or false if the timer cannot be started.
     */
    start() {
        if (this.status !== 'initialized' && this.status !== 'paused') {
            return false;
        }
        this.status = 'running';
        this.startTime = Date.now();

        return new Promise((resolve, reject) => {
            this.timer = setTimeout(
                () => {
                    this.complete();
                    resolve(this);
                },
                Number(this.remainingTime * 60000)
            );
        });
    }

    /**
     * Resets the timer to its initial state.
     * Clears any running timeout and resets the remaining time, start time, end time, and status.
     *
     * @returns {Timer|Boolean} The Timer instance, allowing for method chaining.
     */
    pause() {
        if (this.status !== 'running') {
            return false;
        }
        clearTimeout(this.timer);
        const elapsedTime = Date.now() - this.startTime;
        this.remainingTime -= elapsedTime;
        this.status = 'paused';
        return this;
    }

    /**
     * Resumes a paused timer by starting it again
     *
     * @returns {Promise<Timer>|boolean} Returns a Promise that resolves with the Timer instance if successful,
     *                                   or false if timer is not in paused state
     */
    resume() {
        if (this.status !== 'paused') {
            return false;
        }
        return this.start();
    }

    /**
     * Marks the timer as completed, sets the end time, and executes the callback if provided.
     *
     * @returns {Timer} The Timer instance, allowing for method chaining.
     */
    async complete() {
        this.status = 'completed';
        this.endTime = Date.now();

        if (typeof this.callback === 'function') {
            await Promise.resolve(this.callback(this));
        }
        return this;
    }

    /**
     * Resets the timer to its initial state by clearing the timeout,
     * restoring the remaining time to the original duration, and
     * resetting all time tracking properties.
     *
     * @returns {Timer} The Timer instance for method chaining
     */
    reset() {
        clearTimeout(this.timer);
        this.remainingTime = this.duration;
        this.startTime = null;
        this.endTime = null;
        this.status = 'initialized';
        return this;
    }

    /**
     * Adds an interval that executes a callback function at a specified duration
     * while the timer is running.
     *
     * @param {Function} callback - The callback function to be executed at each interval.
     * @param {number} intervalDuration - The duration of the interval in milliseconds.
     * @returns {Timer} The Timer instance, allowing for method chaining.
     */
    addInterval(callback, intervalDuration) {
        const interval = setInterval(() => {
            if (this.status === 'running') {
                callback(this);
            }
        }, intervalDuration);
        this.intervals.push(interval);
        return this;
    }

    /**
     * Clears all registered intervals and empties the intervals array
     *
     * @returns {void}
     */
    clearIntervals() {
        this.intervals.forEach(clearInterval);
        this.intervals = [];
    }
}

export default Timer;
