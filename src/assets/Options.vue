<template>
    <div>
        <div v-for="(category, categoryKey) in this.options" :key="categoryKey" class="category-div">
            <h1>{{ category.label }}
                <button @click="emitEvent('resetCategory', categoryKey)">Reset Category</button>
            </h1>
            <p class="category-description">{{ category.description }}</p>

            <div v-for="(option, optionKey) in category.options" :key="optionKey" class="option-div">
                <div>
                    <div>
                        <span class="option-heading">{{ option.label }}</span>
                        <span class="option-type">[{{ option.type }}]</span>
                        <span class="option-full-key"> ({{ categoryKey }}.{{ optionKey }})</span>
                    </div>

                    <div>{{ option.description }}</div>

                    <div class="option-value-div">
                        <div class="option-value">
                            <span>{{ option.value }}</span>
                        </div>

                        <!-- <button @click="setOption(categoryKey, optionKey)" class="btn-sm">Edit</button> -->
                        <a @click="emitEvent('setOption', { category: categoryKey, key: optionKey })">Edit</a>
                        <a @click="emitEvent('resetOption', { category: categoryKey, key: optionKey })">Reset</a>
                    </div>
                </div>
            </div>
        </div>

        <button @click="emitEvent('resetOptions')">Reset ALL Options</button>
    </div>
</template>

<script>
import EventBus from './eventBus';
import EventTypes from './eventTypes';

export default {
    name: 'Options',
    props: {
    },
    data() {
        return {
            options: []
        }
    },
    methods: {
        /**
         * Sends a "ready" signal to the extension
         */
        sendReadySignal() {
            this.emitEvent('ready');
        },

        /**
         * Emits an 'options' event to the extension
         * @param type The type of event
         * @param event The event
         */
        emitEvent(type, event = undefined) {
            EventBus.$emit(EventTypes.PostEventToMain, 'options', { type, event });
        }
    },
    mounted() {
        EventBus.$on('options', event => {
            // console.log(`Options: ${JSON.stringify(event)}`);
            if (event.type === 'initialize')
                this.options = event.event;
            else if (event.type === 'setOption') {
                const { category, key, value } = event.event;
                // console.log(`Cat: ${category}, Key: ${key}, OBJ: ${JSON.stringify(this.options)}`);
                this.options[category].options[key].value = value;
            }
        });
    }
}
</script>

<style lang="scss" scoped>

@import 'scss/global.scss';
@import 'scss/main.scss';

h1 {
    color: map-get($theme, 5);
    margin-top: 0px;
    margin-bottom: 0;
}

.category-div {
    margin-bottom: 49px;
}

.category-description {
    font-style: italic;
    margin-top: 2px;
    margin-bottom: 22px;
}

.option-div {
    margin-bottom: 30px;
}

.option-value-div {
    margin: 3px 0;
    
    a {
        cursor: pointer;
        font-family: $font-family;
        font-size: 10pt;
        margin-right: 0.5em;
    }
}

.option-heading {
    font-weight: bold;
    text-decoration: underline;
    color: map-get($theme, 4);
}

.option-full-key {
    font-style: italic;
    color: map-get($theme, 3);
}

.option-type {
    color: map-get($theme, 4);
    font-family: $code-font-family;
}

.option-value {
    span {
        padding: 3px;
        font-size: 10pt;
        font-family: $code-font-family;
        background-color: map-get($theme, 1);
    }

    margin-bottom: 4px;
}

</style>
