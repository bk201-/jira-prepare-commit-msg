#!/usr/bin/env node

const git = require('./git');

const log = message => {
  console.log(`JIRA prepare commit msg > ${message}`);
};

const error = err => {
  console.error(`JIRA prepare commit msg > ${err}`);
};

(async () => {
  log('start');

  try {
    const gitRoot = await git.findGitRoot();
    const branch = await git.getBranchName(gitRoot);
    const ticket = await git.getJiraTicket(branch);

    log(`The JIRA ticket ID is: ${ticket}`);

    await git.writeJiraTicket(ticket);
  } catch (err) {
    error(err);
  }

  log('done');
})();
