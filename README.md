# jira-prepare-commit-msg
[![Downloads](https://img.shields.io/npm/dm/jira-prepare-commit-msg)](https://www.npmjs.com/package/jira-prepare-commit-msg)
[![MIT license](https://img.shields.io/npm/l/jira-prepare-commit-msg)](http://opensource.org/licenses/MIT)

The husky command to add JIRA ticket ID into the commit message if it is missed.

The JIRA ticket ID is taken from a git branch name.

## Installation

Install the package using NPM

```bash
npm install husky jira-prepare-commit-msg --save-dev
```

Inside your package.json add a standard husky npm script for the git hook:

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
    "messagePattern": "[$J]\n$M",
    "jiraTicketPattern": "([A-Z]+-\\d+)",
    "commentChar": "#",
    "isConventionalCommit": false
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

## TODO

- [x] Support user patterns
- [x] Support configuration (package.json)
- [x] Lint
- [x] Tests
  - [ ] Test for configuration

## License

MIT
