<template>
<div>
    <Tabs>
        <Tab name="Build and Run">
            <RunProgram :curEvent="curBuildRunEvent" />
        </Tab>
        <Tab name="Input/Output" selected="true">
            <CaseData />
        </Tab>
        <Tab name="Extra Tools">
            Extra Tools
        </Tab>
        <Tab name="Settings">
            Settings
        </Tab>
    </Tabs>
</div>
</template>

<script>
    import Tabs from './tab/Tabs';
    import Tab from './tab/Tab';
    
    // Parts of the app
    import RunProgram from './RunProgram';
    import CaseData from './CaseData';
    // import Tools from './Tools';
    // import Settings from './Settings';

    // Event stuff
    import EventBus from './eventBus';
    import EventType from './eventTypes';

    export default {
        name: 'App',
        components: {
            Tabs,
            Tab,
            // Parts
            CaseData,
            RunProgram
        },
        data() {
            return {
                curBuildRunEvent: {}
            }
        },
        mounted() {
            window.addEventListener('message', event_ => {
                const event = event_.event, type = event_.type;

                if (type === 'buildAndRun') {
                    curBuildRunEvent = event;
                }
                else if (type === 'tools') {

                }
                else if (type === 'settings') {

                }
                // else if (type === 'inputOutput') {

                // }
            });

            const vscode = acquireVsCodeApi();

            console.log(JSON.stringify(EventType));
            EventBus.$on(EventType.PostEventToMain, (type, event) => {
                vscode.postMessage({ type, event });
            });
        }
    };
</script>

<style lang="scss" scoped>

</style>
