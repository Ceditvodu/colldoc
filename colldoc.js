'use strict!';
/**
  * @author Ivan Kaduk
  * @todo
  * - order functional
  * - make constants for messages
  * - order functions according calls 
  */

if (process.argv.length <= 2) {
  console.log("Usage: " + __filename + " path/to/directory");
  stop();
} else if (process.argv[2] === "--help" || process.argv[2] === "-h"){
  console.log(
    '\nUsage: colldoc parent_folder_path [source_folder] [result_folder] \n',
    'Generat documentation from html files \n\n',
    '-h, --help - show comands description \n',
  );
  stop();
}

const fs = require('fs');
const cheerio = require('cheerio');
const pathLib = require('path');
const rl = require('readline');
const path = process.argv[2];

const constants = require('./constants');
const CHECK_PERMISSION_ERROR = constants.CHECK_PERMISSION_ERROR;
const FILE_WRITTEN = constants.FILE_WRITTEN;
const WAS_NOT_FOUND_ERROR = constants.WAS_NOT_FOUND_ERROR; 
const CANT_CREATE_ERROR = constants.CANT_CREATE_ERROR; 
const REWRITE_INSURE = constants.REWRITE_INSURE; 
const CONFIRM_INIT_TEXT = constants.CONFIRM_INIT_TEXT; 
const NO_FILES_ERROR = constants.NO_FILES_ERROR;

const FINAL_FOLDER_SUFIX = constants.FINAL_FOLDER_SUFIX; 
const FINAL_FOLDER = constants.FINAL_FOLDER; 
const RESOURCE_FOLDER = constants.RESOURCE_FOLDER; 

/**
  * @class
  * @description helper class that represent statistic information.
  * @param {number} succed - count of completed items.
  * @param {number} failed - count of failed items.
  */
class Statistic {
  constructor(succed, failed) {
    this.succed = succed || 0;
    this.failed = failed || 0;
  }
}

/**
  * @function
  * @name getColor
  * @description filling some colors to comand line
  * @param {string} color - name of color that it hase next syntacs:
  * {font|back}{colorName}
  * @returns {string} - color code copitable with comande line.
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
  * @description shows succes message it looks like blue line with message and 
  * note on start.
  * @param {string} message - stringe that must be shown in cli as a success 
  * message.
  * @returns {boolean} - flag that means that message was shown. 
  */
function successMessage(message = ''){
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
  * @description shows some informational message it looks like green line with 
  * message.
  * @param {string} message - stringe that must be shown in cli as a info 
  * message.
  * @returns {boolean} - flag that means that message was shown. 
  */
function infoMessage(message = ''){
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
  * @description shows some warning message it looks like yellow line with 
  * message.
  * @param {string} message - stringe that must be shown in cli as a warning 
  * message.
  * @returns {boolean} - flag that means that message was shown. 
  */
function warningMessage(message = ''){
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
  * @description shows some error message it looks like red line with message.
  * Also it shows error message
  * @param {string} message - stringe that must be shown in cli as a error 
  * message.
  * @returns {boolean} - flag that means that message was shown. 
  */
function errorMessage(message = '', error){
  let errorMessage = error ? error.message : '';

  console.log(
    getColor('backRed'), 
    getColor('frontBlack'), 
    '‼',
    getColor('backBlack')+
    getColor('frontRed')+
    '►',
    message, 
    '\n',
    errorMessage,
    getColor('reset')
  );
}

/**
  * @function
  * @name confirmMessage
  * @description shows some prompt it looks like magenta line with message and 
  * (y/n) dialog, that allows you to choose are you agree with action or not.
  * @param {string} message - stringe that must be shown in cli as a confirm 
  * message.
  * @returns {boolean} - flag that means that message was shown. 
  */
function confirmMessage(message = CONFIRM_INIT_TEXT) {

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
      (answer === 'y') || (answer ===  'yes') ?
        resolve(true) : reject();
      ask.close();
    });
  } );
}
 
/**
  * @function
  * @name stop
  * @description Canceling application.
  */
function stop() {
  process.exit(-1);
}

/** 
  * @function
  * @name getResourcePath
  * @description gets second or third parameter from process as 
  * resource path.
  * @returns {string} - path to resource files.
  */
function getResourcePath() {
  return (process.argv.length >= 4) ?
    process.argv[3] :
    RESOURCE_FOLDER;
}

/** 
 * @function
 * @name getFinalPath
 * @description gets fours parameter from process as final path.
 * @returns {string} - path to result files.
 */
function getFinalPath() {
  if (process.argv.length === 4) {
    
    return process.argv[3] + FINAL_FOLDER_SUFIX;
    
  } else if (process.argv.length > 4) {
    
    return process.argv[4];
    
  } else {

    return FINAL_FOLDER;

  }
}

/**
  * @name getFileContent
  * @description read files content.
  * @param {string} filePath - adress of file thet need to read.
  * @returns {string} - file content in string. 
  */
