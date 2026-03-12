#!/usr/bin/env node
'use strict';

/**
 * Claude Code Stop hook — auto-commits changes after each task.
 * Runs when Claude finishes responding.
 *
 * Reads transcript from stdin (JSON), checks for uncommitted changes,
 * generates a commit message from the diff, and commits.
 */

const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd: __dirname + '/../..' }).trim();
  } catch {
    return '';
  }
}

// Check if there are any changes to commit
const status = run('git status --porcelain');
if (!status) {
  process.exit(0); // Nothing to commit
}

// Read Claude transcript from stdin to build commit message
let transcript = '';
try {
  transcript = fs.readFileSync('/dev/stdin', 'utf8');
} catch {
  // stdin not available in some environments — use fallback
}

let commitMessage = '';

if (transcript) {
  try {
    const data = JSON.parse(transcript);
    // Find the last assistant message to use as commit description
    const messages = data.messages || [];
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant) {
      const text = (lastAssistant.content || '')
        .replace(/[`*#]/g, '')
        .split('\n')
        .find(l => l.trim().length > 10);
      if (text) {
        commitMessage = text.trim().slice(0, 72);
      }
    }
  } catch {
    // JSON parse failed — use fallback
  }
}

// Fallback: generate message from changed files
if (!commitMessage) {
  const diffStat = run('git diff --cached --stat HEAD') || run('git diff --stat HEAD');
  const changedFiles = run('git diff --name-only HEAD')
    .split('\n')
    .filter(Boolean)
    .join(', ');

  if (changedFiles) {
    commitMessage = `auto: update ${changedFiles}`;
  } else {
    commitMessage = `auto: save progress ${new Date().toISOString().slice(0, 16)}`;
  }
}

// Stage all changes and commit
run('git add -A');
try {
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`, {
    encoding: 'utf8',
    cwd: __dirname + '/../..',
  });
  console.error(`[auto-commit] ✓ Committed: ${commitMessage}`);
} catch (e) {
  console.error('[auto-commit] Commit failed:', e.message);
}
