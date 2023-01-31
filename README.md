# jira-prepare-commit-msg
[![Downloads](https://img.shields.io/npm/dm/jira-prepare-commit-msg)](https://www.npmjs.com/package/jira-prepare-commit-msg)
[![MIT license](https://img.shields.io/npm/l/jira-prepare-commit-msg)](http://opensource.org/licenses/MIT)

The husky command to add JIRA ticket ID into the commit message if it is missed.

The JIRA ticket ID is taken from a git branch name.

## Why?

Installing Jira prepare commit msg hook into your project will mean everyone contributing code to your project will automatically tag each commit with
it's associated issue key based off the branch name. 

So if your branch name is `feature/TEST-123-new-feature`, then when you commit with a message `"initial commit"` it will automatically become `"TEST-123: initial commit"`.

Why would you want this? Well, Jira has many hidden goodies, and this is one of them! If you include an issue key in your commit messages AND you have your deployment pipeline connected to Jira this will unlock many bonus features, such as the Deployments view, Cycle time report, Deployment frequency report and I've heard many more features are coming soon!

## Installation

Install the package using NPM

```bash
npm install husky jira-prepare-commit-msg --save-dev && npx husky install
```

For Husky 5:

Execute command

```shell
npx husky add .husky/prepare-commit-msg 'npx jira-prepare-commit-msg $1'
```
To quiet the output of the command, you can use the `--quiet` flag.
```shell
npx husky add .husky/prepare-commit-msg 'npx jira-prepare-commit-msg --quiet $1'
```

For Husky 2-4:

Inside your package.json add a standard husky npm script for the git hook

```json
{
  "husky": {
    "hooks": {
      "prepare-commit-msg": "jira-prepare-commit-msg"
    }
  }
}
```

## Configuration

Starting with v1.3 you can now use different ways of configuring it:

* `jira-prepare-commit-msg` object in your `package.json`
* `.jirapreparecommitmsgrc` file in JSON or YML format
* `jira-prepare-commit-msg.config.js` file in JS format

See [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for more details on what formats are supported.

#### `package.json` example:

```json
{
  "jira-prepare-commit-msg": {
    "messagePattern": "[$J] $M",
    "jiraTicketPattern": "([A-Z]+-\\d+)",
    "commentChar": "#",
    "isConventionalCommit": false,
    "conventionalCommitPattern": "^([a-z]+)(\\([a-z0-9.,-_ ]+\\))?!?: ([\\w \\S]+)$",
    "allowEmptyCommitMessage": false,
    "gitRoot": "",
    "allowReplaceAllOccurrences": true,
    "ignoredBranchesPattern": "^(master|main|dev|develop|development|release)$",
    "ignoreBranchesMissingTickets": false
  }
}
```

#### Supported message pattern

`jira-prepare-commit-msg` supports special message pattern to configure where JIRA ticket number will be inserted. 
* Symbols `$J` will be replaced on JIRA ticket number
* Symbols `$M` will be replaced on commit message.
 
Pattern `[$J]\n$M` is currently supported by default. 

```json
{
  "jira-prepare-commit-msg": {
    "messagePattern": "[$J]\n$M"
  }
}
```

##### Examples

* `[$J] $M`
* `[$J]-$M`
* `$J $M`

**NOTE:** the supplied commit message will be cleaned up by `strip` mode.

#### Replacing all occurrences

`jira-prepare-commit-msg` supports by default replacing all occurrences variables in message pattern.

```json
{
  "jira-prepare-commit-msg": {
    "allowReplaceAllOccurrences": true
  }
}
```

##### Examples

If set the message pattern to `[$J] $M. \n Line for CI ($J): $M`, then all occurrences will be replaced: 
```
[JIRA-1234] test message.
Line for CI (JIRA-1234): test message
```

#### Supported JIRA ticket pattern

`jira-prepare-commit-msg` allows using custom regexp string pattern to search JIRA ticket number.

Pattern `([A-Z]+-\\d+)` is currently supported by default. 

**NOTE:** to search JIRA ticket pattern flag `i` is used: `new RegExp(pattern, i')`  

```json
{
  "jira-prepare-commit-msg": {
    "jiraTicketPattern": "([A-Z]+-\\d+)"
  }
}
```

#### Git comment char

Git uses `#` by default to comment lines in the commit message. If default char was changed `jira-prepare-commit-msg` can allow set it.

```json
{
  "jira-prepare-commit-msg": {
    "commentChar": "#"
  }
}
```

#### Allow empty commit message

The commit message might be empty after cleanup or using `-m ""`, `jira-prepare-commit-msg` might insert the JIRA ticket number anyway if this flag is set.

```json
{
  "jira-prepare-commit-msg": {
    "allowEmptyCommitMessage": true
  }
}
```

#### Git root

The git root folder might be set. It is either absolute path or relative path which will be resolved from `cwd`

```json
{
  "jira-prepare-commit-msg": {
    "gitRoot": "./../../"
  }
}
```

The package will search commit message so: 
```javascript
const pathToGit = path.resolve(cwd, './../../');
const pathToCommitMessage = path.join(pathToGit, '.git', 'COMMIT_EDITMSG');
```

#### Ignoring branches

Branches can be ignored and skipped by regex pattern string

```json
{
  "jira-prepare-commit-msg": {
    "ignoredBranchesPattern": "^main|develop|(maint-.*)$"
  }
}
```

Moreover, this can be solved by replacing the Husky hook. Put in your prepare-commit-msg file (husky git hook):

```shell
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

if [[ "$(git rev-parse --abbrev-ref HEAD)" =~ YOUR_BRANCH_REGEX ]]; then
npx --no-install jira-prepare-commit-msg $1
fi
```

where `YOUR_BRANCH_REGEX` e.g. `^(feature|(bug|hot)fix)\/[A-Z]+-[0-9]+$`

#### Silently ignore any branch that does not have a jira ticket in it

Be silent and skip any branch with missing jira ticket

```json
{
  "jira-prepare-commit-msg": {
    "ignoreBranchesMissingTickets": true
  }
}
```


#### Conventional commit

`jira-prepare-commit-msg` supports [conventional commit](https://www.conventionalcommits.org). To insert JIRA
ticket number to the description set the following setting:

```json
{
  "jira-prepare-commit-msg": {
    "isConventionalCommit": true
  }
}
```

**NOTE:** For description will be applied `messagePattern`

##### Examples

If the configuration is:

```json
{
  "jira-prepare-commit-msg": {
    "messagePattern": "[$J] $M",
    "isConventionalCommit": true
  }
}
``` 

and commit message is `fix(test)!: important changes` then at result will be `fix(test)!: [JIRA-1234] important changes`

Additionally, you can **customize the conventional commit format** with the following setting:

```json
{
  "jira-prepare-commit-msg": {
    "conventionalCommitPattern": "^([a-z]+)(\\([a-z0-9.,-_ ]+\\))?!?: ([\\w \\S]+)$"
  }
}
```

The above regular expression is the default conventional commit pattern so, if you don't provide this property, `jira-prepare-commit-msg` will use this by default.

In the default regular expression, from left to right:

- `([a-z]+)` is the commit `type`.
- `(\\([a-z0-9.,-_ ]+\\))?!?` is the commit `scope`.
- And `([\\w \\S]+)` is the commit `subject`.

With this setting you can change how `jira-prepare-commit-msg` reads your custom conventional commit message and rewrite it adding the Jira ticket id.

##### Examples

You can allow the scope to have capital letters adding A-Z to the regular expression above. If the configuration is:

```json5
{
  "jira-prepare-commit-msg": {
    "messagePattern": "[$J] $M",
    "isConventionalCommit": true,
    "conventionalCommitPattern": "^([a-z]+)(\\([a-zA-Z0-9.,-_ ]+\\))?!?: ([\\w \\S]+)$"
    //                                             ^^^
    //                 Now we can use capital letters in the conventional commit scope
  }
}
```

and commit message is "`test(E2E): some end-to-end testing stuff`" then at result will be "`test(E2E): [JIRA-1234] some end-to-end testing stuff`"

Be aware that if you leave the default `conventionalCommitPattern` value (that it not allows capital letters in the commit scope), and the same values for `messagePattern` and `isConventionalCommit` in the example above, your resulting message will be "`[JIRA-1234] test(E2E): some end-to-end testing stuff`". Maybe, this is not the result you are expecting and you can have problems using other tools like [commitlint](https://commitlint.js.org/).

## TODO

- [x] Support user patterns
- [x] Support configuration (package.json)
- [x] Lint
- [x] Tests
  - [ ] Test for configuration
- [x] Don't clear commit message

## License

MIT
