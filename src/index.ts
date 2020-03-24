#!/usr/bin/env node

import * as git from './git';

const log = (message: string): void => {
  console.log(`JIRA prepare commit msg > ${message}`);
};

const error = (err: string): void => {
  console.error(`JIRA prepare commit msg > ${err}`);
};

(async (): Promise<void> => {
  log('start');

  try {
    const gitRoot = git.getRoot();
    const branch = await git.getBranchName(gitRoot);
    const ticket = git.getJiraTicket(branch);

    log(`The JIRA ticket ID is: ${ticket}`);

    git.writeJiraTicket(ticket);
  } catch (err) {
    error(err);
  }

  log('done');
})();
