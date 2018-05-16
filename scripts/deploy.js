#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

function deploy(tags = [], skipTags = []) {
  const args = [
    '-i',
    'ansible/hosts',
    'ansible/site.yaml',
    '--extra-var',
    path.dirname(__dirname),
  ];

  for (let tag of tags) {
    args.push('--tag', tag);
  }

  for (let tag of skipTags) {
    args.push('--skip-tag', tag);
  }

  spawnSync('ansible-playbook', args, {
    stdio: [null, process.stdout, process.stderr],
  });
}

if (require.main === module) {
  const tags = [];
  if (process.argv[2]) {
    tags.push(process.argv.slice(2));
  }
  deploy(tags);
}
