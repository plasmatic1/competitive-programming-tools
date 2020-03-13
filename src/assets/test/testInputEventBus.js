import EventBus from './testEventBus';

async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

class TestEventBus extends EventBus {
    constructor() {
        super();
        this.runTestEvents();
    }

    async runTestEvents() {

    }
}

export default new TestEventBus();
