import React from 'react';
import ReactDOM from 'react-dom';
import EventBus from './vscodeEventBus';
import './scss/input.scss';
 
class InputDisplay extends React.Component {
    constructor(props) {
        super(props);

        // Initialize state
        this.state = {
            // Command State info
            curCommand: '',
            lastCommandOutput: null,

            // Current test set being viewed state info
            curTestSet: null,
            curTestIndex: null,
            curTestInput: null,
            curTestOutput: null,

            // Test cases
            cases: {}
        };
        
        // Initialize other event handlers
        EventBus.on('caseCommand', resp => {
            if (resp.length > 0)
                this.setState({ lastCommandOutput: resp });
        });
        EventBus.on('updateAll', cases => {
            this.setState({ cases });
            if (this.state.eurTestIndex !== null) // Refresh current open test case
                this.selectTestCase(this.state.curTestIndex);
        });
        EventBus.on('updateStructure', _ => { throw new Error('Not implemented yet (defunct)'); });
        EventBus.on('updateCase', caseUpdate => {
            const casesObj = this.state.cases;
            casesObj[caseUpdate.key][caseUpdate.index][caseUpdate.isInput ? 'input' : 'output'] = caseUpdate.newData;
        });

        // Add key listener
        this._keyListener = function(e) {
            const lowerKey = e.key.toLowerCase();

            if (e.key === 'Enter') // user pressed enter
                this.dispatchCommand();
            else if (e.ctrlKey && lowerKey === 's') // user pressed Ctrl+S, Save current case 
                this.saveCurTestCase();
            else if (e.ctrlKey && lowerKey === 'r') { // user pressed Ctrl+R, Refresh all cases
                EventBus.post('updateAll');
                e.preventDefault();
            }

            // Navigating current selected case
            // else if (this.state.curTestIndex !== null && lowerKey === 'a') { // Move cur case left 
            //     if (e.shiftKey)
            //         this.setState({ curTestIndex: 0 });
            //     else if (this.state.curTestIndex > 0)
            //         this.setState({ curTestIndex: this.state.curTestIndex - 1 });
            // }
            // else if (this.state.curTestIndex !== null && lowerKey === 'd') { // Move cur case right
            //     if (e.shiftKey)
            //         this.setState({ curTestIndex: this.state.cases[this.state.curTestSet].length - 1 });
            //     else if (this.state.curTestIndex < this.state.cases[this.state.curTestSet].length - 1)
            //         this.setState({ curTestIndex: this.state.curTestIndex + 1 });
            // }
        };
        document.addEventListener('keydown', this._keyListener.bind(this));

        // We're ready!
        EventBus.post('updateAll');
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this._keyListener);
    }

    /**
     * Sends a command back to the extension host
     */
    dispatchCommand() {
        if (this.state.curCommand === null || this.state.curCommand.length === 0) return; // Empty command
        EventBus.post('caseCommand', this.state.curCommand);
        this.setState({ curCommand: '' });
    }

    /**
     * Selects a test set (for viewing/editing)
     * @param {string} testSetName The name of the test set to select (assumed valud)
     */
    selectTestSet(testSetName) {
        this.setState({ 
            curTestSet: testSetName,
            curTestIndex: this.state.cases[testSetName].length > 0 ? 0 : -1
        });
    }

    /**
     * Selects a test case (for viewing/editing)
     * @param {string} index The index of the test case to select
     */
    selectTestCase(index) {
        this.setState({
            curTestIndex: index,
            curTestInput: this.state.cases[this.state.curTestSet][index].input,
            curTestOutput: this.state.cases[this.state.curTestSet][index].output,
        });
    }

    /**
     * Save the data of the current edited test case
     */
    saveCurTestCase() {

    }

    render() {
        const { curCommand } = this.state;

        return (
            <div>
                <h1>Test Cases</h1>
                <a id="refresh-link" href="#" onClick={() => EventBus.post('updateAll')}>Refresh (Ctrl+R)</a>

                {/* Command input/output */}
                <div id="command-input-div">
                    <input placeholder="Type a command here..." value={curCommand} onChange={e => this.setState({ curCommand: e.target.value })}></input>
                    <button onClick={() => this.dispatchCommand()}>Run (Enter)</button>
                </div>

                { this.state.lastCommandOutput &&
                    <p>{this.state.lastCommandOutput}</p>
                }

                <div id="test-set-display-div">
                    {/* Display status of current test set and test case selection menu */}
                    <div id="test-set-display">
                        { this.state.curTestSet ?
                            <table>
                                <tr>
                                    <th>Case</th>
                                    <th>On/Off</th>
                                    <th>Edit Input</th>
                                    <th>Edit Output</th>
                                </tr>
                                { this.state.cases[this.state.curTestSet].map((testCase) => 
                                    <tr key={testCase.index}>
                                        <td>{testCase.index}</td>
                                        <td>{testCase.disabled ? 'Disabled' : 'Not Disabled'}</td>
                                        <td><a href="#" onClick={() => EventBus.post('openCaseFile', { key: this.state.curTestSet, index: testCase.index, isInput: true })}>Edit</a></td>
                                        <td><a href="#" onClick={() => EventBus.post('openCaseFile', { key: this.state.curTestSet, index: testCase.index, isInput: false })}>Edit</a></td>
                                    </tr>
                                )}
                            </table> :
                            <p class="none-selected">No test set selected...</p>
                        }
                    </div>

                    <div id="test-set-list">
                        <h2>Test Sets</h2>
                        <ul>
                            { Object.keys(this.state.cases).map(testSetName => 
                                <li key={testSetName}>
                                    <a href="#" onClick={() => this.selectTestSet(testSetName)}>{testSetName}</a>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Select Test Case to Edit */}
                { this.state.curTestSet &&
                    <div class="selection">
                        <span>Test Cases: </span>
                        { this.state.cases[this.state.curTestSet].map((_, index) =>
                            <a href="#" key={index} class={this.state.curTestIndex === index ? 'selected-case' : null}
                                onClick={() => this.selectTestCase(index)}>[ {index} ]</a>
                        )}
                    </div>
                }

                {/* Editing test cases */}
                <h2>Editing Case {this.state.curTestIndex}</h2>
                <div>
                    { this.state.curTestIndex !== null ? (
                        <React.Fragment>
                            <div id="data-input">
                                <div>
                                    <h3>Input</h3>
                                    <textarea rows="20" value={this.state.curTestInput} onChange={e => this.setState({ curTestInput: e.target.value})}></textarea>
                                </div>

                                <div>
                                    <h3>Output</h3>
                                    <textarea rows="20" value={this.state.curTestOutput} onChange={e => this.setState({ curTestOutput: e.target.value})}></textarea>
                                </div>
                            </div>

                            <button id="save-button" onClick={this.saveCurTestCase}>Save (Ctrl+S)</button>
                        </React.Fragment>
                    ) : <p class="none-selected">No test case selected...</p> }
                </div>
            </div>
        );
    }
}

let App = document.getElementById('app');
ReactDOM.render(<InputDisplay />, App);
