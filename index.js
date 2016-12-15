'use strict'                                 // eslint-disable-line

const exec   = require('child_process').exec // https://nodejs.org/api/child_process.html
const chalk  = require('chalk')              // https://github.com/chalk/chalk
const fs     = require('fs')                 // https://nodejs.org/api/fs.html
const semver = require('semver')             // https://www.npmjs.com/package/semver

const configFileName = '.reliantrc'
const isWindows      = /^win/.test(process.platform)
const passSymbol     = isWindows ? ' ' : '\u2713'
const failSymbol     = isWindows ? 'x' : '\u2717'

module.exports = function reliant(options) {
    // Default reporter - console logs results
    function defaultReporter(results, error) {
        const pluralise = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`

        // Output title
        console.log('Reliant\n=======\n')

        // Check if results is an error
        if (error) {
            // Just display error
            console.log('Sorry, something went wrong...\n')
            console.log(chalk.red(`${results}\n`))
        } else {
            // Build summary
            const summary = results
                .map(result => result.pass ? chalk.green(`${passSymbol} ${chalk.bold(result.name)}`) : chalk.red(`${failSymbol} ${chalk.bold(result.name)}`))

            // Build issues
            const issues = results
                .filter(result => !result.pass)
                .map(result => {
                    if (result.error) {
                        return `+ ${chalk.bold(result.name)} requires ${chalk.bold(result.version.required)} but errored with ${chalk.bold.red(result.error)}`
                    } else {
                        return `+ ${chalk.bold(result.name)} requires ${chalk.bold(result.version.required)} but found ${chalk.bold.red(result.version.found)}`
                    }
                })

            // Output report
            console.log(`Summary:\n${summary.join('\n')}`)
            console.log(`\n${pluralise(results.length, 'test', 'tests')}, ${pluralise(results.length - issues.length, 'pass', 'passes')}, ${pluralise(issues.length, 'failure', 'failures')}\n`)

            // Got issues?
            if (issues.length) {
                console.log(`Issues:\n${issues.join('\n')}\n`)
            } else {
                console.log('No issues!\n')
            }
        }
    }

    // Tests environment against rules
    function run(rules) {
        // Create an array of Promises
        const tests = rules.map(rule => {
            return new Promise(resolve => {
                // Execute command
                exec(rule.cmd, (error, stdout, stderr) => {
                    // Resolve the Promise and return a details object
                    resolve({
                        name: rule.name,
                        cmd: rule.cmd,
                        version: {
                            required: rule.version,
                            found: stdout.replace(/\r?\n|\r/g, '')
                        },
                        error: error !== null ? stderr.replace(/\r?\n|\r$/, '') : null,
                        pass: semver.satisfies(stdout, rule.version)
                    })
                })
            })
        })

        // Wait for all promises to be resolved before continuing
        return Promise.all(tests)
    }

    // Extends default options with any custom options
    options = Object.assign({}, { reporter: defaultReporter }, options)

    // Read .envrc file
    fs.readFile(configFileName, 'utf8', function (err, rules) {
        if (err) {
            throw new Error(`Could not load ${configFileName} file.`)
        }

        // Try to parse file contents as JSON
        try {
            rules = JSON.parse(rules)
        } catch (e) {
            throw new Error(`The ${configFileName} file could not be parsed. Check that it is valid JSON.`)
        }

        // Run
        run(rules)
            .then(results => {
                options.reporter(results, false)

                // If we have any fails, exit with
                if (results.filter(result => !result.pass).length > 0) {
                    // Failure
                    process.exit(1)
                } else {
                    // Success
                    process.exit()
                }
            }).catch(error => {
                options.reporter(error, true)
            })
    })
}
