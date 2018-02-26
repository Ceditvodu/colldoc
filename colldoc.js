'use strict!';
/**
	* @author Ivan Kaduk
	*/
const fs = require('fs');
const cheerio = require('cheerio');
const pathLib = require('path');
const rl = require('readline');

if (process.argv.length <= 2) {
  console.log("Usage: " + __filename + " path/to/directory");
  stop();
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
	* @function
	* @name successMessage
	* @desc shows succes message it looks like blue line with message and note 
	* on start.
	* @param {string} message - stringe that must be shown in cli as a success 
	* message.
	* @return {boolean} - flag that means that message was shown. 
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
	return true;
}

/**
	* @function
	* @name infoMessage
	* @desc shows some informational message it looks like green line with message.
	* @param {string} message - stringe that must be shown in cli as a info 
	* message.
	* @return {boolean} - flag that means that message was shown. 
	*/
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
  return true;
}

/**
	* @function
	* @name warningMessage
	* @desc shows some warning message it looks like yellow line with message.
	* @param {string} message - stringe that must be shown in cli as a warning 
	* message.
	* @return {boolean} - flag that means that message was shown. 
	*/
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
  return true;
}

/**
  * @function
  * @name errorMessage
  * @desc shows some error message it looks like red line with message.
  * Also it shows error message
  * @param {string} message - stringe that must be shown in cli as a error 
  * message.
  * @return {boolean} - flag that means that message was shown. 
  */
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
  * @function
  * @name errorMessage
  * @desc shows some error message it looks like red line with message.
  * Also it shows error message
  * @param {string} message - stringe that must be shown in cli as a error 
  * message.
  * @return {boolean} - flag that means that message was shown. 
  */
function confirmMessage(message) {

  let ask = rl.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  let styledMessage = '' +
    getColor('backMagenta') + '  ' + 
		getColor('frontBlack') + 
		'? ' +
		getColor('backBlack') +
		getColor('frontMagenta') +
		'► ' +
		message + 
		getColor('reset');
    
  return new Promise( (resolve, reject) => {
    ask.question(`${styledMessage} (y/n) \n`, answer => {
      answer === 'y' ?
        resolve() : reject();
      ask.close();
    });
  } );
}
 
/**
  * @function
  * @name stop
  * @desc Canceling application.
  */
function stop() {
  process.exit(-1);
}

/**
	* @name getFileContent
	* @desc read files content.
	* @param {string} filePath - adress of file thet need to read.
	* @return {string} - file content in string. 
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
  * @return {boolean} - flag that tells that file is saved.
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
			      	resolve(true);
			      }

			      fs.close(document, function() {
			      	successMessage(`${filePath} - file written`)
			      	resolve(true);
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
  * @return {boolean} - flag that means that folder exist.
	*/
function isFolderExist(folderPath){
	return new Promise( (resolve, reject) => {
		fs.access(folderPath, (error) => {
      error ? 
        errorMessage('there is no "_docs" folder, please add it to continue work', error) : 
        resolve(true);
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

/**
	* @function
	* @name generateNewContent
	* @desc generate html with addition container and side menu.
	* @param {string} menu - html menu according files that in folder.
	* @param {string} content - html file content.
	* @return {string} - new content with additional container and navigation.
	*/
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

/**
	* @function
	* @name syncNewDirectory
	* @desc Check if folder exist and if it not it will create it.
	* @param {string} path - expected new folder path.
	* @return {string} - flag that means that folder exist.
	*/
function syncNewDirectory(path){
	return new Promise( (resolve, reject) => {

		fs.access(path, error => {

			if (error) {

				errorMessage('there is no "docs" folder, please add it to continue work', error);

				fs.mkdir(path, error => {
					error ? errorMessage('cant create "docs" directory', error) : resolve(true);
				})

			}

			resolve(true);

		});

	} );
}

/**
	* @function
	* @name generateMenu
	* @desc Html menu generator according list of files and active item.
  * @param {array} filesNames - list of files names.
  * @param {string} activeItem - name of file which is currently open.
	* @return {string} - html menu.
	*/
function generateMenu(filesNames, activeItem){
	let menu = filesNames.reduce( ( a, b ) => {
			let active = activeItem === b ? 'active' : '';
			return `${a}<li class="${active}"><a href="${b}">${pathLib.parse(b).name}</a></li>`;
		}, '<nav class="menu"><ul>' ) + '</ul></nav>';
	return menu;
}

/**
	* @function
	* @name generateFiles
	* @desc Making actions from checking if all exist to generating and saving files.
  * @param {array} filesNames - list of files names.
  * @return {object} - json entity that contains information of how much files was written
  * and how much failed.
	*/
async function generateFiles (filesNames) {

	let htmlFilesNames = filesNames
  	.filter( fileName => pathLib.parse(fileName).ext === '.html' );
	
	let info = {
		succed: 0,
		failed: 0,
	};

	await syncNewDirectory(finalPath);

	resPath === finalPath && 
    await confirmMessage('Do you realy whant to rewrite init files?')
      .catch( e => stop() ); 

	for (let htmlFilesName of htmlFilesNames) {

		let menu = generateMenu(htmlFilesNames, htmlFilesName);

		let filePath = `${resPath}/${htmlFilesName}`;
		let newFilePath = `${finalPath}/${htmlFilesName}`;

		let fileContent = await getFileContent(filePath);
		let newFileContent = await generateNewContent(menu, fileContent);

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

    stop();
}

module.exports = colldoc; 
module.exports.getColor = getColor;
module.exports.successMessage = successMessage;