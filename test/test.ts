import test from 'ava';
import * as path from 'path';
import * as childProcess from 'child_process';

function exec(cmd: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, {encoding: 'utf-8', cwd}, (err, stdout) => {
      if (err) {
        return reject(err);
      }

      resolve(String(stdout).trim());
    });
  });
}

test('husky2 JIRA ticket ID should be in commit message', async t => {
  const cwd = path.join(__dirname, 'husky2');
  await exec('git config user.email "you@example.com"', cwd);
  await exec('git config user.name "Your Name"', cwd);
  await exec('git add .gitignore', cwd);
  await exec('git commit -m "test"', cwd);
  const stdout = await exec('git log', cwd);
  const index = stdout.search(/(\[[A-Z]+-\d+])/i);
  t.is(index > -1, true);
});

test('husky3 JIRA ticket ID should be in commit message', async t => {
  const cwd = path.join(__dirname, 'husky3');
  await exec('git config user.email "you@example.com"', cwd);
  await exec('git config user.name "Your Name"', cwd);
  await exec('git add .gitignore', cwd);
  await exec('git commit -m "test"', cwd);
  const stdout = await exec('git log', cwd);
  const index = stdout.search(/(\[[A-Z]+-\d+])/i);
  t.is(index > -1, true);
});

test('husky4 JIRA ticket ID should be in commit message', async t => {
  const cwd = path.join(__dirname, 'husky4');
  await exec('git config user.email "you@example.com"', cwd);
  await exec('git config user.name "Your Name"', cwd);
  await exec('git add .gitignore', cwd);
  await exec('git commit -m "test"', cwd);
  const stdout = await exec('git log', cwd);
  const index = stdout.search(/(\[[A-Z]+-\d+])/i);
  t.is(index > -1, true);
});
