{/* <template>
// General formatting
h1 {
    margin-top: 0;
}

#compileErrorDiv {
    border: 1px solid map-get($theme, 3);
    padding: 0 7px 2px 7px;
    margin: 10px;

    h3 {
        margin-top: 5px;
        margin-bottom: 2px;
    }

    p {
        margin: 0 0 2px 0;
        // border: 1px solid red;
    }
}

.case-div {
    margin-bottom: 30px;

    h2 {
        margin-bottom: 0;
    }
}

// Verdict-related stuff
#verdictDiv {
    margin-left: 0;
}

.verdict {
    margin-left: 7px;
}

.verdict-style-ac {
    color: mix(map-get($theme, 4), green, 80%);
    font-weight: bold;
}

.verdict-style-wa {
    // color: red;
    color: mix(map-get($theme, 4), red, 80%);
    font-weight: bold;
}

.verdict-style-re {
    color: mix(map-get($theme, 4), orange, 80%);
    font-weight: bold;
}

.verdict-style-wj, .verdict-style-jd { // Waiting for judge
    color: map-get($theme, 4);
    font-style: italic;
}

</style> */}
        // "parcel:build": "parcel build -d out/assets src/assets/entrypoint/input.html src/assets/entrypoint/output.html src/assets/entrypoint/options.html --public-url \"vscodeRoot\"",
        // "parcel:watch": "parcel watch -Ad out/assets src/assets/entrypoint/input.html src/assets/entrypoint/output.html src/assets/entrypoint/options.html --public-url \"vscodeRoot\" --no-hmr",

import EventBus from './vscodeEventBus';
import React from 'react';
import ReactDOM from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';
import * as _ from 'lodash';

class OutputDisplay extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            executionId: -1000000000,
            sourceName: 'N/A',
            cases: [],
            compileErrors: [],
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
                executionId: evt.executionId,
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
            this.setState({
                compileErrors: _.concat(this.state.compileErrors, evt),
                events: _.concat(this.state.events, `compileError event: ${JSON.stringify(evt)}`)
            });
        });
        EventBus.on('beginCase', evt => {
            this.setState({
                cases: _.set(this.state.cases, evt, { id: evt, verdict: 'Judging' }),
                events: _.concat(this.state.events, `begin event: ${JSON.stringify(evt)}`)
            });
        });
        EventBus.on('endCase', evt => {
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
