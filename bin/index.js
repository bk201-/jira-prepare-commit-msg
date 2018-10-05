#!/usr/bin/env node

console.log('JIRA prepare commit msg > start');

const git = require('./git');

git.findGitRoot()
  .then(gitRoot => git.getBranchName(gitRoot))
  .then(branch => git.getJiraTicket(branch))
  .then(ticket => git.writeJiraTicket(ticket))
  .catch(err => console.error(`JIRA prepare commit msg > ${err.message || err}`))
  .finally(() => console.log('JIRA prepare commit msg > done'));
