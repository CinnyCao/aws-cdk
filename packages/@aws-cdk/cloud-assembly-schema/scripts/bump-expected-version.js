const jsonpatch = require('fast-json-patch');
const semver = require('semver');
const fs = require('fs');
const path = require('path');
const fingerprint = require('../test/fingerprint');

const metadataPath = '../schema/cloud-assembly.metadata.json';
const expectedPath = '../test/schema.expected.json';
const schemaPath = '../schema/cloud-assembly.schema.json';

// eslint-disable-next-line @typescript-eslint/no-require-imports
var schema = require(schemaPath);

// eslint-disable-next-line @typescript-eslint/no-require-imports
var metadata = require(metadataPath);

// eslint-disable-next-line @typescript-eslint/no-require-imports
var expected = require(expectedPath);

function applyPatch(document, patch, out) {
    const patched = jsonpatch.applyPatch(document, patch).newDocument;
    fs.writeFileSync(out, JSON.stringify(patched, null, 4));
}

const currentHash = fingerprint.hashObject(schema);

if (currentHash != metadata.hash) {

    // the schema changed from the last time.
    // update the hash.
    applyPatch(metadata,
        [{ op:"replace", path: "/hash", value: currentHash }],
        path.join(__dirname, metadataPath))

    // bump the expected version only if needed to
    // avoid multiple bumps.
    if (semver.gte(metadata.version, expected.version)) {
        // only bump if the current version is less than
        // the expected one.
        const newVersion = semver.inc(metadata.version, 'major');
        applyPatch(expected,
            [{ op:"replace", path: "/version", value: newVersion }],
            path.join(__dirname, expectedPath))

    }

}
