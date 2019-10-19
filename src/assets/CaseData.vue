<template>
    <div>
        <div id="buttons">
            <button @click="addCase()">Add Case (Ctrl+G)</button>
            <button @click="saveCases()">Save Cases (Ctrl+S)</button>
            <button @click="resetCases()" class="danger">Reset Cases</button>
        </div>
        <div>
            <div v-for="(testCase, index) in cases" :key="index">
                <h3>Case #{{ index + 1 }}</h3>

                <table>
                    <col width="10em">
                    <col width="100%">

                    <tr>
                        <td>Input:</td>
                        <td>
                            <div>
                                <textarea :name="`input${index}`" :id="`input${index}`" :rows="rowReq(testCase.input)" v-model="testCase.input"></textarea>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Output:</td>
                        <td>
                            <textarea :name="`output${index}`" :id="`output${index}`" :rows="rowReq(testCase.output)" v-model="testCase.output"></textarea>
                        </td>
                    </tr>
                </table>

                <!-- <p>{{ JSON.stringify(testCase) }}</p> -->
            </div>
        </div>
    </div>
</template>

<script>
// Event stuff
import EventBus from './eventBus';
import EventType from './eventTypes';

export default {
    name: 'CaseData',
    data() {
        return {
            cases: []
        }
    },
    methods: {
        /**
         * Adds a new empty case
         */
        addCase() {
            this.cases.push({
                input: '',
                output: ''
            });
        },
        /**
         * Sends the cases back to main (the extension)
         */
        saveCases() {
            EventBus.$emit(EventType.PostEventToMain, 'inputOutput', {
                type: 'setCases',
                event: this.cases
            });
        },
        /**
         * Resets (deletes) all cases
         */
        resetCases() {
            this.cases = [];
            EventBus.$emit(EventType.PostEventToMain, 'inputOutput', {
                type: 'resetCases',
                event: undefined
            });
        },

        /**
         * Sends a "ready" signal to the extension
         */
        sendReadySignal() {
            EventBus.$emit(EventType.PostEventToMain, 'inputOutput', {
                type: 'ready',
                event: undefined
            });
        },

        /**
         * Number of lines required for the text area given the current text
         * Currently set to (No. Of Lines + 1)
         */
        rowReq(input) {
            let cnt = 1;
            for (const ch of input)
                cnt += ch === '\n';
            return Math.max(cnt, 2);
        }
    },
    mounted() {
        this._keyListener = function(e) {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'g') { // Add new case
                    e.preventDefault(); // prevent "Save Page" from getting triggered.
                    this.addCase();
                }
                else if (e.key === 's') { // Save cases
                    e.preventDefault(); // prevent "Save Page" from getting triggered.
                    this.saveCases();
                }
            }
        };

        document.addEventListener('keydown', this._keyListener.bind(this));

        // Listen for events
        EventBus.$on('inputOutput', (event) => {
            // console.log('IOE: ' + JSON.stringify(event));
            if (event.type === 'setCases') { // setCases from extension
                this.cases = event.event;
            }
        });
    },
    beforeDestroy() {
        document.removeEventListener('keydown', this._keyListener);
    }
}
</script>

<style lang="scss" scoped>

@import 'scss/global.scss';

$text-color: map-get($theme, 4);
$border-color: map-get($theme, 3);

textarea, button {
    background: transparent;
    border-color: $border-color;
    color: $text-color;
}

button {
    border: 1px solid $border-color;
    border-radius: 3px;
    font: 15px $font-family;
    transition: 0.5s;

    &:hover {
        transition: 0.5s;
        background: $text-color;
    }
}

textarea {
    box-sizing: border-box;
    width: 100%;
}

table {
    width: 100%;
}

#buttons {
    margin-bottom: 7px;
}

h3 {
    color: map-get($theme, 5);
    margin-top: 8px;
    margin-bottom: 2px;
}

span {
    color: $text-color;
    
}

</style>
