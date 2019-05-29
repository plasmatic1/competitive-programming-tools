const casesElement = document.getElementById('cases');
var caseId = -1, curCase = undefined;

const casesApp = new Vue({
    el: '#cases',
    data: {
        visible: true,
        cases: []
    },
    methods: {
        toggleVar: function(id, key) {
            this.cases[id][key] = !this.cases[id][key];
        }
    }
});

const compileErrorApp = new Vue({
    el: '#compileError',
    data: {
        data: ''
    }
});

window.addEventListener('message', event => {
    const type = event.type;
    console.log(`Event: ${JSON.stringify(event)}`);

    if (type == 'compilerError') {
        compileErrorApp.data = event.data;
        if (event.fatal) {
            casesApp.visible = false;
        }
    }
    else if (type == 'beginCase') {
        caseId++;
        curCase = {
            id: caseId,
            stdin: event.input,
            stdinVisible: false,
            stdout: '',
            stdoutVisible: true,
            stderr: '',
            stderrVisible: false,
            time: 'negligible',
            memory: 'negligible',
            exitInfo: ''
        }
        casesApp.cases.push(curCase);
    }
    else if (type == 'updateTime') {
        curCase.time = event.newElapsed.toString();
    }
    else if (type == 'updateMemory') {
        curCase.memory = event.newMemory.toString();
    }
    else if (type == 'updateStdout') {
        curCase.stdout += event.data;
    }
    else if (type == 'updateStderr') {
        curCase.stderr += event.data;
    }
    else if (type == 'end') {
        curCase.exitInfo = event.endMsg;
    }
});