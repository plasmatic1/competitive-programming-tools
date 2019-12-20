<template>
    <div>
        <div v-show="!this.isEmpty">
            <textarea v-show="this.visible" name="text" cols="60" rows="7" v-model="displayText" readonly />
            <a href="#" :click="() => { this.visible = !this.visible; return false; }">
                {{ this.visible ? 'Hide' : 'Show' }}
            </a>
        </div>
        <!-- <div v-show="this.isEmpty">
            <p id="if-empty">Empty</p>
        </div> -->
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
        },
        isEmpty() {
            return this.data === undefined || this.data.length === 0;
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

    &::-webkit-scrollbar-thumb {
        background-color: map-get($theme, 4);
    } 
}

#if-empty {
    font-style: italic;
}

</style>
