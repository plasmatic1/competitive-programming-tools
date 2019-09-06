<template>
<div>
    <Tabs>
        <Tab name="Build and Run">
            Build and Run
        </Tab>
        <Tab name="Input/Output" selected="true">
            Input/Output
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
    // import RunProgram from './RunProgram';
    import CaseData from './CaseData';
    // import Tools from './Tools';
    // import Settings from './Settings';

    export default {
        name: 'App',
        components: {
            Tabs,
            Tab,
            // Parts
            CaseData
        }
    };
</script>

<style lang="scss" scoped>

</style>
