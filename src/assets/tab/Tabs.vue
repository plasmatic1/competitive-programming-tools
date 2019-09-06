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

// Margin Stuff
$tab-v-padding: 10px;
$tab-h-padding: 7px;

// Color stuff
$selected-bg-color: map-get($theme, 2);

// Effect stuff
$transition-duration: 0.6s;

.container {
    margin-top: 15px;
}

// Join the background when a tab is selected
.tab-selected {
    background: $selected-bg-color;
    border-bottom: none !important;
}

// --------------
// Navigation bar
// --------------
.tab-nav {
    ul {
        // Styles for each tab in the navigation
        li {
            // Hover color
            &:hover {
                transition: $transition-duration;
                background: map-get($theme, 3);
            }
            transition: $transition-duration;

            // -------------
            // Button itself
            // -------------
            button {
                // Hover color
                &:hover {
                    transition: $transition-duration;
                    color: map-get($theme, 5);
                }
                transition: $transition-duration;

                // Text based-stuff
                font: 15pt $font-family;
                color: map-get($theme, 4);
                text-decoration: none;
                list-style: none;

                // Modify height
                padding: $tab-v-padding 0 0 0;  

                // Get rid of ugly default stuff
                background: transparent;
                border: none;
            }

            display: inline;
            margin: 0 10px;
            padding: $tab-v-padding $tab-h-padding ($tab-v-padding - 1) $tab-h-padding;
            border-top-left-radius: 5px;
            border-top-right-radius: 5px;
        }

        // Styles for the navbar itself
        margin-bottom: ($tab-v-padding - 3);
    }

    margin-bottom: 0;
}

// Display for all the actual text
.tab-disp {
    margin: 0 10px 10px 10px;
    padding: 10px;
    background: $selected-bg-color;
    border-radius: 10px;
}

</style>
