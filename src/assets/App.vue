<template>
<div>
    <Tabs ref="tabsEl">
        <Tab name="Input/Output" selected="true">
            <CaseData ref="inputOutputEl" />
        </Tab>
        <Tab name="Build and Run">
            <RunProgram />
        </Tab>
        <Tab name="Debug">
            <Debug />
        </Tab>
        <Tab name="Extra Tools">
            Extra Tools
        </Tab>
        <Tab name="Options">
            <Options ref="optionsEl" />
        </Tab>
    </Tabs>
</div>
</template>

<script>
    import Tabs from './tab/Tabs';
    import Tab from './tab/Tab';
    
    // Parts of the app
    import RunProgram from './RunProgram';
    import Debug from './Debug';
    import CaseData from './CaseData';
    // import Tools from './Tools';
    import Options from './Options';

    // Auxillary Stuffs for child components
    import StreamText from './StreamText';

    // Event stuff
    import EventBus from './eventBus';
    import EventTypes from './eventTypes';

    export default {
        name: 'App',
        components: {
            // Tab stuff
            Tabs,
            Tab,
            
            // Parts
            RunProgram,
            Debug,
            CaseData,
            // Tools,
            Options,

            // Auxillary Stuff
            StreamText
        },
        data() {
            return {
                
            }
        },
        mounted() {
            // Listen for messages
            window.addEventListener('message', (event_) => {
                const event = event_.data.event, type = event_.data.type;
                // console.log(`Got event ${type}: ${JSON.stringify(event)}`);
                EventBus.$emit(type, event);
            });

            const vscode = acquireVsCodeApi();

            // Handing events that are for the app
            EventBus.$on('main', event_ => {
                const { event, type } = event_;
                
                if (type === 'focusTab') {
                    this.$refs.tabsEl.selectByName(event);
                }
            });

            // Posting events to main
            EventBus.$on(EventTypes.PostEventToMain, (type, event) => {
                // console.log(`Sending event | Type: ${type}, Evt: ${event}`);
                vscode.postMessage({ type, event });
            });

            // Ready signals
            this.$refs.inputOutputEl.sendReadySignal();
            this.$refs.optionsEl.sendReadySignal();
        }
    };
</script>

<style lang="scss" scoped>

</style>
