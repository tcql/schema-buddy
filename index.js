#!/usr/bin/env node

const prompts = require('prompts')
const _ = require('lodash')
const yargs = require('yargs')

yargs
  .options({})
  .command('*', 'Explore JSON schemas', () => {}, async argv => {
    const {command} = await prompts([
      {
        type: 'select',
        name: 'command',
        message: 'What would you like to do?',
        choices: [
          { title: 'Validate an event against a schema', value: 'validate' },
          // { title: 'See an example event for a schema', value: 'example', disabled: true },
          { title: 'Summarize a schema', value: 'summarize' }
        ]
      }
    ], {
      onCancel: () => {
        console.log('Aborting')
        process.exit()
      }
    })
    const cmd = require(`./src/commands/${command}`)
    cmd.handler(argv)
  })
  .commandDir('./src/commands')
  .version()
  .help()
  .parse()

