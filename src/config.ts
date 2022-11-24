import { cosmiconfigSync } from 'cosmiconfig';

import { debug, error } from './log';
import { options, Options } from './arguments';
import { APP_NAME } from './constants';

export type JPCMConfig = {
  allowEmptyCommitMessage: boolean;
  allowReplaceAllOccurrences: boolean;
  commentChar: string; // Default comment char in the message
  gitRoot: string;
  isConventionalCommit: boolean; // Support https://www.conventionalcommits.org
  conventionalCommitPattern: string; // Conventional Commit RegExp
  ignoredBranchesPattern: string;
  ignoreBranchesMissingTickets: boolean;
  jiraTicketPattern: string; // JIRA ticket RexExp
  messagePattern: string; // Where $J is a ticket number, $M is the message
};

const defaultConfig: JPCMConfig = {
  allowEmptyCommitMessage: false,
  allowReplaceAllOccurrences: true,
  commentChar: '#',
  gitRoot: '',
  ignoredBranchesPattern: '^(master|main|dev|develop|development|release)$',
  ignoreBranchesMissingTickets: false,
  isConventionalCommit: false,
  conventionalCommitPattern: '^([a-z]+)(\\([a-z0-9.,-_ ]+\\))?!?: ([\\w \\S]+)$',
  jiraTicketPattern: '([A-Z]+-\\d+)',
  messagePattern: '[$J] $M',
};

function getSearchPlaces(): string[] {
  const moduleNameWithoutHyphen = APP_NAME.replace(/-/g, '');
  return [
    'package.json',
    `.${APP_NAME}rc`,
    `.${APP_NAME}rc.json`,
    `.${APP_NAME}rc.yaml`,
    `.${APP_NAME}rc.yml`,
    `.${APP_NAME}rc.js`,
    `.${APP_NAME}rc.cjs`,
    `.config/${APP_NAME}rc`,
    `.config/${APP_NAME}rc.json`,
    `.config/${APP_NAME}rc.yaml`,
    `.config/${APP_NAME}rc.yml`,
    `.config/${APP_NAME}rc.js`,
    `.config/${APP_NAME}rc.cjs`,
    `${APP_NAME}.config.js`,
    `${APP_NAME}.config.cjs`,
    // Supporting old config files
    `.${moduleNameWithoutHyphen}rc`,
    `.${moduleNameWithoutHyphen}rc.json`,
    `.${moduleNameWithoutHyphen}rc.yaml`,
    `.${moduleNameWithoutHyphen}rc.yml`,
  ];
}

function resolveConfig(configPath: string): string {
  try {
    return require.resolve(configPath);
  } catch {
    return configPath;
  }
}

function loadConfig(configPath?: string): Partial<JPCMConfig> {
  try {
    const explorer = cosmiconfigSync('jira-prepare-commit-msg', {
      searchPlaces: getSearchPlaces(),
    });

    const config = configPath ? explorer.load(resolveConfig(configPath)) : explorer.search();

    debug(`Config loaded from file: ${JSON.stringify(config)}`);

    if (config && !config.isEmpty) {
      return config.config as Partial<JPCMConfig>;
    }
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    error(`Loading configuration failed with error: ${err}`);
  }

  return {} as Partial<JPCMConfig>;
}

function mappingOptionsToConfig(args: Options): Partial<JPCMConfig> {
  const config: Partial<JPCMConfig> = {};

  Object.entries(args).forEach(([key, value]) => {
    if (key === 'config' || key === 'verbose') return;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    config[key] = value;
  });

  debug(`Config loaded from CLI: ${JSON.stringify(config)}`);

  return config;
}

export function retrieveConfig(): JPCMConfig {
  let configFromFile: Partial<JPCMConfig> = {};
  let configFromCli: Partial<JPCMConfig> = {};

  if (options.config) {
    configFromFile = loadConfig(options.config);
  } else {
    configFromFile = loadConfig();
    configFromCli = mappingOptionsToConfig(options);
  }

  const result = { ...defaultConfig, ...configFromFile, ...configFromCli };

  debug(`Used config: ${JSON.stringify(result)}`);

  return result;
}
