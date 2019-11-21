<template>
    <div>
        <h1>Debug</h1>
        <div></div>
    </div>
</template>

<script>
// Event stuff
import EventBus from './eventBus';
import EventTypes from './eventTypes';

export default {
    name: 'Debug',
    data() {
        return {
            cases: []
        }
    },
    methods: {

    },
    mounted() {
        // this._keyListener = function(e) {
        //     if (e.ctrlKey || e.metaKey) {
        //         if (e.key === 'g') { // Add new case
        //             e.preventDefault(); // prevent "Save Page" from getting triggered.
        //             this.addCase();
        //         }
        //         else if (e.key === 's') { // Save cases
        //             e.preventDefault(); // prevent "Save Page" from getting triggered.
        //             this.saveCases();
        //         }
        //     }
        // };

        // document.addEventListener('keydown', this._keyListener.bind(this));

        // // Listen for events
        // EventBus.$on('inputOutput', event => {
        //     // console.log('IOE: ' + JSON.stringify(event));
        //     if (event.type === 'setCases') { // setCases from extension
        //         this.cases = event.event;
        //     }
        // });
    },
    beforeDestroy() {
        // document.removeEventListener('keydown', this._keyListener);
    }
}
</script>

<style lang="scss" scoped>

@import 'scss/global.scss';
@import 'scss/main.scss';

h1 {
    margin-top: 0;
}

</style>
