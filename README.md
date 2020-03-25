# jira-prepare-commit-msg

Husky command to add JIRA ticket ID into the commit message if it is missed.

The JIRA ticket ID is taken from a git branch name.

## Installation

Install the package using NPM

```bash
npm install husky jira-prepare-commit-msg --save-dev
```

## Configuration

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

If you need the Jira ticket number to be inline add the following configuration in your `package.json`:
```json
{
  "config": {
    "jira-prepare-commit-msg": {
      "config": "inline"
    }
  }
}
```

## Supported pattern

The following patterns are currently supported:

* /([A-Z]+-\d+)/i

## TODO

- [ ] Support user patterns
- [ ] Support configuration (package.json)
- [x] Lint
- [x] Tests

## License

MIT
