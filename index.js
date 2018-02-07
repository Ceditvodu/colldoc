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
			error ?	reject( 'we have no files' + error ) : resolve(response);
		})
	} );
}

/**
	* @name saveFile
	* @desc save content to file, or update it, or create new file.
	* @param {string} filePath - adress of file in what must be saved content.
	* @param {string} content - content that must be writen in file.
	*/
function saveFile (filePath, content) {

	return new Promise( (resolve, reject) => {

		fs.open(filePath, 'w+', function(error, document) {

		  if (error){

	    	console.log(`${filePath} - file didn't written (check file permissions)`);
	    	resolve();

		  }else{

			  let buffer = new Buffer(content);

			  fs.write(document, buffer, 0, buffer.length, null, function(error) {
			      if (error) {
				    	console.log(`${filePath} - file didn't written`);
			      	resolve();
			      }

			      fs.close(document, function() {
			        console.log(`${filePath} - file written`);
			      	resolve();
			      })

			  });

		  }

		});

	} )

}

/**
	* @function
	* @name isFolderExist
	* @param {string} folderPath - path that must be insured.
	*/
function isFolderExist(folderPath){
	return new Promise( (resolve, reject) => {
		fs.access(folderPath, (error) => {
			if (error) {
				console.log('there is no "_docs" folder, please add it to continue work');
				throw error;
			}
			
			resolve();
		});
	} );
}

/**
	* @function
	* @name getFilesNames
	* @desc get list of files from folder.
	* @param {string} path - folder path that contain files.
	* @return {array} - list of files names.
	*/
function getFilesNames(path){
	return new Promise( (resolve, reject) => {
		fs.readdir(path, function(error, items) {
			if (error) throw error;
			resolve(items);
		});
	} );
} 


function generateNewContent(menu, content){

	return new Promise( (resolve, reject) => {
		
		let $ = cheerio.load(content);

		let body = $('body').html();

		$('body').children().remove();

		let columns = '<aside class="menu"></aside><section class="content"></section>';

		$('body').append(columns);
		$('.menu').append(menu);
		$('.content').append(body);

		resolve($.html());

	} );

}

function syncNewDirectory(path){
	return new Promise( (resolve, reject) => {

		fs.access(path, error => {

			if (error) {

				console.log('there is no "docs" folder, please add it to continue work');

				fs.mkdir(path, error => {
					if(error){
						console.log('cant create "docs" directory');
						reject(error);
						throw error;
					}
					resolve();
				})

			}

			resolve();

		});

	} );
}

function generateMenu(filesNames, activeItem){
	let menu = filesNames.reduce( ( a, b ) => {
			let active = activeItem === b ? 'active' : '';
			return `${a}<li class="${active}"><a href="${b}">${pathLib.parse(b).name}</a></li>`;
		}, '<nav class="menu"><ul>' ) + '</ul></nav>';
	return menu;
}

async function generateFiles (filesNames) {

	let htmlFilesNames = filesNames
	.filter( fileName => pathLib.parse(fileName).ext === '.html' );
	

	for (let htmlFilesName of htmlFilesNames) {

		let menu = generateMenu(htmlFilesNames, htmlFilesName);

		let filePath = `${resPath}/${htmlFilesName}`;
		let newFilePath = `${finalPath}/${htmlFilesName}`;

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
