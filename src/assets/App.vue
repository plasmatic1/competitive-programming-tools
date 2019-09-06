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

    export default {
        name: 'App',
        components: {
            Tabs,
            Tab
        }
    };
</script>

<style lang="scss" scoped>

</style>
