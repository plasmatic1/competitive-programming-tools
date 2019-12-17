<template>
    <div>
        <textarea v-show="this.visible" name="text" cols="60" rows="7" v-model="displayText" readonly />
        <a :click="() => { this.visible = !this.visible; }">
            {{ this.visible ? 'Hide' : 'Show' }}
        </a>
    </div>
</template>

<script>

export default {
    name: 'StreamText',
    props: {
        data: { required: true, default: '' },
        initialVisible: { default: true }
    },
    data() {
        return {
            visible: this.initialVisible
        };
    },
    computed: {
        displayText() {
            if (this.visible)
                return this.data;
            else
                return 'Hidden.';
        }
    }
}

</script>

<style lang="scss" scoped>

@import 'scss/global.scss';
@import 'scss/main.scss';

textarea {
    box-sizing: border-box;
    resize: none;
    width: 100%;

    font-family: 'Courier';
    color: map-get($theme, 4);

    scrollbar-face-color: map-get($theme, 4) !important;
}

::-webkit-scrollbar-thumb {
    color: map-get($theme, 4);
}

</style>
