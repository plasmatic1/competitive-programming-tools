<template>
    <div>
        <ol v-for="(event, index) in this.events" :key="index">
            <li>{{ event }}</li>
        </ol>
    </div>
</template>

<script>
import EventBus from './eventTypes';

export default {
    name: 'RunProgram',
    props: {
    },
    data() {
        return {
            events: []
        }
    },
    mount() {
        EventBus.$on('buildAndRun', (event) => {
            console.log('buildAndRun : ', JSON.stringify(event));
        });
    },
    watch: {

    }
}
</script>

<style lang="scss" scoped>
    
</style>
