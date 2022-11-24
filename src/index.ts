#!/usr/bin/env node

import * as git from './git';
import { retrieveConfig } from './config';
import { error, log } from './log';

((): void => {
  try {
    log('start');

    const config = retrieveConfig();
    const gitRoot = git.getRoot(config.gitRoot);
    const branchName = git.getBranchName(gitRoot, config);
    const ticket = git.getJiraTicket(branchName, config);

    git.writeJiraTicket(ticket, config);
  } catch (err: unknown) {
    if (typeof err === 'string') {
      error(err);
    } else {
      error(String(err));
    }
  } finally {
    log('done');
  }
})();
