import { cosmiconfig } from 'cosmiconfig';
import { debug } from './log';

export type JPCMConfig = {
  messagePattern: string; // Where $J is a ticket number, $M is the message
  jiraTicketPattern: string; // JIRA ticket RexExp
  commentChar: string; // Default comment char in the message
  isConventionalCommit: boolean; // Support https://www.conventionalcommits.org
};

const defaultConfig = {
  messagePattern: '[$J]\n$M',
  jiraTicketPattern: '([A-Z]+-\\d+)',
  commentChar: '#',
  isConventionalCommit: false,
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
        '.jirapreparecommitmsgrc.js',
        'jira-prepare-commit-msg.config.js',
      ],
    });

    const config = configPath ? await explorer.load(resolveConfig(configPath)) : await explorer.search();

    debug(`Loaded config: ${JSON.stringify(config)}`);

    if (config && !config.isEmpty) {
      const result = { ...defaultConfig, ...config.config };
      debug(`Used config: ${JSON.stringify(result)}`);
      return result;
    }
  } catch {
    // ignore
  }

  const result = { ...defaultConfig };
  debug(`Used config: ${JSON.stringify(result)}`);
  return result;
}
