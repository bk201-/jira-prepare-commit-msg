import test, { ExecutionContext } from "ava";
import * as path from 'path';
import * as childProcess from 'child_process';

function exec(cmd: string, cwd: string, t: ExecutionContext): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`${t.title}. Exec ${cmd}`)

    childProcess.exec(cmd, {encoding: 'utf-8', cwd}, (err, stdout, stderr) => {
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

async function steps(folder: string, t: ExecutionContext): Promise<void> {
  const message = 'chore(deps): Finally solved that problem!';
  const expected = 'chore(deps): [JIRA-4321]. Finally solved that problem!'
  const cwd = path.join(__dirname, folder);
  await exec('git config user.email "you@example.com"', cwd, t);
  await exec('git config user.name "Your Name"', cwd, t);
  await exec('git add .gitignore', cwd, t);
  await exec(`git commit -m "${message}"`, cwd, t);
  const stdout = await exec('git log', cwd, t);
  const index = stdout.search(/(\[[A-Z]+-\d+])/i);
  t.is(index > -1, true);
  const index2 = stdout.includes(expected);
  t.is(index2, true);
}

test('husky2 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await steps('husky2', t);
});

test('husky3 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await steps('husky3', t);
});

test('husky4 JIRA ticket ID should be in commit message', async (t: ExecutionContext) => {
  await steps('husky4', t);
});
