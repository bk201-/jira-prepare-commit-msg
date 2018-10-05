const childProcess = require('child_process');
const findUp = require('find-up');
const fs = require('fs');
const path = require('path');

function findGitRoot() {
  return new Promise((resolve, reject) => {
    const cwd = process.cwd();

    // Get directory containing .git directory or in the case of Git submodules, the .git file
    const gitDirOrFile = findUp.sync('.git', { cwd: cwd });

    // Resolve git directory (e.g. .git/ or .git/modules/path/to/submodule)
    const resolvedGitDir = resolveGitDir(gitDirOrFile);

    // Checks
    if (gitDirOrFile === null) {
      reject("Can't find .git, skipping Git hooks.");
      return;
    }

    if (resolvedGitDir === null) {
      reject("Can't find resolved .git directory, skipping Git hooks.");
      return;
    }

    resolve(resolvedGitDir);
  });
}

function resolveGitDir(gitDirOrFile) {
  if (gitDirOrFile) {
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

  return null;
}

/**
 Husky stashes git hook parameters $* into a GIT_PARAMS env var.
 This method reads indexed parameters back out of that variable.
 */
function getMsgFilePath(index = 0) {
  // Husky 1.x namespaces GIT_PARAMS as HUSKY_GIT_PARAMS.
  // For now I'm accommodating both.
  const gitParams = process.env.HUSKY_GIT_PARAMS || process.env.GIT_PARAMS;

  console.debug(gitParams);

  // Throw a friendly error if the git params environment variable
  // can't be found – the user may be missing Husky.
  if (!gitParams) {
    throw new Error('Neither process.env.HUSKY_GIT_PARAMS nor process.env.GIT_PARAMS are set. Is a supported Husky version installed?');
  }

  // Unfortunately this will break if there are escaped spaces within
  // a single argument; I don't believe there's a workaround for this
  // without modifying Husky itself
  return gitParams.split(' ')[index];
}

function getBranchName(gitRoot) {
  return new Promise((resolve, reject) => {
    childProcess.exec(`git --git-dir=${gitRoot} symbolic-ref --short HEAD`, { encoding: 'utf-8' }, (err, stdout, stderr) => {
      if (stderr) {
        reject(String(stderr));
        return;
      }
      resolve(String(stdout).trim());
    });
  });
}

function getJiraTicket(branchName) {
  //const jiraIdPattern = /^(?:feature|bugfix|hotfix|release)\/([A-Z]+-\d+)-.+/i;

  // TODO: need have able to modify pattern
  const jiraIdPattern = /([A-Z]+-\d+)/i;
  const matched = branchName.match(jiraIdPattern);

  return Promise.resolve(matched && matched[0]);
}

function writeJiraTicket(jiraTicket) {
  if (jiraTicket) {
    const messageFilePath = getMsgFilePath();
    let message;

    // Read file with commit message
    try {
      message = fs.readFileSync(messageFilePath, { encoding: 'utf-8' });
    } catch (ex) {
      return Promise.reject(`Unable to read the file "${messageFilePath}".`);
    }

    // Add jira ticket to message if it is missed
    if (message.indexOf(jiraTicket) < 0) {
      message = `[${jiraTicket}]\n${message}`;
    }

    // Write message back to file
    try {
      fs.writeFileSync(messageFilePath, message, {encoding: 'utf-8'});
    } catch (ex) {
      return Promise.reject(`Unable to write the file "${messageFilePath}".`);
    }
  }

  return Promise.resolve();
}

module.exports = {
  findGitRoot,
  getBranchName,
  getJiraTicket,
  writeJiraTicket
};
