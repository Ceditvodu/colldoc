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
	* @function
	* @name getColor
	* @desc filling some colors to comand line
	* @param {string} color - name of color that it hase next syntacs:
	* {font|back}{colorName}
	* @return {string} - color code copitable with comande line.
	*/
function getColor(color){
	let colorMap = {
		reset : "\x1b[0m",
		dim : "\x1b[2m",

		frontBlack : "\x1b[30m",
		frontRed : "\x1b[31m",
		frontGreen : "\x1b[32m",
		frontYellow : "\x1b[33m",
		frontBlue : "\x1b[34m",
		frontMagenta : "\x1b[35m",
		frontCyan : "\x1b[36m",
		frontWhite : "\x1b[37m",

		backBlack : "\x1b[40m",
		backRed : "\x1b[41m",
		backGreen : "\x1b[42m",
		backYellow : "\x1b[43m",
		backBlue : "\x1b[44m",
		backMagenta : "\x1b[45m",
		backCyan : "\x1b[46m",
		backWhite : "\x1b[47m",
	}	
	return colorMap[color] || colorMap['reset'];
}

/**
	*
	*/
function successMessage(message){
	console.log(
		getColor('backCyan'), 
		getColor('frontBlack'), 
		'♫',
		getColor('backBlack')+
		getColor('frontCyan')+
		'►',
		message, 
		getColor('reset')
	);
}

function infoMessage(message){
	console.log(
		getColor('backGreen'), 
		getColor('frontBlack'), 
		'?',
		getColor('backBlack')+
		getColor('frontGreen')+
		'►',
		message, 
		getColor('reset')
	);
}

function warningMessage(message){
	console.log(
		getColor('backYellow'), 
		getColor('frontBlack'), 
		'!',
		getColor('backBlack')+
		getColor('frontYellow')+
		'►',
		message, 
		getColor('reset')
	);
}

function errorMessage(message, error){
	console.log(
		getColor('backRed'), 
		getColor('frontBlack'), 
		'‼',
		getColor('backBlack')+
		getColor('frontRed')+
		'►',
		message, 
		'\n',
		error.message,
		getColor('reset')
	);
}
 
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

	    	warningMessage(`${filePath} - file didn't written (check file permissions)`);
	    	reject();

		  }else{

			  let buffer = new Buffer(content);

			  fs.write(document, buffer, 0, buffer.length, null, function(error) {
			      if (error) {
				    	warningMessage(`${filePath} - file didn't written (check file permissions)`);
			      	resolve();
			      }

			      fs.close(document, function() {
			      	successMessage(`${filePath} - file written`)
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
			error ? errorMessage('there is no "_docs" folder, please add it to continue work', error) : resolve(true);
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
			error ? errorMessage('',error) : resolve(items);
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

				errorMessage('there is no "docs" folder, please add it to continue work', error);

				fs.mkdir(path, error => {
					error ? errorMessage('cant create "docs" directory', error) : resolve();
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
	
	let info = {
		succed: 0,
		failed: 0,
	};

	for (let htmlFilesName of htmlFilesNames) {

		let menu = generateMenu(htmlFilesNames, htmlFilesName);

		let filePath = `${resPath}/${htmlFilesName}`;
		let newFilePath = `${finalPath}/${htmlFilesName}`;

		let fileContent = await getFileContent(filePath);
		let newFileContent = await generateNewContent(menu, fileContent);

		await syncNewDirectory(finalPath);

		await saveFile(newFilePath, newFileContent)
			.then( _ => info.succed = ++info.succed )
			.catch( error => info.failed = ++info.failed );

	}

	return(info);
}

/**
	* @function
	* @name colldoc
	* @desc init function that generates menu in html files.
	* @author Ivan Kaduk
	* @licence MIT 2018
	*/
async function colldoc() {

	let filesNames = await isFolderExist(resPath) ?
		await getFilesNames(resPath) : [];

	let statistic = await generateFiles(filesNames);
  
  infoMessage(`Files: 
  	written - ${statistic.succed}, 
  	failed - ${statistic.failed}`);

}

colldoc();


