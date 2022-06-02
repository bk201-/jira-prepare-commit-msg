import test, { ExecutionContext } from 'ava';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import { JPCMConfig } from '../src/config';

interface CommitMessageToTest {
  initialMessage: string[];
  expectedMessage: string;
  flags?: string;
  config?: Partial<JPCMConfig>;
}

const singleScopeMessage: CommitMessageToTest = {
  initialMessage: ['chore(deps): Finally solved that problem!'],
  expectedMessage: 'chore(deps): [JIRA-4321]. Finally solved that problem!',
};

const hyphenatedScopeMessage: CommitMessageToTest = {
  initialMessage: ['feat(new-service): Finally solved that problem!'],
  expectedMessage: 'feat(new-service): [JIRA-4321]. Finally solved that problem!',
};

const firstLineWithCommentMessage: CommitMessageToTest = {
  initialMessage: ['# This line is comment', 'chore(deps): Finally solved that problem!'],
  expectedMessage: 'chore(deps): [JIRA-4321]. Finally solved that problem!',
};

const imitateVerboseCommit: CommitMessageToTest = {
  initialMessage: [
    '\u00A0',
    '# Please enter the commit message for your changes. Lines starting',
    "# with '#' will be ignored, and an empty message aborts the commit.",
    '#',
    '# On branch master',
    "# Your branch is up to date with 'origin/master'.",
    '#',
    '# Changes to be committed:',
    '# ------------------------ >8 ------------------------',
  ],
  expectedMessage: '[JIRA-4321].',
  config: {
    allowEmptyCommitMessage: true,
  },
};

const conventionalCommitIncludesTicket = {
  initialMessage: ['feat: [JIRA-4321] Finally solved that problem!'],
  expectedMessage: 'feat: [JIRA-4321] Finally solved that problem!',
};

const gitRootIsSet = {
  initialMessage: ['feat: [JIRA-4321] Finally solved that problem!'],
  expectedMessage: 'feat: [JIRA-4321] Finally solved that problem!',
  config: {
    isConventionalCommit: true,
    messagePattern: '[$J]. $M',
    gitRoot: './.git',
  },
};

function exec(cmd: string, cwd: string, t: ExecutionContext): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`${t.title}. Exec ${cmd}`);

    childProcess.exec(cmd, { encoding: 'utf-8', cwd }, (err, stdout, stderr) => {
      err && console.error(`\t <= exec error: ${err}`);
      stdout && console.log(`\t <= exec stdout: ${stdout}`);
      stderr && console.error(`\t <= exec stderr: ${stderr}`);

      if (err) {
        return reject(err);
      }

      resolve(String(stdout).trim());
    });
  });
}

async function testCommitMessage(
  commitMessageToTest: CommitMessageToTest,
  folder: string,
  t: ExecutionContext,
): Promise<void> {
  const cwd = path.join(__dirname, folder);
  await exec('git config user.email "you@example.com"', cwd, t);
  await exec('git config user.name "Your Name"', cwd, t);
  await exec('git add .gitignore -f', cwd, t);

  if (commitMessageToTest.config) {
    const pathToConfig = path.join(cwd, '.jirapreparecommitmsgrc');
    fs.writeFileSync(
      pathToConfig,
      JSON.stringify({
        ...JSON.parse(fs.readFileSync(pathToConfig).toString('utf-8')),
        ...commitMessageToTest.config,
      }),
    );
  }

  // Because I can't imitate multiline commit in Windows CLI, I decided to use file
  const pathToTempFile = path.join(cwd, '.git', 'COMMIT_EDITMSG');
  fs.writeFileSync(pathToTempFile, commitMessageToTest.initialMessage.join('\n'));

  const commitMsg = commitMessageToTest.initialMessage.length !== 0 ? `-F ${pathToTempFile}` : '-m ""';
  await exec(`git commit --cleanup=strip ${commitMsg}`, cwd, t);

  const stdout = await exec('git log', cwd, t);
  const index = stdout.search(/(\[[A-Z]+-\d+])/i);
  t.is(index > -1, true, `Expected message: ${commitMessageToTest.expectedMessage}`);
  const index2 = stdout.includes(commitMessageToTest.expectedMessage);
  t.is(index2, true, `Expected message: ${commitMessageToTest.expectedMessage}`);

  await exec(`git update-ref -d HEAD`, cwd, t);
}

test.serial.afterEach.always(async (t) => {
  for (let i of [2, 3, 4, 5]) {
    await exec(`git checkout ${path.join('.', 'husky' + i, '.jirapreparecommitmsgrc')}`, __dirname, t);
  }
});

test.serial('husky2 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky2', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky2', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky2', t);
  await testCommitMessage(imitateVerboseCommit, 'husky2', t);
  await testCommitMessage(conventionalCommitIncludesTicket, 'husky2', t);
  await testCommitMessage(gitRootIsSet, 'husky2', t);
});

test.serial('husky3 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky3', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky3', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky3', t);
  await testCommitMessage(imitateVerboseCommit, 'husky3', t);
  await testCommitMessage(conventionalCommitIncludesTicket, 'husky3', t);
  await testCommitMessage(gitRootIsSet, 'husky3', t);
});
test.serial('husky4 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky4', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky4', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky4', t);
  await testCommitMessage(imitateVerboseCommit, 'husky4', t);
  await testCommitMessage(conventionalCommitIncludesTicket, 'husky4', t);
  await testCommitMessage(gitRootIsSet, 'husky4', t);
});
test.serial('husky5 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky5', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky5', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky5', t);
  await testCommitMessage(imitateVerboseCommit, 'husky5', t);
  await testCommitMessage(conventionalCommitIncludesTicket, 'husky5', t);
  await testCommitMessage(gitRootIsSet, 'husky5', t);
});
