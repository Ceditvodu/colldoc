#!/usr/bin/env node
'use strict!';

const program = require('commander');

program
  .version('0.0.1')
  .command('hellover <your name> [optional...]')
  .description('hellover is program that can say hello!')
  .option('-o, --option','we can still have add\'l options')
  .action(function(req,optional){
    console.log('\n!!!!!!!!!!!!!!!!!!!!');
    console.log('well hello %s', req);
    console.log('!!!!!!!!!!!!!!!!!!!!');
    if (optional) {
      optional.forEach(function(opt){
        console.log("User passed optional arguments: %s!", opt);
      });
    }
  });
program.parse(process.argv); // notice that we have to parse in a new statement.