import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as semver from 'semver';
import { AssemblyManifest, Manifest, StackTagsMetadataEntry } from '../lib';
import { hashObject } from './fingerprint';

const FIXTURES = path.join(__dirname, 'fixtures');

function fixture(name: string) {
  return path.join(FIXTURES, name, 'manifest.json');
}

test('manifest save', () => {

  const outdir = fs.mkdtempSync(path.join(os.tmpdir(), 'protocol-tests'));
  const manifestFile = path.join(outdir, 'manifest.json');

  const assemblyManifest: AssemblyManifest = {
    version: "version"
  };

  Manifest.save(assemblyManifest, manifestFile);

  const saved = JSON.parse(fs.readFileSync(manifestFile, 'UTF-8'));

  expect(saved).toEqual(assemblyManifest);

});

test('manifest load', () => {
  const loaded = Manifest.load(fixture("only-version"));
  expect(loaded).toMatchSnapshot();
});

test('schema has the correct version and hash', () => {

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expectedHash = require('./schema.expected.json').hash;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const schema = require('../schema/cloud-assembly.schema.json');

  const schemaHash = hashObject(schema);

  if (schemaHash !== expectedHash) {

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const version = require('../schema/cloud-assembly.metadata.json').version;
    const expectedVersion = semver.inc(version, 'major');
    expect(version).toEqual(expectedVersion);

    // we also require the hash to be equal, so fail anyway.
    // this is to prevent a manual change to the version, without changing the hash.
    expect(schemaHash).toEqual(expectedHash);
  }

});

test('manifest load fails for invalid nested property', () => {
  expect(() => Manifest.load(fixture("invalid-nested-property")))
  .toThrow(/Invalid assembly manifest/);

});

test('manifest load fails for invalid artifact type', () => {
  expect(() => Manifest.load(fixture('invalid-artifact-type')))
  .toThrow(/Invalid assembly manifest/);
});

test('stack-tags are deserialized properly', () => {

  const m: AssemblyManifest = Manifest.load(fixture('with-stack-tags'));

  if (m.artifacts?.stack?.metadata?.AwsCdkPlaygroundBatch[0].data) {
    const entry = m.artifacts.stack.metadata.AwsCdkPlaygroundBatch[0].data as StackTagsMetadataEntry;
    expect(entry[0].key).toEqual("hello");
    expect(entry[0].value).toEqual("world");
  }
  expect(m.version).toEqual("version");

});

test('can access random metadata', () => {

  const loaded = Manifest.load(fixture('random-metadata'));
  const randomArray = loaded.artifacts?.stack.metadata?.AwsCdkPlaygroundBatch[0].data;
  const randomNumber = loaded.artifacts?.stack.metadata?.AwsCdkPlaygroundBatch[1].data;

  expect(randomArray).toEqual(["42"]);
  expect(randomNumber).toEqual(42);
  expect(loaded).toMatchSnapshot();
});
