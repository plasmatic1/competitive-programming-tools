<template>
    <div class="container">
        <div class="tab-nav">
            <ul>
                <li v-for="tab in tabs" :class="{ 'tab-selected': tab.selected }" :key="tab.name">
                    <button @click="select(tab)">{{ tab.name }}</button>
                </li>
            </ul>
        </div>

        <div class="tab-disp">
            <slot></slot>
        </div>
    </div>
</template>

<script>

export default {
    name: 'Tabs',
    data() {
        return {
            tabs: []
        }
    },
    created() {
        this.tabs = this.$children;
    },
    methods: {
        select(toSelect) {
            this.tabs.forEach(tab => tab.selected = (toSelect.name === tab.name));
        }
    }
}

</script>

<style lang="scss" scoped>

@import '../global.scss';

$tab-v-padding: 10px;
$main-border-width: 2px;
$main-border: $main-border-width solid transparent;
$selected-bg-color: map-get($theme, 2);

.container {
    margin-top: 15px;
}

.tab-selected {
    background: $selected-bg-color;
    border-bottom: none !important;
    padding-bottom: ($tab-v-padding + $main-border-width) !important;
}

.tab-nav {
    ul {
        li {
            button {
                font: 15pt 'Ubuntu';
                color: map-get($theme, 4);
                text-decoration: none;
                list-style: none;

                padding: $tab-v-padding 0 0 0;  

                background: transparent;
                border: none;
            }

            display: inline;
            margin: 0 10px;
            padding: $tab-v-padding 5px 0 5px;
            border: $main-border;
            border-top-left-radius: 5px;
            border-top-right-radius: 5px;
        }

        margin-bottom: ($tab-v-padding - 3);
    }

    margin-bottom: 0;
}

.tab-disp {
    margin: 0 10px 10px 10px;
    padding: 10px;
    background: $selected-bg-color;
    border: $main-border;
    border-radius: 10px;
}

// GET RID OF THAT GODDAMN ORANGE SELECTION BOX
// button:focus {
//     outline: 1px solid red !important;
// }

</style>
