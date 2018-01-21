#!/usr/bin/env node
'use strict!';

const program = require('commander');

program
  .version('0.0.1')
  .command('colldoc [optional...]')
  .description('hellover is program that can say hello!')
  .action(function(req,optional){
    console.log('works');
  });

console.log('hi');
program.parse(process.argv); // notice that we have to parse in a new statement.