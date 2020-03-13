class TestEventBus {
    /**
     * Constructor function.  Not much to see here.
     */
    constructor() {
        this.handles = {};
    }

    _emit(type, event) {
        if (this.handles[type] !== undefined)
            for (const handle of this.handles[type])
                handle(event);
    }
    
    /**
     * Registers a new event handler for the given type
     * @param {string} type Type of event to handle
     * @param {function} handle The handler for the event
     */
    on(type, handle) {
        if (this.handles[type] === undefined)
            this.handles[type] = [handle];
        else
            this.handles[type].push(handle);
    }

    /**
     * Simulates sending an event back to the extension host
     * @param {string} type Type of event to send
     * @param {object} event The event object to send
     */
    post(type, event) {
        console.log(`${type}: ${event}`);
    }
}

export default TestEventBus;
