const sys = require('util');
const os = require('os');
const exec = require('child_process').exec;

const PATHS = [
    ['src\\execute\\display.html', 'out\\execute\\display.html'],
    ['src\\template\\logger.html', 'out\\template\\logger.html']
]

function constructCommand(cmd, transform) {
    return PATHS.map(arr => arr.map(transform))
                .map(([src, dest]) => `${cmd} ${src} ${dest}`)
                .join(' && ');
}

function puts(error, stdout, stderr) {
    console.log(stdout);
}

let command = '';

if (os.type() === 'Linux' || os.type() === 'Darwin')
    command = constructCommand('cp', x => x.replace(/\\/g, '/'));
else if (os.type() === 'Windows_NT') 
    command = constructCommand('copy', x => x);
else
    throw new Error("Unsupported OS found: " + os.type());


console.log(`Running command ${command}...`);
exec(command, puts);