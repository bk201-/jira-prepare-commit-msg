import test, { ExecutionContext } from 'ava';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import { JPCMConfig } from '../src/config.js';

interface CommitMessageToTest {
  initialMessage: string[];
  expectedMessage: string;
  options?: {
    isBranchIgnored: boolean;
  };
  config?: Partial<JPCMConfig>;
}

const singleScopeMessage: CommitMessageToTest = {
  initialMessage: ['chore(deps): Finally solved that problem!'],
  expectedMessage: 'chore(deps): [JIRA-4321]. Finally solved that problem!',
  config: {
    isConventionalCommit: true,
  },
};

const hyphenatedScopeMessage: CommitMessageToTest = {
  initialMessage: ['feat(new-service): Finally solved that problem!'],
  expectedMessage: 'feat(new-service): [JIRA-4321]. Finally solved that problem!',
  config: {
    isConventionalCommit: true,
  },
};

const firstLineWithCommentMessage: CommitMessageToTest = {
  initialMessage: ['# This line is comment', 'chore(fix): Finally solved that problem!'],
  expectedMessage: 'chore(fix): [JIRA-4321]. Finally solved that problem!',
  config: {
    isConventionalCommit: true,
  },
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
    isConventionalCommit: false,
  }
};

const conventionalCommitIncludesTicket = {
  initialMessage: ['feat: [JIRA-4321] Finally solved that problem!'],
  expectedMessage: 'feat: [JIRA-4321] Finally solved that problem!',
  config: {
    isConventionalCommit: true,
  },
};

const gitRootIsSet = {
  initialMessage: ['feat: Finally solved that problem!'],
  expectedMessage: 'feat: [JIRA-4321]. Finally solved that problem!',
  config: {
    isConventionalCommit: true,
    messagePattern: '[$J]. $M',
    gitRoot: './.git',
  },
};

const allowReplaceAllOccurrencesIsSet = {
  initialMessage: ['feat(multiple): Finally solved that problem!'],
  expectedMessage: 'feat(multiple): [JIRA-4321] [Finally solved that problem!]. (JIRA-4321) Finally solved that problem!',
  config: {
    allowReplaceAllOccurrences: true,
    messagePattern: '[$J] [$M]. ($J) $M',
    isConventionalCommit: true,
  },
};

const ignoredBranchesPatternIsSet = {
  initialMessage: ['feat(ignorebranches): Finally solved that problem!'],
  expectedMessage: 'feat(ignorebranches): Finally solved that problem!',
  options: {
    isBranchIgnored: true,
  },
  config: {
    ignoredBranchesPattern: '^JIRA-4321-test-husky\\d$',
    isConventionalCommit: true,
  },
};

const ignoredBranchesPatternIsSet2 = {
  initialMessage: ['feat(ignorebranches): Finally solved that problem!'],
  expectedMessage: 'feat(ignorebranches): [JIRA-4321]. Finally solved that problem!',
  options: {
    isBranchIgnored: false,
  },
  config: {
    ignoredBranchesPattern: '^develop$',
    isConventionalCommit: true,
  },
};

const conventionalCommitIncludesMultipleScope = {
  initialMessage: ['feat(scope1,scope2.scope3, scope4, scope_5): Finally solved that problem!'],
  expectedMessage: 'feat(scope1,scope2.scope3, scope4, scope_5): [JIRA-4321]. Finally solved that problem!',
  config: {
    isConventionalCommit: true,
  },
};

const conventionalCommitPattern = {
  initialMessage: ['feat(Scope1!, Scope2?): Finally solved that problem!'],
  expectedMessage: 'feat(Scope1!, Scope2?): [JIRA-4321]. Finally solved that problem!',
  config: {
    isConventionalCommit: true,
    conventionalCommitPattern: "^([a-z]+)(\\([a-zA-Z0-9.,-_ !?]+\\))?!?: ([\\w \\S]+)$"
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
  await exec('git add .gitignore', cwd, t);

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
  if (commitMessageToTest.options?.isBranchIgnored) {
    t.is(index > -1, false, `Log contains JIRA ticket, but shouldn't. Expected message: ${commitMessageToTest.expectedMessage}`);
  } else {
    t.is(index > -1, true, `Log doesn't contain JIRA ticket. Expected message: ${commitMessageToTest.expectedMessage}`);
  }

  const index2 = stdout.includes(commitMessageToTest.expectedMessage);
  t.is(index2, true, `Log doesn't contain correct message. Expected message: ${commitMessageToTest.expectedMessage}`);

  await exec(`git checkout -- ${path.join(cwd, '.jirapreparecommitmsgrc')}`, __dirname, t);
  await exec(`git update-ref -d HEAD`, cwd, t);
}

test('husky2 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky2', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky2', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky2', t);
  await testCommitMessage(imitateVerboseCommit, 'husky2', t);
  await testCommitMessage(conventionalCommitIncludesTicket, 'husky2', t);
  await testCommitMessage(gitRootIsSet, 'husky2', t);
  await testCommitMessage(allowReplaceAllOccurrencesIsSet, 'husky2', t);
  await testCommitMessage(ignoredBranchesPatternIsSet, 'husky2', t);
  await testCommitMessage(ignoredBranchesPatternIsSet2, 'husky2', t);
  await testCommitMessage(conventionalCommitIncludesMultipleScope, 'husky2', t);
  await testCommitMessage(conventionalCommitPattern, 'husky2', t);
});

test('husky3 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky3', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky3', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky3', t);
  await testCommitMessage(imitateVerboseCommit, 'husky3', t);
  await testCommitMessage(conventionalCommitIncludesTicket, 'husky3', t);
  await testCommitMessage(gitRootIsSet, 'husky3', t);
  await testCommitMessage(allowReplaceAllOccurrencesIsSet, 'husky3', t);
  await testCommitMessage(ignoredBranchesPatternIsSet, 'husky3', t);
  await testCommitMessage(ignoredBranchesPatternIsSet2, 'husky3', t);
  await testCommitMessage(conventionalCommitIncludesMultipleScope, 'husky3', t);
  await testCommitMessage(conventionalCommitPattern, 'husky3', t);
});

test('husky4 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky4', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky4', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky4', t);
  await testCommitMessage(imitateVerboseCommit, 'husky4', t);
  await testCommitMessage(conventionalCommitIncludesTicket, 'husky4', t);
  await testCommitMessage(gitRootIsSet, 'husky4', t);
  await testCommitMessage(allowReplaceAllOccurrencesIsSet, 'husky4', t);
  await testCommitMessage(ignoredBranchesPatternIsSet, 'husky4', t);
  await testCommitMessage(ignoredBranchesPatternIsSet2, 'husky4', t);
  await testCommitMessage(conventionalCommitIncludesMultipleScope, 'husky4', t);
  await testCommitMessage(conventionalCommitPattern, 'husky4', t);
});

test('husky5 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky5', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky5', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky5', t);
  await testCommitMessage(imitateVerboseCommit, 'husky5', t);
  await testCommitMessage(conventionalCommitIncludesTicket, 'husky5', t);
  await testCommitMessage(gitRootIsSet, 'husky5', t);
  await testCommitMessage(allowReplaceAllOccurrencesIsSet, 'husky5', t);
  await testCommitMessage(ignoredBranchesPatternIsSet, 'husky5', t);
  await testCommitMessage(ignoredBranchesPatternIsSet2, 'husky5', t);
  await testCommitMessage(conventionalCommitIncludesMultipleScope, 'husky5', t);
  await testCommitMessage(conventionalCommitPattern, 'husky5', t);
});
