// Tests custom library stuff

let assert = {
    strictEqual: (a, b, msg) => {
        if (a != b) throw new Error(msg);
        console.log(`Pass: ${msg} | a=${a} b=${b}`);
    },
    deepStrictEqual: (a, b, msg) => { // only for arrays whatever
        if (a.length !== b.length) throw new Error('FAIL: ' + msg);
        for (let i = 0; i < a.length; i++)
            if (a[i] !== b[i]) throw new Error('FAIL: ' + msg);
        console.log(`Pass: ${msg} | a=${JSON.stringify(a)} b=${JSON.stringify(b)}`);
    }
}

function check(_, __, ___, lib) {
    assert.strictEqual(lib.normalizeOutput('   whitespace to clear   '), 'whitespace to clear', 'lib.normalizeOutput -> Trim whitespace');
    assert.strictEqual(lib.normalizeOutput('convert\r\nnewlines\rto\nunix'), 'convert\nnewlines\nto\nunix', 'lib.normalizeOutput -> Newlines');

    assert.deepStrictEqual(lib.tokenize(' a    multiplewhitespace \t\n different kinds\n\nman lol :P'), ['a', 'multiplewhitespace', 'different', 'kinds', 'man', 'lol', ':P'], 'lib.tokenize');
    
    assert.deepStrictEqual(lib.arrayEquals([1, 2, 3], [1, 2, 3]), true, 'lib.arrayEquals -> true');
    assert.deepStrictEqual(lib.arrayEquals([1, 2, 3], [1, 3, 2]), false, 'lib.arrayEquals -> false');
    assert.deepStrictEqual(lib.arrayEquals([1, 2, 3], [1, 2, 3, 4]), false, 'lib.arrayEquals -> false (length)');

    assert.deepStrictEqual(lib.arrayEqualsFloat([1, 2, 3], [1, 2.0001, 2.9999], 1e-4), true, 'lib.arrayEqualsFloat -> true');
    assert.deepStrictEqual(lib.arrayEqualsFloat([1, 2], [1.9, 2.0002]), false, 'lib.arrayEqualsFloat -> false');
    assert.deepStrictEqual(lib.arrayEqualsFloat([1, 2, 3], [1, 2, 3, 4]), false, 'lib.arrayEqualsFloat -> false (length)');

    return true;
}