function getFileContent (filePath) {
  return filePath && new Promise( (resolve,reject) => {
    fs.readFile(filePath, 'utf8', function(error, response) {
      error ? reject( NO_FILES_ERROR + error ) : resolve(response);
    })
  } );
}

/**
  * @name saveFile
  * @description save content to file, or update it, or create new file.
  * @param {string} filePath - adress of file in what must be saved content.
  * @param {string} content - content that must be writen in file.
  * @returns {boolean} - flag that tells that file is saved.
  */
function saveFile (filePath, content = '') {

  return filePath && new Promise( (resolve, reject) => {

    fs.open(filePath, 'w+', function(error, document) {
      if (error){

        warningMessage(`${filePath} - ${CHECK_PERMISSION_ERROR}`);
        reject();

      }else{

        let buffer = new Buffer(content);
        fs.write(document, buffer, 0, buffer.length, null, function(error) {
          if (error) {
            warningMessage(`${filePath} - `);
            resolve(true);
          }
          fs.close(document, function() {
            successMessage(`${filePath} - ${FILE_WRITTEN}`)
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
  * @returns {boolean} - flag that means that folder exist.
  */
function isFolderExist(folderPath){
  return folderPath && new Promise( (resolve, reject) => {
    fs.access(folderPath, (error) => {
      error ? 
        errorMessage(`"${folderPath}" ${WAS_NOT_FOUND_ERROR}`, error) : 
        resolve(true);
    });
  } );
}

/**
  * @function
  * @name getFilesNames
  * @description get list of files from folder.
  * @param {string} path - folder path that contain files.
  * @returns {array} - list of files names.
  */
function getFilesNames(path){
  return path && new Promise( (resolve, reject) => {
    fs.readdir(path, function(error, items) {
      error ? errorMessage('',error) : resolve(items);
    });
  } );
} 

/**
  * @function
  * @name generateNewContent
  * @description generate html with addition container and side menu.
  * @param {string} menu - html menu according files that in folder.
  * @param {string} content - html file content.
  * @returns {string} - new content with additional container and navigation.
  */
function generateNewContent(menu = '', content = ''){

  return new Promise( (resolve, reject) => {
    
    let $ = cheerio.load(content);

    let body = $('body').html();
    $('body').children().remove();

    let columns = `
      <aside class="menu"></aside>
      <section class="content"></section>
    `;

    $('body').append(columns.trim());
    $('.menu').append(menu.trim());
    $('.content').append(body.trim());

    resolve($.html());

  } );

}

/**
  * @function
  * @name syncNewDirectory
  * @description Check if folder exist and if it not it will create it.
  * @param {string} path - expected new folder path.
  * @returns {boolean} - flag that means that folder exist.
  */
function syncNewDirectory(path){
  return path && new Promise( (resolve, reject) => {
    fs.access(path, error => {
      if (error) {
        
        fs.mkdir(path, error => {
          
          error ? 
          errorMessage(`"${path}" ${CANT_CREATE_ERROR}`, error) : 
          resolve(true);
          
        })
        
        errorMessage(`"${path}" ${WAS_NOT_FOUND_ERROR}`, error);
      }

      resolve(true);

    });
  } );
}

/**
  * @function
  * @name generateMenu
  * @description Html menu generator according list of files and active item.
  * @param {array} filesNames - list of files names.
  * @param {string} activeItem - name of file which is currently open.
  * @returns {string} - html menu.
  */
function generateMenu(filesNames = [], activeItem = ''){
  let menu = filesNames.reduce( ( a, b ) => {
    
      let active = activeItem === b ? 'active' : '';
      
      return `${a} <li class="${active}">
        <a href="${b}">
          ${pathLib.parse(b).name}
        </a>
      </li>`;

    }, '<nav class="menu"><ul>' ) + '</ul></nav>';
  return menu;
}

/**
  * @function
  * @name generateFiles
  * @description Making actions from checking if all exist to generating and 
  * saving files.
  * @param {array} filesNames - list of files names.
  * @returns {Statistic} - json entity that contains information of how much files was written
  * and how much failed.
  */
async function generateFiles(filesNames = [], resPath, finalPath) {

  let htmlFilesNames = filesNames
    .filter( fileName => pathLib.parse(fileName).ext === '.html' );
  
  let info = new Statistic();

  resPath === finalPath && 
    await confirmMessage(REWRITE_INSURE_TEXT)
      .catch( e => stop() ); 

  await syncNewDirectory(finalPath);

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
  * @description init function that generates menu in html files.
  * @author Ivan Kaduk
  * @licence MIT 2018
  */
async function colldoc() {

  let resPath = getResourcePath();
  let finalPath = getFinalPath();

  let filesNames = await isFolderExist(resPath) ?
    await getFilesNames(resPath) : [];

  let statistic = await generateFiles(filesNames, resPath, finalPath);
  
  infoMessage(`Files: 
    written - ${statistic.succed}, 
    failed - ${statistic.failed}`);

    stop();
}

module.exports = colldoc; 
module.exports.getColor = getColor;
module.exports.successMessage = successMessage;
module.exports.getFileContent = getFileContent;
module.exports.saveFile = saveFile;