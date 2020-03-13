import EventBus from '../vscodeEventBus';

async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

class TestEventBus extends EventBus {
    constructor() {
        this.runTestEvents();
    }

    async runTestEvents() {

    }
}

export default new TestEventBus();
