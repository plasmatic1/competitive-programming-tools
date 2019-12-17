<template>
    <div>
        <h1>Build and Run</h1>

        <div id="compileErrorDiv" v-if="this.compileErrors.length !== 0">
            <h3>Compile/Data Errors</h3>
            <p v-for="(error, index) in this.compileErrors" :key="index">
                {{ error }}
            </p>
        </div>

        <div id="verdictDiv">
            <span>Verdicts: </span>
            <a v-for="(testCase, index) in this.cases" :key="index" href="`#case-${index}`"
                :class="[`verdict-style-${testCase.verdict}`, 'verdict']">{{ testCase.verdict.toUpperCase() }}</a>
        </div>

        <div id="casesDiv">
            <div v-for="(testCase, index) in this.cases" :key="index" :id="`case-${index}`" class="case-div">
                <h2>Case #{{ index + 1 }}</h2>

                <table>
                    <tr>
                        <th>Input:</th>
                        <th>User Output:</th>
                    </tr>
                    <tr>
                        <td>
                            <StreamText :data="testCase.stdin"/>
                        </td>
                        <td>
                            <StreamText :data="testCase.stdout" />
                        </td>
                    </tr>
                    <tr>
                        <th>Error Stream:</th>
                        <th>Correct Output:</th>
                    </tr>
                    <tr>
                        <td>
                            <StreamText :data="testCase.stderr" />
                        </td>
                        <td>
                            <StreamText :data="testCase.judgeOut" />
                        </td>
                    </tr>
                </table>

                <table>
                    <tr>
                        <td>Time (ms): </td>
                        <td>{{ testCase.time }}</td>
                    </tr>
                    <tr>
                        <td>Memory (mb): </td>
                        <td>{{ testCase.memory }}</td>
                    </tr>
                    <tr v-show="testCase.exitInfo.length !== 0">
                        <td>{{ testCase.exitInfo[0] }}</td>
                        <td>{{ testCase.exitInfo[1] }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- <ol v-for="(event, index) in this.events" :key="index">
            <li>{{ event }}</li>
        </ol> -->
    </div>
</template>

<script>
// Event Stuff
import EventBus from './eventBus';
import EventTypes from './eventTypes';

// Components
import StreamText from './StreamText';

export default {
    name: 'RunProgram',
    components: {
        StreamText
    },
    props: {
    },
    data() {
        return {
            // events: [],
            cases: [],
            compileErrors: []
        }
    },
    methods: {
    },
    mounted() {
        EventBus.$on('buildAndRun', event_ => {
            const { type, event } = event_;
            // console.log('buildAndRun: ', JSON.stringify(event));
            // this.events.push(`${type}: ${JSON.stringify(event)}`);

            if (event.caseNo !== -1)
                var curCase = this.cases[event.caseNo];

            if (type === 'compileError') {
                this.compileErrors.push(event.data);
                if (event.fatal) {
                    this.cases.length = 0;
                }
            }
            else if (type === 'beginCase') {
                curCase.verdict = 'jd';
                curCase.stdin = event.input;
                curCase.judgeOut = event.output;
            }
            else if (type === 'updateTime') {
                curCase.time = event.newElapsed;
            }
            else if (type === 'updateMemory') {
                curCase.memory = event.newMemory;
            }
            else if (type === 'updateStdout') {
                curCase.stdout += event.data;
            }
            else if (type === 'updateStderr') {
                curCase.stderr += event.data;
            }
            else if (type === 'end') {
                curCase.exitInfo = event.endMsg;

                // setting verdict
                if (event.isRuntimeError)
                    curCase.verdict = 're';
                else {
                    if (event.isCorrect)
                        curCase.verdict = 'ac';
                    else
                        curCase.verdict = 'wa';
                }
            }
            else if (type === 'reset') {
                this.cases.length = 0;
                for (let i = 0; i < event.caseCnt; i++) {
                    this.cases.push({
                        id: i,
                        visible: true,
                        stdin: '',
                        stdout: '',
                        judgeOut: undefined,
                        stderr: '',
                        time: -1,
                        memory: -1,
                        exitInfo: [],
                        verdict: 'wj'
                    });
                }

                this.compileErrors = [];
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

// General formatting
h1 {
    margin-top: 0;
}

#compileErrorDiv {
    border: 1px solid map-get($theme, 3);
    padding: 0 7px 2px 7px;
    margin: 10px;

    h3 {
        margin-top: 5px;
        margin-bottom: 2px;
    }

    p {
        margin: 0 0 2px 0;
        // border: 1px solid red;
    }
}

.case-div {
    margin-bottom: 30px;

    h2 {
        margin-bottom: 0;
    }
}

// Verdict-related stuff
#verdictDiv {
    margin-left: 0;
}

.verdict {
    margin-left: 7px;
}

.verdict-style-ac {
    color: mix(map-get($theme, 4), green, 80%);
    font-weight: bold;
}

.verdict-style-wa {
    // color: red;
    color: mix(map-get($theme, 4), red, 80%);
    font-weight: bold;
}

.verdict-style-re {
    color: mix(map-get($theme, 4), orange, 80%);
    font-weight: bold;
}

.verdict-style-wj, .verdict-style-jd { // Waiting for judge
    color: map-get($theme, 4);
    font-style: italic;
}

</style>
