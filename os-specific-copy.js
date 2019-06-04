var sys = require('util')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { console.log(stdout) }

var os = require('os');
//control OS
//then run command depengin on the OS

if (os.type() === 'Linux') 
   exec("cp src/execute/display.html out/execute/display.html && cp src/template/logger.html out/template/logger.html", puts); 
else if (os.type() === 'Darwin') 
   exec("cp src/execute/display.html out/execute/display.html && cp src/template/logger.html out/template/logger.html", puts); 
else if (os.type() === 'Windows_NT') 
   exec("copy src\\execute\\display.html out\\execute\\display.html && copy src\\template\\logger.html out\\template\\logger.html", puts);
else
   throw new Error("Unsupported OS found: " + os.type());