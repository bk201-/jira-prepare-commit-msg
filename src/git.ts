import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { JPCMConfig } from './config';
import { debug, log } from './log';

interface MessageInfo {
  originalMessage: string;
  cleanMessage: string;
  hasAnyText: boolean;
  hasUserText: boolean;
  hasVerboseText: boolean;
}

const gitVerboseStatusSeparator = '------------------------ >8 ------------------------';

function getMsgFilePath(gitRoot: string, index = 0): string {
  debug('getMsgFilePath');

  if (gitRoot.length > 0) {
    // At first looking into this path, then if it's empty trying other ways
    if (!path.isAbsolute(gitRoot)) {
      const cwd = process.cwd();

      log(`Resolving .git path from ${cwd}`);

      gitRoot = path.resolve(cwd, gitRoot);
    }

    if (!gitRoot.includes('.git')) {
      gitRoot = path.join(gitRoot, '.git');
    }

    return path.join(gitRoot, 'COMMIT_EDITMSG');
  }

  // It is Husky 5
  if (process.env.HUSKY_GIT_PARAMS === undefined) {
    const messageFilePath = process.argv.find((arg) => arg.includes('.git'));
    if (messageFilePath) {
      return messageFilePath;
    } else {
      throw new Error(`You are using Husky 5. Please add $1 to jira-pre-commit-msg's parameters.`);
    }
  }

  // Husky 2-4 stashes git hook parameters $* into a HUSKY_GIT_PARAMS env var.
  const gitParams = process.env.HUSKY_GIT_PARAMS || '';

  // Throw a friendly error if the git params environment variable can't be found – the user may be missing Husky.
  if (!gitParams) {
    throw new Error(`The process.env.HUSKY_GIT_PARAMS isn't set. Is supported Husky version installed?`);
  }

  // Unfortunately, this will break if there are escaped spaces within a single argument;
  // I don't believe there's a workaround for this without modifying Husky itself
  return gitParams.split(' ')[index];
}

function escapeReplacement(str: string): string {
  return str.replace(/[$]/, '$$$$'); // In replacement to escape $ needs $$
}

function replaceMessageByPattern(jiraTicket: string, message: string, pattern: string, replaceAll: boolean): string {
  const jiraTicketRegExp = new RegExp('\\$J', replaceAll ? 'g' : '');
  const messageRegExp = new RegExp('\\$M', replaceAll ? 'g' : '');
  const result = pattern
    .replace(jiraTicketRegExp, escapeReplacement(jiraTicket))
    .replace(messageRegExp, escapeReplacement(message));

  debug(`Replacing message: ${result}`);

  return result;
}

function getMessageInfo(message: string, config: JPCMConfig): MessageInfo {
  debug(`Original commit message: ${message}`);

  const messageSections = message.split(gitVerboseStatusSeparator)[0];
  const lines = messageSections
    .trim()
    .split('\n')
    .map((line) => line.trimLeft())
    .filter((line) => !line.startsWith(config.commentChar));

  const cleanMessage = lines.join('\n').trim();

  debug(`Clean commit message (${cleanMessage.length}): ${cleanMessage}`);

  return {
    cleanMessage,
    originalMessage: message,
    hasAnyText: message.length !== 0,
    hasUserText: cleanMessage.length !== 0,
    hasVerboseText: message.includes(gitVerboseStatusSeparator),
  };
}

function findFirstLineToInsert(lines: string[], config: JPCMConfig): number {
  let firstNotEmptyLine = -1;

  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];

    // ignore everything after commentChar or the scissors comment, which present when doing a --verbose commit,
    // or `git config commit.status true`
    if (line === gitVerboseStatusSeparator) {
      break;
    }

    if (line.startsWith(config.commentChar)) {
      continue;
    }

    if (firstNotEmptyLine === -1) {
      firstNotEmptyLine = i;
      break;
    }
  }

  return firstNotEmptyLine;
}

