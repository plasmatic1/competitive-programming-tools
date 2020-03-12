import React from 'react';
import ReactDOM from 'react-dom';
import * as _ from 'lodash';
import EventBus from './vscodeEventBus';
import './scss/output.scss';

class OutputDisplay extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            // State variables
            executionId: -1000000000,
            curViewedCase: -1, // Currently viewed case
            sourceName: 'N/A',
            cases: [],
            compileErrors: [],

            // Debugging
            events: []
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

            console.log(_cases);
            console.log(JSON.stringify(evt));

            // Setting state variables
            this.setState({
                executionId: Math.max(this.state.executionId, evt.executionId),
                curViewedCase: -1, 
                sourceName: evt.sourceName,
                compileErrors: [],
                cases: _cases
            });

            // Send response
            this.setState({
                events: _.concat(this.state.events, `init event: ${JSON.stringify(evt)}`)
            });
            EventBus.post('init');
        });
        EventBus.on('compileError', evt => {
            if (evt.executionId != this.state.executionId) return; // Invalid execution id
            this.setState({
                compileErrors: _.concat(this.state.compileErrors, evt),
                events: _.concat(this.state.events, `compileError event: ${JSON.stringify(evt)}`)
            });
        });
        EventBus.on('beginCase', evt => {
            if (evt.executionId != this.state.executionId) return; // Invalid execution id
            this.setState({
                cases: _.set(this.state.cases, evt, { id: evt, verdict: 'Judging' }),
                events: _.concat(this.state.events, `begin event: ${JSON.stringify(evt)}`)
            });
        });
        EventBus.on('endCase', evt => {
            if (evt.executionId != this.state.executionId) return; // Invalid execution id
            this.setState({
                cases: _.set(this.state.cases, evt.caseId, evt),
                events: _.concat(this.state.events, `end event: ${JSON.stringify(evt)}`)
            });
        });
    }

    renderCompileErrors() {
        if (this.state.compileErrors.length === 0) return (null);
        else {
            return (
                <div id="compileErrorDiv">
                    <h2>Compile/Data Errors</h2>
                    {this.state.compileErrors.map((error, ind) => <p key={ind}>{error}</p>)}
                </div>
            )
        }
    }

    renderCase(testCase) {
        if (testCase.verdict === 'Waiting' || testCase.verdict === 'Judging') {
            return (
                <React.Fragment>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </React.Fragment>
            );
        }
        else {
            return (
                <React.Fragment>
                    <td>{testCase.exitStatus}</td>
                    <td>{testCase.time} ms</td>
                    <td>{testCase.memory} kb</td>
                </React.Fragment>
            );
        }
    }

    render() {
        return (
            <div>
                <h1>Output of {this.state.sourceName}</h1>

                <div>
                    <h3>Events</h3>
                    {this.state.events.map((event, ind) => <p key={ind}>{event.toString()}</p>)}
                </div>

                {this.renderCompileErrors()}

                <div>
                    <h2>Verdicts <a href="#" onClick={() => EventBus.post('viewAll')}>View All</a></h2>
                    <table>
                        <tr>
                            <th>Case #</th>
                            <th>Verdict</th>
                            <th>Status</th>
                            <th>Time</th>
                            <th>Memory</th>
                            <th>View</th>
                        </tr>
                        {
                            this.state.cases.map((testCase, ind) =>
                                <tr key={ind}>
                                    <td>{ind}</td>
                                    <td>{testCase.verdict}</td>
                                    {this.renderCase(testCase)}
                                    <td><a href="#" onClick={() => EventBus.post('view', ind)}>view</a></td>
                                </tr>
                            )
                        }
                    </table>
                </div>

                <div>
                    <a href="#" onClick={() => EventBus.post('killCurrent')}>Kill Current</a>
                    <a href="#" onClick={() => EventBus.post('killAll')}>Kill All</a>
                </div>
            </div>
        );
    }
}
 
let App = document.getElementById('app');
ReactDOM.render(<OutputDisplay />, App);
