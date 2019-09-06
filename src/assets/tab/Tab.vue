<template>
    <div v-show="selected"><slot></slot></div>
</template>

<script>

export default {
    name: 'Tab',
    props: {
        name: { required: true },
        selected: { default: false }
    }
}

</script>

<style lang="scss" scoped>

</style>
