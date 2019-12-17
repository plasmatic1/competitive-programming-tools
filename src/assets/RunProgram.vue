<template>
    <div>
        <h1>Build and Run</h1>

        <div id="compileErrorDiv" v-if="this.compileError !== null">
            <h2>Compile Errors</h2>
            <p>{{ this.compileError }}</p>
        </div>

        <div id="verdictDiv">
            <ul v-for="(testCase, index) in this.cases" :key="index">
                <li>
                    <span :class="[`verdict-style-${testCase.verdict}`]">{{ testCase.verdict.toUpperCase() }}</span>
                </li>
            </ul>
        </div>

        <ol v-for="(event, index) in this.events" :key="index">
            <li>{{ event }}</li>
        </ol>
    </div>
</template>

<script>
// Event Stuff
import EventBus from './eventBus';
import EventTypes from './eventTypes';

export default {
    name: 'RunProgram',
    props: {
    },
    data() {
        return {
            events: [],
            cases: [],
            compileError: null
        }
    },
    methods: {
    },
    mounted() {
        EventBus.$on('buildAndRun', event_ => {
            const { type, event } = event_;
            console.log('buildAndRun: ', JSON.stringify(event));
            this.events.push(`${type}: ${JSON.stringify(event)}`);

            if (event.caseNo !== -1)
                var curCase = this.cases[event.caseNo];

            if (type === 'compilerError') {

            }
            else if (type === 'beginCase') {

            }
            else if (type === 'updateTime') {

            }
            else if (type === 'updateMemory') {

            }
            else if (type === 'updateStdout') {

            }
            else if (type === 'updateStderr') {

            }
            else if (type === 'end') {

            }
            else if (type === 'reset') {
                this.cases.length = 0;
                for (let i = 0; i < event.caseCnt; i++) {
                    this.cases.push({
                        id: i,
                        visible: true,
                        stdin: '',
                        stdout: '',
                        stderr: '',
                        time: -1,
                        memory: -1,
                        exitInfo: [],
                        verdict: 'wj'
                    });
                }

                this.compileError = null;
            }
        });
    },
    watch: {

    }
}
</script>

<style lang="scss" scoped>

@import 'scss/global.scss';
@import 'scss/main.scss';

h1 {
    margin-top: 0;
}

.verdict-style-ac {
    color: green;
    font-weight: bold;
}

.verdict-style-wa {
    color: red;
    font-weight: bold;
}

.verdict-style-re {
    color: orange;
    font-weight: bold;
}

.verdict-style-wj { // Waiting for judge
    color: map-get($theme, 4);
    font-style: italic;
}

</style>
