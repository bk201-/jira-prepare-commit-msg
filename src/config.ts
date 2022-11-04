import { cosmiconfig } from 'cosmiconfig';
import { debug, error } from './log';

export type JPCMConfig = {
  allowEmptyCommitMessage: boolean;
  allowReplaceAllOccurrences: boolean;
  commentChar: string; // Default comment char in the message
  gitRoot: string;
  isConventionalCommit: boolean; // Support https://www.conventionalcommits.org
  ignoredBranchesPattern: string;
  ignoreBranchesMissingTickets: boolean;
  jiraTicketPattern: string; // JIRA ticket RexExp
  messagePattern: string; // Where $J is a ticket number, $M is the message
};

const defaultConfig = {
  allowEmptyCommitMessage: false,
  allowReplaceAllOccurrences: true,
  commentChar: '#',
  gitRoot: '',
  ignoredBranchesPattern: '^(master|main|dev|develop|development|release)$',
  ignoreBranchesMissingTickets: false,
  isConventionalCommit: false,
  jiraTicketPattern: '([A-Z]+-\\d+)',
  messagePattern: '[$J] $M',
} as JPCMConfig;

function resolveConfig(configPath: string): string {
  try {
    return require.resolve(configPath);
  } catch {
    return configPath;
  }
}

export async function loadConfig(configPath?: string): Promise<JPCMConfig> {
  try {
    const explorer = cosmiconfig('jira-prepare-commit-msg', {
      searchPlaces: [
        'package.json',
        '.jirapreparecommitmsgrc',
        '.jirapreparecommitmsgrc.json',
        '.jirapreparecommitmsgrc.yaml',
        '.jirapreparecommitmsgrc.yml',
        'jira-prepare-commit-msg.config.js',
      ],
    });

    const config = configPath ? await explorer.load(resolveConfig(configPath)) : await explorer.search();

    debug(`Loaded config: ${JSON.stringify(config)}`);

    if (config && !config.isEmpty) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = { ...defaultConfig, ...config.config };
      debug(`Used config: ${JSON.stringify(result)}`);
      return result as JPCMConfig;
    }
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    error(`Loading configuration failed with error: ${err}`);
  }

  const result = { ...defaultConfig };
  debug(`Used config: ${JSON.stringify(result)}`);
  return result;
}
