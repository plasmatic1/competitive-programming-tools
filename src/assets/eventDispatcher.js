import Vue from 'vue/dist/vue.js';

const vscode = acquireVsCodeApi();

let bus = new Vue();
window.addEventListener('message', event_ => {
    const event = event_.data.event, type = event_.data.type;
    bus.$emit(type, event);
});

bus.$post = (type, event = undefined) => {
    vscode.postMessage({
        type, event
    });
};

export default bus;
