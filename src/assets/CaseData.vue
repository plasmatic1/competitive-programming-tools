<template>
    <div>
        <div>
            <button @click="addCase()">Add Case (Ctrl+T)</button>
            <button @click="saveCases()">Save Cases (Ctrl+S)</button>
            <button @click="resetCases()"> class="danger">Reset Cases</button>
        </div>
        <div>
            <div v-for="(testCase, index) in cases" :key="index">
                <p>{{ JSON.stringify(testCase) }}</p>
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
                output: undefined
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
            this.cases.length = 0;
            EventBus.$emit(EventType.PostEventToMain, 'inputOutput', {
                type: 'resetCases',
                event: undefined
            });
        }
    },
    mounted() {
        this._keyListener = function(e) {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 't') { // Add new case
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
    },
    beforeDestroy() {
        document.removeEventListener('keydown', this._keyListener);
    }
}
</script>

<style lang="scss" scoped>

</style>
