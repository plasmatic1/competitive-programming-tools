import React from 'react';
import ReactDOM from 'react-dom';
import * as _ from 'lodash';
import EventBus from './vscodeEventBus';
import toErrorBoundedElement from './toErrorBoundedElement';
import './scss/output.scss';

const STATUS_LIM = 15;
class OutputDisplay extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            // State variables
            executionId: -1000000000,
            result: null

            // Debugging
            // events: []
        };

        // Update cases
        EventBus.on('update', evt => {
            if (evt.executionId >= this.state.executionId) {
                this.setState({
                    executionId: evt.executionId,
                    result: evt
                });
            }
        });
    }

    /**
     * Returns the rendering for the compile/data errors
     */
    renderCompileErrors() {
        const errs = this.state.result.compileErrors;
        if (errs.length === 0) return (null);
        else {
            return (
                <div id="compileErrorDiv">
                    <h2>Compile/Data Errors</h2>
                    {errs.map((error, ind) => <pre key={ind}>{error}</pre>)}
                </div>
            )
        }
    }

    /**
     * Transforms a verdict to a CSS class
     * @param {string} verdict The verdict
     */
    verdictToCSSClass(verdict) {
        return `verdict-${verdict.toLowerCase().replace(/ /g, '-')}`;
    }

    /**
     * Returns the rendering for the row of a test case in the verdicts table
     * @param {object} testCase The test case to render
     * @param {number} ind The index of the test case
     */
    renderCase(testCase, ind) {
        const verdictClass = this.verdictToCSSClass(testCase.verdict);
        if (testCase.verdict === 'Waiting' || testCase.verdict === 'Judging' || testCase.verdict === 'Skipped') {
            return (
                <React.Fragment>
                    <td>{ind}</td>
                    <td><span className={verdictClass}>{testCase.verdict}</span></td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </React.Fragment>
            );
        }
        else {
            return (
                <React.Fragment>
                    <td>{ind}</td>
                    <td><span className={verdictClass}>{testCase.verdict}</span></td>
                    <td><span style={{ whiteSpace: 'pre' }}>{testCase.exitStatus}</span></td>
                    <td>{testCase.time} ms</td>
                    <td>{testCase.memory} kb</td>
                    <td><a href="#" onClick={() => EventBus.post('view', ind)}>view</a></td>
                    <td><a href="#" onClick={() => EventBus.post('compare', ind)}>compare</a></td>
                </React.Fragment>
            );
        }
    }

    /**
     * Selects a test case for previewing.  Assumes that the index is valid
     * @param {number} index The index of the test case to select
     */
    selectTestCase(index) {
        this.setState({ curViewedCase: index });
    }

    render() {
        return (
            <div>
                <h1>Output of {this.state.sourceName}</h1>

                {/* <div>
                    <h3>Events</h3>
                    {this.state.events.map((event, ind) => <p key={ind}>{event.toString()}</p>)}
                </div> */}

                {this.renderCompileErrors()}

                <h2>Verdicts</h2>

                <div className="selection">
                    <a href="#" onClick={() => EventBus.post('viewAll')}>View All</a>
                    <a href="#" onClick={() => EventBus.post('kill')}>Kill Current</a>
                    <a href="#" onClick={() => EventBus.post('killAll')}>Kill All</a>
                </div>

                <div id="verdicts">
                    <table>
                        <tr>
                            <th>Case #</th>
                            <th>Verdict</th>
                            <th>Status</th>
                            <th>Time</th>
                            <th>Memory</th>
                            <th>View</th>
                            <th>Compare Output</th>
                        </tr>
                        {
                            this.state.cases.map((testCase, ind) =>
                                <tr key={ind}>
                                    {this.renderCase(testCase, testCase.trueCaseId)}
                                </tr>
                            )
                        }
                    </table>
                </div>

                <div className="selection selection-small">
                    <span className="selection-title">Test Set:</span>
                    <span className="selection-data">{this.state.testSet}</span>
                </div>
                <div className="selection selection-small">
                    <span className="selection-title">Checker:</span>
                    <span className="selection-data">{this.state.checker}</span>
                </div>

                {/* Select case to view */}
                { this.state.cases.length > 0 && 
                    <React.Fragment>
                        <h2>Data</h2>
                        <div className="selection">
                            <span>Test Cases:</span>
                            { this.state.cases.map((_, index) =>
                                <a key={index} className={this.state.curViewedCase == index ? 'selected-case' : null}
                                    onClick={() => this.selectTestCase(index)}>[ {index} ]</a>
                            )}
                        </div>
                    </React.Fragment>
                }

                {/* Preview of case */}
                { this.state.curViewedCase !== null && 
                    <React.Fragment>
                        <div id="streamOut">
                            <div>
                                <h3>Input</h3>
                                <textarea value={this.state.cases[this.state.curViewedCase].stdin} rows="10" readonly />
                            </div>
                            <div>
                                <h3>Error Stream</h3>
                                <textarea value={this.state.cases[this.state.curViewedCase].stderr} rows="10" readonly />
                            </div>
                        </div>
                        <div id="streamOut">
                            <div>
                                <h3>Output</h3>
                                <textarea value={this.state.cases[this.state.curViewedCase].stdout} rows="10" readonly />
                            </div>
                            <div>
                                <h3>Expected Output</h3>
                                <textarea value={this.state.cases[this.state.curViewedCase].expectedStdout || '[This case has no expected output]'} rows="10" readonly />
                            </div>
                        </div>
                    </React.Fragment>
                }
            </div>
        );
    }
}
 
let App = document.getElementById('app');
const ErrorBoundedDisplay = toErrorBoundedElement(OutputDisplay);
ReactDOM.render(<ErrorBoundedDisplay />, App);
