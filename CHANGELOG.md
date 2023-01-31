### 1.7.2
- [feature] New CLI option --quite to quiet the output of the command.
- [fix] Fixes `clean` command 

### 1.7.1
- [feature] New config: conventionalCommitPattern. This option allows to replace default conventional commit pattern.

### 1.7.0

- [feature] Conventional commit regular expression was simplified to support multiple scopes
- [feature] New config: allowReplaceAllOccurrences. This option allows to replace all occurrences of variables.
- [feature] New config: ignoredBranchesPattern. This option allows to ignore branches without JIRA ticket like main or develop.
- [feature] New config: ignoreBranchesMissingTickets. This option allows to ignore any branches without JIRA ticket.
- [fix] gitRoot option has priority for searching .git folder if it is specified
- [minor] Adds new tests
- [minor] Bumps versions
- [minor] Updates README

### 1.6.2

- [feature] New config: gitRoot. It might be either absolute path or relative path which will be resolved from `cwd`
- [minor] Adds new tests
- [minor] Bumps versions
- [minor] Updates README

### 1.6.1

- [feature] The new line was removed from the commit message pattern
- [minor] Bumps versions
- [minor] Updates README

### 1.6.0

- [feature] Based on [issue](https://github.com/bk201-/jira-prepare-commit-msg/issues/319) JIRA ticket will be either
  - injected into commit message as a comment if the user doesn't write one `git commit`
  - ignored without the flag `config.allowEmptyCommitMessage` if the user writes empty message `git commit -m ""`
- [minor] Bumps versions

### 1.5.2

- [feature] Supports Husky 5

### 1.5.1

- [minor] Changes EOL to LF

### 1.5.0

- [feature] Supports verbose commit `git commit -v`
- [minor] Adds new tests
- [minor] Bumps versions
- [minor] Updates TODO list in README

### 1.4.3

- [fix] Supports hyphenated single scope as supported by conventional commit
- [minor] Adds .DS_Store to gitignore file
- [minor] Updates tests

### 1.4.2

- [fix] Supports empty and default commit message
- [minor] Updates test logs
- [minor] Bumps versions
- [minor] Fixes README

### 1.4.1

- [fix] Supports not whitespace characters for conventional commit
- [minor] Updates tests
- [minor] Bumps versions
- [minor] Fixes README

### 1.4.0

- [fix] Supports git directories with “spaces” in their path

### 1.3.3

- [minor] Bumps versions
- [minor] Adds IDE project folders to npm ignore file

### 1.3.2

- [fix] Fixes scope for conventional commit

### 1.3.1

- [minor] Bumps versions

### 1.3.0

- [feature] Supports configuration
- [minor] Adds description to README
- [minor] Bumps versions

### 1.2.0

- [feature] Adds prettier
- [feature] Changes default eslint rules to more useful
- [feature] Adds test for husky^4
- [minor] Bumps versions

### 1.1.2

- [minor] Bumps versions

### 1.1.1

- [fix] Fixes tests
- [minor] Bumps versions

### 1.1.0

- [feature] Adds test
- [fix] Fixes find-up error
- [minor] Bumps versions

### 1.0.3

- [fix] Supports old Node.js versions

### 1.0.2

- [feature] Adds ESLint
- [feature] Code refactoring
- [feature] Moves logger function to the main file

### 1.0.1

- [feature] Adds info about JIRA ticket ID to the log
- [minor] Updates README

### 1.0.0

- [feature] Implements a prepare-commit-message hook for Husky
