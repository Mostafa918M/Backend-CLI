#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const chalk = require('chalk');

const generateCommand = require('../src/commands/generate');

program
  .name('mm')
  .description('CLI tool for generating Express.js BY MOSTAFA MAHMOUD')
  .version('1.0.0');

generateCommand(program);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}