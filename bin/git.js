const childProcess = require('child_process');
const findUp = require('find-up');
const fs = require('fs');
const path = require('path');

const verbose = process.argv.find(arg => arg === '--verbose');

const debug = message => {
  if (!verbose) {
    return;
  }

  console.log(`JIRA prepare commit msg > DEBUG: ${message}`);
};

function findGitRoot() {
  debug('findGitRoot');

  const cwd = process.cwd();

  // Get directory containing .git directory or in the case of Git submodules, the .git file
  const gitDirOrFile = findUp.sync('.git', {cwd, type: 'directory'});

  if (gitDirOrFile === null) {
    throw new Error('Can\'t find .git, skipping Git hooks.');
  }

  // Resolve git directory (e.g. .git/ or .git/modules/path/to/submodule)
  const resolvedGitDir = resolveGitDir(gitDirOrFile);

  if (resolvedGitDir === null) {
    throw new Error('Can\'t find resolved .git directory, skipping Git hooks.');
  }

  return resolvedGitDir;
}

function resolveGitDir(gitDirOrFile) {
  debug('resolveGitDir');

  const stats = fs.lstatSync(gitDirOrFile);

  // If it's a .git file resolve path
  if (stats.isFile()) {
    // Expect following format
    // git: pathToGit
    // On Windows pathToGit can contain ':' (example "gitdir: C:/Some/Path")
    const gitFileData = fs.readFileSync(gitDirOrFile, 'utf-8');
    const resolvedGitDir = gitFileData
      .split(':')
      .slice(1)
      .join(':')
      .trim();
    gitDirOrFile = path.resolve(path.dirname(gitDirOrFile), resolvedGitDir);
  }

  // Else return path to .git directory
  return gitDirOrFile;
}

function getMsgFilePath(index = 0) {
  debug('getMsgFilePath');

  // Husky stashes git hook parameters $* into a HUSKY_GIT_PARAMS (GIT_PARAMS if < 1.x) env var.
  const gitParams = process.env.HUSKY_GIT_PARAMS || process.env.GIT_PARAMS || '';

  // Throw a friendly error if the git params environment variable can't be found – the user may be missing Husky.
  if (!gitParams) {
    throw new Error('Neither process.env.HUSKY_GIT_PARAMS nor process.env.GIT_PARAMS are set. ' +
      'Is a supported Husky version installed?');
  }

  // Unfortunately, this will break if there are escaped spaces within a single argument;
  // I don't believe there's a workaround for this without modifying Husky itself
  return gitParams.split(' ')[index];
}

function getBranchName(gitRoot) {
  debug('getBranchName');

  return new Promise((resolve, reject) => {
    childProcess.exec(
      `git --git-dir=${gitRoot} symbolic-ref --short HEAD`,
      {encoding: 'utf-8'},
      (err, stdout, stderr) => {
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

function getJiraTicket(branchName) {
  debug('getJiraTicket');

  const jiraIdPattern = /([A-Z]+-\d+)/i;
  const matched = branchName.match(jiraIdPattern);
  const jiraTicket = matched && matched[0];

  if (!jiraTicket) {
    throw new Error('The JIRA ticket ID not found');
  }

  return jiraTicket;
}

function writeJiraTicket(jiraTicket) {
  debug('writeJiraTicket');

  const messageFilePath = getMsgFilePath();
  let message;

  // Read file with commit message
  try {
    message = fs.readFileSync(messageFilePath, {encoding: 'utf-8'});
  } catch (ex) {
    throw new Error(`Unable to read the file "${messageFilePath}".`);
  }

  // Add jira ticket into the message in case of missing
  if (message.indexOf(jiraTicket) < 0) {
    message = `[${jiraTicket}]\n${message}`;
  }

  // Write message back to file
  try {
    fs.writeFileSync(messageFilePath, message, {encoding: 'utf-8'});
  } catch (ex) {
    throw new Error(`Unable to write the file "${messageFilePath}".`);
  }
}

module.exports = {
  findGitRoot,
  getBranchName,
  getJiraTicket,
  writeJiraTicket
};
