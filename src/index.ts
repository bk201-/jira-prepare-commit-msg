#!/usr/bin/env node

import * as git from './git';
import { loadConfig } from './config';
import { error, log, debug } from './log';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async (): Promise<void> => {
  debug('start');

  try {
    const gitRoot = git.getRoot();
    const branch = await git.getBranchName(gitRoot);
    const config = await loadConfig();

    const ignored = new RegExp(config.ignoredBranchesPattern || '^$', 'i');

    const ticket = !ignored.test(branch) && git.getJiraTicket(branch, config);

    if (!ticket) {
      return;
    }

    log(`The JIRA ticket ID is: ${ticket}`);

    git.writeJiraTicket(ticket, config);
  } catch (err: unknown) {
    if (typeof err === 'string') {
      error(err);
    } else {
      error(String(err));
    }
  } finally {
    debug('done');
  }
})();
