import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextStatus } from '../src/workflow';

test('legal transitions return the next status', () => {
  assert.equal(nextStatus('draft', 'submit'), 'under_review');
  assert.equal(nextStatus('under_review', 'approve_schedule'), 'scheduled');
  assert.equal(nextStatus('scheduled', 'publish_due'), 'published');
  assert.equal(nextStatus('published', 'archive'), 'archived');
});

test('illegal transitions return null', () => {
  assert.equal(nextStatus('draft', 'approve_publish'), null); // must be reviewed first
  assert.equal(nextStatus('published', 'submit'), null);
  assert.equal(nextStatus('archived', 'publish_due'), null);
});

test('review can bounce back to draft or reject', () => {
  assert.equal(nextStatus('under_review', 'request_changes'), 'draft');
  assert.equal(nextStatus('under_review', 'reject'), 'rejected');
});

test('rejected/archived can re-enter the workflow', () => {
  assert.equal(nextStatus('rejected', 'revise'), 'draft');
  assert.equal(nextStatus('archived', 'restore'), 'draft');
});
