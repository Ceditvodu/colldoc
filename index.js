#!/usr/bin/env node
'use strict!';

/**
	* @todo
	* - take list of file names
	* - generate menu from all this files with separete function that can take active item parameter
	* - take DOM of every file
	* - add generated menu in every file
	*/
const program = require('commander');

// program
//   .version('0.0.1')
//   .command('colldoc [optional...]')
//   .description('hellover is program that can say hello!')
//   .action(function(req,optional){
//     console.log('works');
//   });

// console.log('hi');
// program.parse(process.argv); // notice that we have to parse in a new statement.


const fs = require('fs');
const fsc = require("fs-cheerio");
 


if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " path/to/directory");
    process.exit(-1);
}
 
const path = process.argv[2];
 
let menuItems = [];

function getFileDom (filePath) {

	return new Promise( (resolve,reject) => {
		fsc.readFile(filePath, 'utf8', (error, response) => {
			if(error){
				reject('we have no files');
			}else{
				resolve(resolve);
			}
		})
	} );
}

fs.readdir(path, function(err, items) {
  	// items.forEach( item => {
  	// 	fs.readFile(path + item, 'utf8',(err, data) => {
  	// 		console.log(path + item);
  	// 		console.log(data);
  	// 	});
  	// } )
  	items.forEach( item => {
  		menuItems.push(item);
  		getFileDom(path+item).then(response => {
  			console.log(response);
  			console.log('hi');
  		}, error => {
  			console.log('bad');
  			console.log(error);
  		})
  	} )
  	
		console.log(menuItems);
});
