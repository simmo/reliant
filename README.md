# Reliant
Checks the system has required dependencies installed.

## Install

`npm install reliant`

## Configure

Add a `.reliantrc` file to your project's root. This tells Reliant what and how it should check for system requirements.

This should be valid JSON.

For example:

```json
[
    {
        "name": "NPM",
        "cmd": "npm --version",
        "version": "3.0.0 - 4.0.x"
    }, {
        "name": "Node",
        "cmd": "node --version",
        "version": "^4.0.0"
    }, {
        "name": "Yarn",
        "cmd": "yarn --version",
        "version": "0.17.x"
    }
]
```

Each object within the array should define the following:

`name` - Human readable name of the package

`cmd` - The command Reliant should run to obtain the version

`version` - The version range required [see semver examples](https://semver.npmjs.com/)

## Run

In your package.json add `reliant` to the `scripts` block.

Example:

```json
...
    "scripts": {
        "test": "reliant"
    }
...
```

With the above example, you should be able to run `npm test` from your terminal.
