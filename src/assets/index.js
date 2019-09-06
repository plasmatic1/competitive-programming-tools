import style from './main.scss';
import Vue from 'vue/dist/vue.js';
import App from './App';

new Vue({
    el: '#app',
    render: h => h(App)
});

console.log('Working...');

// Vue.component('std-row', {
//     props: ['title', 'ifempty', 'data', 'visible'],
//     data: () => { 
//         return { 
//             data: '', 
//             visible: true 
//         }; 
//     },
//     computed: {
//         getText: function() {
//             if (!this.visible) 
//                 return 'Hidden.';
//             else if (this.data === '')
//                 return this.ifempty;
//             return this.data;
//         }
//     },
//     template: `
//     <tr>
//         <td class="streamItem">
//             <span class="header-small">{{ title }}</span><br>
//             <a href="#invalid" v-on:click="() => visible = !visible">{{ visible ? 'Hide' : 'Show' }}</a>
//         </td>
//         <td class="streamItem" :class="{ hiddenItem: !visible, emptyItem: visible && data === '' }"><code>{{ getText }}</code></td>
//     </tr>`
// });

// let caseCount = parseInt('${caseCount}'), srcName = '${srcName}', charLimit = parseInt('${charLimit}');
// const vscode = acquireVsCodeApi();

// const casesApp = new Vue({
//     el: '#cases',
//     data: {
//         visible: true,
//         cases: []
//     },
//     methods: {
//         toggleVar: function(id, key) {
//             this.cases[id][key] = !this.cases[id][key];
//         },
//         killProcess: () => vscode.postMessage('kill')
//     }
// });

// const compileErrorApp = new Vue({
//     el: '#compileError',
//     data: {
//         data: []
//     }
// });

// function unlinkWebview() {
//     vscode.postMessage('unlink');
//     document.getElementById('unlinkWebviewDiv').innerHTML += '<br><span style="font-size: 11pt; color: #777;"><i>Unlinked current webview!</i></span>';
// }

// function reset() {
//     document.getElementsByName('title').forEach(ele => ele.innerHTML = `Output of "${srcName}"`);
//     compileErrorApp.data = [];
//     casesApp.visible = true;
//     casesApp.cases.length = 0;

//     for (var i = 0; i < caseCount; i++) {
//         casesApp.cases.push({
//             id: i,
//             visible: true,
//             stdin: '',
//             stdout: '',
//             stderr: '',
//             time: -1,
//             memory: -1,
//             exitInfo: ['', '']
//         });
//     }
// }

// reset();

// window.addEventListener('message', event_ => {
//     const event = event_.data, type = event.type, caseNo = event.caseNo, curCase = casesApp.cases[caseNo];
//     // console.log(`Event: ${JSON.stringify(event)}`);
    
//     if (type == 'compilerError') {
//         compileErrorApp.data.push(event.data);
//         if (event.fatal) {
//             casesApp.visible = false;
//         }
//     }
//     else if (type == 'beginCase') {
//         curCase.stdin = event.input;
//     }
//     else if (type == 'updateTime') {
//         curCase.time = Math.max(curCase.time, event.newElapsed);
//     }
//     else if (type == 'updateMemory') {
//         curCase.memory = event.newMemory;
//     }
//     else if (type == 'updateStdout') {
//         // console.log(event.data.toString());
//         if (curCase.stdout.length < charLimit) {
//             curCase.stdout += event.data;
//             if (curCase.stdout.length > charLimit)
//                 curCase.stdout = curCase.stdout.substr(0, charLimit) + '\n[Truncated]';
//         }
//     }
//     else if (type == 'updateStderr') {
//         if (curCase.stderr.length < charLimit) {
//             curCase.stderr += event.data;
//             if (curCase.stderr.length > charLimit)
//                 curCase.stderr = curCase.stderr.substr(0, charLimit) + '\n[Truncated]';
//         }
//     }
//     else if (type == 'end') {
//         curCase.exitInfo = event.endMsg;
//     }
// });

// // When ready
// vscode.postMessage('ready');