function insertJiraTicketIntoMessage(messageInfo: MessageInfo, jiraTicket: string, config: JPCMConfig): string {
  const message = messageInfo.originalMessage;
  const lines = message.split('\n').map((line) => line.trimLeft());

  if (!messageInfo.hasUserText) {
    debug(`User didn't write the message. Allow empty commit is ${String(config.allowEmptyCommitMessage)}`);

    const preparedMessage = replaceMessageByPattern(
      jiraTicket,
      '',
      config.messagePattern,
      config.allowReplaceAllOccurrences,
    );

    if (messageInfo.hasAnyText) {
      const insertedMessage = config.allowEmptyCommitMessage
        ? preparedMessage
        : `# ${preparedMessage}\n` +
          '# JIRA prepare commit msg > ' +
          'Please uncomment the line above if you want to insert JIRA ticket into commit message';

      lines.unshift(insertedMessage);
    } else {
      if (config.allowEmptyCommitMessage) {
        lines.unshift(preparedMessage);
      } else {
        debug(`Commit message is empty. Skipping...`);
      }
    }
  } else {
    const firstLineToInsert = findFirstLineToInsert(lines, config);

    debug(`First line to insert is: ${firstLineToInsert > -1 ? lines[firstLineToInsert] : ''} (${firstLineToInsert})`);

    if (firstLineToInsert !== -1) {
      const line = lines[firstLineToInsert];

      if (config.isConventionalCommit) {
        debug(`Finding conventional commit in: ${line}`);
        const conventionalCommitRegExp = new RegExp(config.conventionalCommitPattern, 'g');
        conventionalCommitRegExp.lastIndex = -1;
        const [match, type, scope, msg] = conventionalCommitRegExp.exec(line) ?? [];
        if (match) {
          debug(`Conventional commit message: ${match}`);

          if (config.useConventionalCommitScope && !scope?.includes(jiraTicket)) {
            const cleanScopeUnitSet = scope ? [scope.replace(/^\(([^)]+)\)$/, "$1")] : [];
            lines[firstLineToInsert] = `${type}(${[jiraTicket, ...cleanScopeUnitSet].join(', ')}): ${msg}`;
          } else if (!msg.includes(jiraTicket)) {
            const replacedMessage = replaceMessageByPattern(
              jiraTicket,
              msg,
              config.messagePattern,
              config.allowReplaceAllOccurrences,
            );
            lines[firstLineToInsert] = `${type}${scope || ''}: ${replacedMessage}`;
          }
        }
      } else if (!line.includes(jiraTicket)) {
        lines[firstLineToInsert] = replaceMessageByPattern(
          jiraTicket,
          line || '',
          config.messagePattern,
          config.allowReplaceAllOccurrences,
        );
      }
    }

    // Add jira ticket into the message in case of missing
    if (lines.every((line) => !line.includes(jiraTicket))) {
      lines[0] = replaceMessageByPattern(
        jiraTicket,
        lines[0] || '',
        config.messagePattern,
        config.allowReplaceAllOccurrences,
      );
    }
  }

  return lines.join('\n');
}

export type GitRevParseResult = {
  prefix: string;
  gitCommonDir: string;
};

export function gitRevParse(cwd = process.cwd(), gitRoot = ''): GitRevParseResult {
  const args = [];

  // If git root is specified, checking existing work tree
  if (gitRoot !== '' && gitRoot !== '.') {
    log(`Git root is specified as ${gitRoot}`);

    args.push('--git-dir', gitRoot);
  }

  args.push('rev-parse', '--show-prefix', '--git-common-dir');

  // https://github.com/typicode/husky/issues/580
  // https://github.com/typicode/husky/issues/587
  const { status, stderr, stdout } = cp.spawnSync('git', args, { cwd, encoding: 'utf-8' });

  if (status !== 0) {
    throw new Error(stderr.toString());
  }

  const [prefix, gitCommonDir] = stdout
    .toString()
    .split('\n')
    .map((s) => s.trim())
    // Normalize for Windows
    .map((s) => s.replace(/\\\\/, '/'));

  return { prefix, gitCommonDir };
}

export function getRoot(gitRoot: string): string {
  debug('getRoot');

  const cwd = process.cwd();

  const { gitCommonDir } = gitRevParse(cwd, gitRoot);

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

export function getBranchName(gitRoot: string): string {
  debug('gitBranchName');

  const cwd = process.cwd();
  const args = [];

  // If git root is specified, checking existing work tree
  if (gitRoot !== '' && gitRoot !== '.') {
    args.push('--git-dir', gitRoot);
  }

  args.push('symbolic-ref', '--short', 'HEAD');

  const { status, stderr, stdout } = cp.spawnSync('git', args, { cwd, encoding: 'utf-8' });

  if (status !== 0) {
    throw new Error(stderr.toString());
  }

  return stdout.toString().trim();
}

export function getJiraTicket(branchName: string, config: JPCMConfig): string | null {
  debug('getJiraTicket');

  const jiraIdPattern = new RegExp(config.jiraTicketPattern, 'i');
  const matched = jiraIdPattern.exec(branchName);
  const jiraTicket = matched && matched[0];

  return jiraTicket ? jiraTicket.toUpperCase() : null;
}

export function writeJiraTicket(jiraTicket: string, config: JPCMConfig): void {
  debug('writeJiraTicket');

  const messageFilePath = getMsgFilePath(config.gitRoot);
  let message;

  // Read file with commit message
  try {
    message = fs.readFileSync(messageFilePath, { encoding: 'utf-8' });
  } catch (ex) {
    throw new Error(`Unable to read the file "${messageFilePath}".`);
  }

  const messageInfo = getMessageInfo(message, config);
  const messageWithJiraTicket = insertJiraTicketIntoMessage(messageInfo, jiraTicket, config);

  debug(messageWithJiraTicket);

  // Write message back to file
  try {
    fs.writeFileSync(messageFilePath, messageWithJiraTicket, { encoding: 'utf-8' });
  } catch (ex) {
    throw new Error(`Unable to write the file "${messageFilePath}".`);
  }
}
