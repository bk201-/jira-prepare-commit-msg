import { program } from 'commander';

import { JPCMConfig } from './config';
import { APP_DESCRIPTION, APP_NAME, APP_VERSION } from './constants';

export type Options = Partial<JPCMConfig> & {
  config: string;
  verbose: boolean;
};

program
  .name(APP_NAME)
  .description(APP_DESCRIPTION)
  .version(APP_VERSION, '-v, --version', 'Output the current version')
  .option('--config <path>', 'Configuration file path. If specified all CLI options will be ignored')
  .option('-g, --git-root <path>', '.git folder path')
  .option('-d, --verbose', 'Show debug information')
  .option('-c, --is-conventional-commit', 'Commit message is conventional commit (default: false)')
  .option('-r, --allow-replace-all-occurrences', 'Replace all occurrences (default: true)')
  .option('-a, --allow-empty-commit-message', 'Allow empty commit message (default: false)')
  .option('-i, --ignore-branches-missing-tickets', 'Ignore branches missing the JIRA ticket (default: false)')
  .option('-cc, --comment-char <char>', 'Char used to comment lines in the commit message (default: "#")')
  .option(
    '-M, --message-pattern <RegExp>',
    'Message pattern to configure where JIRA ticket number will be inserted (default: `[$J] $M`)\n' +
      '* Symbols `$J` will be replaced on JIRA ticket number\n' +
      '* Symbols `$M` will be replaced on commit message.',
  )
  .option(
    '-J, --jira-ticket-pattern <RegExp>',
    'Custom RegExp string pattern to search JIRA ticket number (default: `([A-Z]+-\\d+))`',
  )
  .option(
    '-C, --conventional-commit-pattern <RegExp>',
    'Custom RegExp string pattern for the conventional commit format ' +
      '(default: `^([a-z]+)(\\([a-z0-9.,-_ ]+\\))?!?: ([\\w \\S]+)$`)',
  )
  .option(
    '-I, --ignored-branches-pattern <RegExp>',
    'Custom RegExp string pattern to ignore and skipped branches ' +
      '(default: `^(master|main|dev|develop|development|release)$`)',
  );

program.parse();

export const options: Options = program.opts();
