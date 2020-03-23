import React from 'react';
import ReactDOM from 'react-dom';
import EventBus from './vscodeEventBus';
import toErrorBoundedElement from './toErrorBoundedElement';
import './scss/options.scss';

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
                    <div key={categoryKey} className="category-div">
                        <h1>{category.label}
                            <button onClick={() => EventBus.post('resetCategory', categoryKey)}>Reset Category</button>
                        </h1>
                        <p className="category-description">{category.description}</p>

                        { Object.entries(category.options).map(([optionKey, option]) =>
                            <div key={optionKey} className="option-div">
                                <div>
                                    <div>
                                        <span className="option-heading">{option.label}</span>
                                        <span className="option-type">[{option.type}]</span>
                                        <span className="option-full-key"> ({categoryKey}.{optionKey})</span>
                                    </div>

                                    <div className="option-description">{option.description}</div>

                                    <div className="option-value-div">
                                        <div className="option-value">
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
const ErrorBoundedDisplay = toErrorBoundedElement(OptionsDisplay);
ReactDOM.render(<ErrorBoundedDisplay />, App);
