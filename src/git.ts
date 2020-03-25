import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { cosmiconfigSync } from 'cosmiconfig';

const verbose = process.argv.find((arg) => arg === '--verbose');

const debug = (message: string): void => {
  if (!verbose) {
    return;
  }

  console.log(`JIRA prepare commit msg > DEBUG: ${message}`);
};

const getMsgFilePath = (index = 0): string => {
  debug('getMsgFilePath');

  // Husky stashes git hook parameters $* into a HUSKY_GIT_PARAMS env var.
  const gitParams = process.env.HUSKY_GIT_PARAMS || '';

  // Throw a friendly error if the git params environment variable can't be found – the user may be missing Husky.
  if (!gitParams) {
    throw new Error(`The process.env.HUSKY_GIT_PARAMS isn't set. Is supported Husky version installed?`);
  }

  // Unfortunately, this will break if there are escaped spaces within a single argument;
  // I don't believe there's a workaround for this without modifying Husky itself
  return gitParams.split(' ')[index];
};

export function readConfigFile() {
  // locate the nearest package.json
  const searchResult = cosmiconfigSync('config.jira-prepare-commit-msg', { searchPlaces: ['package.json'] }).search();
  if (searchResult) {
    return searchResult.config;
  }
  debug('Unable to find a configuration.');
  return null;
}

export function getRoot(): string {
  debug('getRoot');

  const cwd = process.cwd();

  // https://github.com/typicode/husky/issues/580
  // https://github.com/typicode/husky/issues/587
  const { status, stderr, stdout } = cp.spawnSync('git', ['rev-parse', '--show-prefix', '--git-common-dir'], { cwd });

  if (status !== 0) {
    throw new Error(stderr.toString());
  }

  const [, gitCommonDir] = stdout
    .toString()
    .split('\n')
    .map((s) => s.trim().replace(/\\\\/, '/'));

  // Git rev-parse returns unknown options as is.
  // If we get --absolute-git-dir in the output,
  // it probably means that an old version of Git has been used.
  // There seem to be a bug with --git-common-dir that was fixed in 2.13.0.
  // See issues above.
  if (gitCommonDir === '--git-common-dir') {
    throw new Error('Husky requires Git >= 2.13.0, please upgrade Git');
  }

  return path.resolve(cwd, gitCommonDir);
}

export async function getBranchName(gitRoot: string): Promise<string> {
  debug('gitBranchName');

  return new Promise((resolve, reject) => {
    cp.exec(`git --git-dir=${gitRoot} symbolic-ref --short HEAD`, { encoding: 'utf-8' }, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }

      if (stderr) {
        return reject(new Error(String(stderr)));
      }

      resolve(String(stdout).trim());
    });
  });
}

export function getJiraTicket(branchName: string): string {
  debug('getJiraTicket');

  const jiraIdPattern = /([A-Z]+-\d+)/i;
  const matched = jiraIdPattern.exec(branchName);
  const jiraTicket = matched && matched[0];

  if (!jiraTicket) {
    throw new Error('The JIRA ticket ID not found');
  }

  return jiraTicket;
}

export function writeJiraTicket(jiraTicket: string): void {
  debug('writeJiraTicket');

  const config = readConfigFile();
  const messageFilePath = getMsgFilePath();
  let message;

  // Read file with commit message
  try {
    message = fs.readFileSync(messageFilePath, { encoding: 'utf-8' });
  } catch (ex) {
    throw new Error(`Unable to read the file "${messageFilePath}".`);
  }

  // Add jira ticket into the message in case of missing
  if (!message.includes(jiraTicket)) {
    if (config && config.inline === true) {
      message = `[${jiraTicket}]-${message}`;
    } else {
      message = `[${jiraTicket}]\n${message}`;
    }
  }

  // Write message back to file
  try {
    fs.writeFileSync(messageFilePath, message, { encoding: 'utf-8' });
  } catch (ex) {
    throw new Error(`Unable to write the file "${messageFilePath}".`);
  }
}
