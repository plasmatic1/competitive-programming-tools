import React from 'react';
import ReactDOM from 'react-dom';
import * as _ from 'lodash';
import ReadMore from 'react-read-more-less';
import EventBus from './vscodeEventBus';
import './scss/output.scss';

const STATUS_LIM = 15;
class OutputDisplay extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            // State variables
            executionId: -1000000000,
            curViewedCase: null, // Currently viewed case
            sourceName: 'N/A',
            cases: [],
            compileErrors: [],

            // Debugging
            // events: []
        };

        EventBus.on('init', evt => {
            // Initialize cases
            let _cases = [];
            for (let i = 0; i < evt.caseCount; i++) {
                _cases.push({
                    id: i,
                    verdict: 'Waiting'
                });
            }

            // Setting state variables
            this.setState({
                executionId: Math.max(this.state.executionId, evt.executionId),
                curViewedCase: evt.caseCount > 0 ? 0 : null, 
                sourceName: evt.sourceName,
                compileErrors: [],
                cases: _cases
            });

            // Send response
            // this.setState({
            //     events: _.concat(this.state.events, `init event: ${JSON.stringify(evt)}`)
            // });
            EventBus.post('init');
        });
        EventBus.on('compileError', evt => {
            if (evt.executionId != this.state.executionId) return; // Invalid execution id
            this.setState({
                compileErrors: _.concat(this.state.compileErrors, evt.message),
                // events: _.concat(this.state.events, `compileError event: ${JSON.stringify(evt)}`)
            });
        });
        EventBus.on('beginCase', evt => {
            if (evt.executionId != this.state.executionId) return; // Invalid execution id
            this.setState({
                cases: _.set(this.state.cases, evt.caseId, { id: evt.caseId, verdict: 'Judging' }),
                // events: _.concat(this.state.events, `begin event: ${JSON.stringify(evt)}`)
            });
        });
        EventBus.on('endCase', evt => {
            if (evt.executionId != this.state.executionId) return; // Invalid execution id
            this.setState({
                cases: _.set(this.state.cases, evt.caseId, evt),
                // events: _.concat(this.state.events, `end event: ${JSON.stringify(evt)}`)
            });
        });

        // Keyboard shortcuts
        this._keyListener = function(e) {
            if (e.key.toLowerCase() === 'a') { // Move cur case left 
                if (this.state.curViewedCase !== null) {
                    if (e.shiftKey)
                        this.setState({ curViewedCase: 0 });
                    else if (this.state.curViewedCase > 0)
                        this.setState({ curViewedCase: this.state.curViewedCase - 1 });
                }
            }
            if (e.key.toLowerCase() === 'd') { // Move cur case right
                if (this.state.curViewedCase !== null) {
                    if (e.shiftKey)
                        this.setState({ curViewedCase: this.state.cases.length - 1 });
                    else if (this.state.curViewedCase < this.state.cases.length - 1)
                        this.setState({ curViewedCase: this.state.curViewedCase + 1 });
                }
            }
        };
        document.addEventListener('keydown', this._keyListener.bind(this));
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this._keyListener);
    }

    /**
     * Returns the rendering for the compile/data errors
     */
    renderCompileErrors() {
        if (this.state.compileErrors.length === 0) return (null);
        else {
            console.log(this.state.compileErrors);
            return (
                <div id="compileErrorDiv">
                    <h2>Compile/Data Errors</h2>
                    {this.state.compileErrors.map((error, ind) => <p key={ind}>{error}</p>)}
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
                    <td><ReadMore charLimit={STATUS_LIM} readMoreText={' >>>'} readLessText={' <<<'}>{testCase.exitStatus}</ReadMore></td>
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

                <div class="selection">
                    <a href="#" onClick={() => EventBus.post('viewAll')}>View All</a>
                    <a href="#" onClick={() => EventBus.post('kill')}>Kill Current</a>
                    <a href="#" onClick={() => EventBus.post('killAll')}>Kill All</a>
                </div>

                <div>
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
                                    {this.renderCase(testCase, ind)}
                                </tr>
                            )
                        }
                    </table>
                </div>

                {/* Select case to view */}
                { this.state.cases.length > 0 && 
                    <React.Fragment>
                        <h2>Data</h2>
                        <div class="selection">
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
                                <textarea value={this.state.cases[this.state.curViewedCase].expectedStdout} rows="10" readonly />
                            </div>
                        </div>
                    </React.Fragment>
                }
            </div>
        );
    }
}
 
let App = document.getElementById('app');
ReactDOM.render(<OutputDisplay />, App);
