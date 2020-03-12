import React from 'react';
import ReactDOM from 'react-dom';
import EventBus from './vscodeEventBus';

class OptionsDisplay extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            options: {}
        };

        EventBus.on('initialize', evt => { this.setState({ options: evt }) });
        EventBus.on('setOption', evt => {
            const { category, key, value } = evt;
            let options = this.state.options;
            options[category].options[key].value = value;
            this.setState({ options });
        });

        EventBus.post('ready');
    }
    
    render() {
        return (
            <div>
                { Object.entries(this.state.options).map(([categoryKey, category]) => 
                    <div key={categoryKey} class="category-div">
                        <h1>{category.label}
                            <button onClick={() => EventBus.post('resetCategory', categoryKey)}>Reset Category</button>
                        </h1>
                        <p class="category-description">{category.description}</p>

                        { Object.entries(category.options).map(([optionKey, option]) =>
                            <div key={optionKey} class="option-div">
                                <div>
                                    <div>
                                        <span class="option-heading">{option.label}</span>
                                        <span class="option-type">[{option.type}]</span>
                                        <span class="option-full-key"> ({categoryKey}.{optionKey})</span>
                                    </div>

                                    <div>{option.description}</div>

                                    <div class="option-value-div">
                                        <div class="option-value">
                                            <span>{option.value}</span>
                                        </div>
                                        <a href="#" onClick={() => EventBus.post('setOption', { category: categoryKey, key: optionKey })}>Edit</a>
                                        <a href="#" onClick={() => EventBus.post('resetOption', { category: categoryKey, key: optionKey })}>Reset</a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button onClick={() => EventBus.post('resetOptions')}>Reset ALL Options</button>
            </div>
        );
    }
}

let App = document.getElementById('app');
ReactDOM.render(<OptionsDisplay/>, App);

/*
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
*/
