import assert from 'node:assert/strict';
import test from 'node:test';
import * as schemas from '../src/lib/schemas';
import { validatePipelineInputs, type PipelineInputs } from '../src/lib/contracts';

const schemaEntries = Object.entries(schemas).filter(([name]) => name.endsWith('Schema'));

test('all output schemas declare required properties that exist', () => {
  assert.equal(schemaEntries.length, 11);
  for (const [name, schema] of schemaEntries) {
    assert.ok(schema.properties, `${name} must define properties`);
    assert.ok(Array.isArray(schema.required), `${name} must define required fields`);
    for (const field of schema.required) {
      assert.ok(field in schema.properties, `${name}.${field} is required but undefined`);
    }
  }
});

test('pipeline input contract rejects missing source inputs', () => {
  const valid: PipelineInputs = {
    productBrief: 'Product facts',
    brandGuidelines: 'Voice rules',
    previousExamplesEN: '',
    previousExamplesAR: '',
    seoKeywords: ''
  };
  assert.doesNotThrow(() => validatePipelineInputs(valid));
  assert.throws(() => validatePipelineInputs({ ...valid, productBrief: ' ' }), /Product brief/);
  assert.throws(() => validatePipelineInputs({ ...valid, brandGuidelines: '' }), /Brand guidelines/);
});
