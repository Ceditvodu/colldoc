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
const cheerio = require('cheerio');
const pathLib = require('path');

if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " path/to/directory");
    process.exit(-1);
}
 
const path = process.argv[2] + '_docs';
 
let menuItems = [];

let menu;
let $;


function getFileDom (filePath) {
	return new Promise( (resolve,reject) => {
		fs.readFile(filePath, 'utf8', function(error, response) {
			if(error){
				reject('we have no files');
			}else{
				resolve(response);
			}
		})
	} );
}

function saveFile () {

}

function isFolderExist(folderPath){
	return new Promise( (resolve, reject) => {
		fs.access(path, (error) => {
			if (error) {
				console.log('there is no "_docs" folder, please add it to continue work');
				reject();
			}
			resolve();
		});
	} );
}

function getFilesNames(path){
	return new Promise( (resolve, reject) => {
		fs.readdir(path, function(error, items) {
			if (error){
				reject();
			}
			resolve(items);
		});
	} );
} 

async function generateFiles (filesNames) {

	let htmlFilesNames = filesNames
	.filter( fileName => pathLib.parse(fileName).ext === '.html' );
	
	let menu = htmlFilesNames.reduce( ( a, b ) => {
		return `${a}<li><a href="${b}">${pathLib.parse(b).name}</a></li>`;
	}, '<ul>' ) + '</ul>';

	for (let i=0; i<htmlFilesNames.length; i++) {

		let filePath = `${path}/${htmlFilesNames[i]}`;

		let fileContent = await getFileDom(filePath);

		let $ = cheerio.load(fileContent);

		let body = $('body').html();

		$('body').children().remove();
		let columns = '<aside class="menu"></aside><srction class="content"></srction>'
		$('body').append(columns);
		$('.menu').append(menu);
		$('.content').append(body);
		console.log($.html());

	}

	return 'cool'
}

isFolderExist(path).then(_=>{

	getFilesNames(path).then( filesNames => {

		generateFiles(filesNames).then( ()=>{
			console.log('all is cool');
		} );

	})

});



// fs.readdir(path, function(err, items) {

// 	items.forEach( item => {
// 		menuItems.push(item);
// 	} );

// 	menu = items
// 	.filter( fileName => pathLib.parse(fileName).ext === '.html' )
// 	.reduce( ( a, b ) => {
// 		return `${a}<li><a href="${b}">${pathLib.parse(b).name}</a></li>`;
// 	}, '<ul>' ) + '</ul>';

// 	console.log(menu);

// 	items
// 	.filter( fileName => fileName.substr(-5) === '.html' )
// 	.forEach( item => {

// 		getFileDom(path+item).then(response => {
// 			$ = cheerio.load(response);
// 			let body = $('body').html();
// 			$('body').children().remove();
// 			let columns = '<aside class="menu"></aside><srction class="content"></srction>'
// 			$('body').append(columns);
// 			$('.menu').append(menu);
// 			$('.content').append(body);
// 			console.log($.html());
// 		}, error => {
// 			console.log('bad');
// 		})

// 	} );
	
// 	console.log(menuItems);
// });
