#!/usr/bin/env node

const git = require('./git');

const log = message => {
  console.log(`JIRA prepare commit msg > ${message}`);
};

Promise.resolve()
  .then(() => log('start'))
  .then(() => git.findGitRoot())
  .then(gitRoot => git.getBranchName(gitRoot))
  .then(branch => git.getJiraTicket(branch))
  .then(ticket => log(`The JIRA ticket ID is: ${ticket}`) || ticket)
  .then(ticket => git.writeJiraTicket(ticket))
  .catch(err => log(err.message || err))
  .then(() => log('done'));
