<template>
    <div>
        <ol v-for="(event, index) in this.events" :key="index">
            <li>{{ event }}</li>
        </ol>
    </div>
</template>

<script>
export default {
    name: 'RunProgram',
    props: {
        curEvent: Object
    },
    data() {
        return {
            events: []
        }
    },
    watch: {
        'curEvent': function() {
            const event = this.curEvent;
            events.push(JSON.stringify(event));
        }
    }
}
</script>

<style lang="scss" scoped>

</style>
