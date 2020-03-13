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
            cases: []
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
            if (e.keyCode === Keys.ENTER) // user pressed enter
                this.dispatchCommand();
            if (e.ctrlKey && e.key === 's') // user pressed Ctrl+S, Save current case 
                this.saveCurTestCase();
            if (e.ctrlKey && e.key === 'r') // user pressed Ctrl+R, Refresh all cases
                EventBus.post('updateAll');
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
        if (this.state.curCommand.length === 0) return; // Empty command
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
        return (
            <div>
                <h1>Test Cases</h1>
                <a href="#" onClick={() => EventBus.post('updateAll')}>Refresh (Ctrl+R)</a>

                {/* Command input/output */}
                <input id="commandInput" placeholder="Type a command here..." value={this.state.curCommand} onChange={e => this.setState({ curCommand: e.target.value })}></input>
                <button onClick={this.dispatchCommand()}>Run (Enter)</button>

                { this.state.lastCommandOutput &&
                    <p>{this.state.lastCommandOutput}</p>
                }

                {/* Display status of current test set and test case selection menu */}
                { this.state.curTestSet ?
                    <table>
                        <col width="10em" />
                        <col width="100%" />

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
                    <p>No test set selected...</p>
                }

                <h2>Test Sets</h2>
                <ul>
                    { Object.keys(this.state.cases).map(testSetName => 
                        <li key={testSetName}>
                            <a href="#" onClick={() => this.selectTestSet(testSetName)}>{testSetName}</a>
                        </li>
                    )}
                </ul>

                {/* Select Test Case to Edit */}
                { this.state.curTestSet &&
                    <div>
                        <span>Test Cases: </span>
                        { this.state.cases[this.state.curTestSet].map((_, index) =>
                            <a href="#" key={index} onClick={() => this.selectTestCase(index)}>{index}</a>
                        )}
                    </div>
                }

                {/* Editing test cases */}
                { this.state.curTestIndex !== null ? (
                    <div>
                        <h3>Editing Case {this.state.curTestIndex}</h3>

                        <h4>Input</h4>
                        <div>
                            <textarea value={this.state.curTestInput} onChange={e => this.setState({ curTestInput: e.target.value})}></textarea>
                        </div>

                        <h4>Output</h4>
                        <div>
                            <textarea value={this.state.curTestOutput} onChange={e => this.setState({ curTestOutput: e.target.value})}></textarea>
                        </div>

                        <button onClick={this.saveCurTestCase}>Save (Ctrl+S)</button>
                    </div>
                ) : <p>No test case selected...</p> }
            </div>
        );
    }
}

let App = document.getElementById('app');
ReactDOM.render(<InputDisplay />, App);
