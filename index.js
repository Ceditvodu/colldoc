#!/usr/bin/env node
'use strict!';
/**
	* @author Ivan Kaduk
	*/
const fs = require('fs');
const cheerio = require('cheerio');
const pathLib = require('path');

if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " path/to/directory");
    process.exit(-1);
}
 
const path = process.argv[2];
const resPath = path + '_docs';
const	finalPath = path + 'docs';
 
/**
	* @name getFileContent
	* @desc read files content
	* @param {string} filePath - adress of file thet need to read
	* @return {string} - file content in string 
	*/
function getFileContent (filePath) {

	return new Promise( (resolve,reject) => {

		fs.readFile(filePath, 'utf8', function(error, response) {

			error ?	reject('we have no files') : resolve(response);

		})

	} );

}

/**
	* @name getFileContent
	* @desc read files content
	* @param {string} filePath - adress of file thet need to read
	* @return {string} - file content in string 
	*/
function saveFile (filePath, content) {

	return new Promise( (resolve, reject) => {

		fs.open(filePath, 'w+', function(err, document) {
		  if (err) throw 'error opening file: ' + err;

		  let buffer = new Buffer(content);

		  fs.write(document, buffer, 0, buffer.length, null, function(err) {
		      if (err) throw 'error writing file: ' + err;

		      fs.close(document, function() {
		      	resolve('all is fine');
		        console.log(`${filePath} - file written`);
		      })

		  });

		});

	} )

}

function isFolderExist(folderPath){
	return new Promise( (resolve, reject) => {
		fs.access(folderPath, (error) => {
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

function generateNewContent(menu, content){

	return new Promise( (resolve, reject) => {
		
		let $ = cheerio.load(content);

		let body = $('body').html();

		$('body').children().remove();

		let columns = '<aside class="menu"></aside><section class="content"></section>'

		$('body').append(columns);
		$('.menu').append(menu);
		$('.content').append(body);

		resolve($.html());

	} );

}

function syncNewDirectory(path){
	return new Promise( (resolve, reject) => {

		fs.access(path, (error) => {

			if (error) {

				console.log('there is no "docs" folder, please add it to continue work');

				fs.mkdir(path, (error)=>{
					if(error){
						console.log('cant create "docs" directory');
						reject();
					}
					resolve();
				})

			}

			resolve();

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

		let filePath = `${resPath}/${htmlFilesNames[i]}`;
		let newFilePath = `${finalPath}/${htmlFilesNames[i]}`;

		let fileContent = await getFileContent(filePath);

		let newFileContent = await generateNewContent(menu, fileContent);

		await syncNewDirectory(finalPath);

		try {
			await saveFile(newFilePath, newFileContent);
		}catch(e){
			console.log(`${filePath} didn't saved`);
		}

	}
}

isFolderExist(resPath).then(_=>{

	getFilesNames(resPath).then( filesNames => {

		generateFiles(filesNames).then(_=>{
			console.log('all is cool');
		} );

	})

});
