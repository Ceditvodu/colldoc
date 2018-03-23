'use strict!';
/**
  * @author Ivan Kaduk
  * @todo
  * - make ability to add this title as a file header as param
  * - add minify functional as param
  */

const fs = require('fs');
const cheerio = require('cheerio');
const pathLib = require('path');

const { 
  confirmMessage,
  errorMessage,
  infoMessage,
  successMessage,
  warningMessage,
} = require('./interface');

const constants = require('./constants');
const CHECK_PERMISSION_ERROR = constants.CHECK_PERMISSION_ERROR;
const FILE_WRITTEN = constants.FILE_WRITTEN;
const WAS_NOT_FOUND_ERROR = constants.WAS_NOT_FOUND_ERROR; 
const CANT_CREATE_ERROR = constants.CANT_CREATE_ERROR; 
const REWRITE_INSURE = constants.REWRITE_INSURE; 
const CONFIRM_INIT_TEXT = constants.CONFIRM_INIT_TEXT; 
const NO_FILES_ERROR = constants.NO_FILES_ERROR;

const FINAL_FOLDER = constants.FINAL_FOLDER; 
const RESOURCE_FOLDER = constants.RESOURCE_FOLDER; 

/**
  * @function
  * @name stop
  * @description Canceling application.
  */
function stop() {
  process.exit(-1);
}

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
  * @name delegateParams
  * @param {array} arguments - array of arguments from app process.
  * @description helps in work with app arguments.
  */
function delegateParams(arguments = []) {
  let actionMap = [];
  let params = arguments.filter( argument => {
    return argument[0] == '-';
  } );

  params.forEach(param => {
    switch(param){
      case '-h':
      case '--help': 
        !actionMap.includes('help') && actionMap.push('help');
      case '-t':
      case '--title':
        !actionMap.includes('title') && actionMap.push('title');
      case '-c':
      case '--compress':
        !actionMap.includes('compress') && actionMap.push('compress');
    }
  });

  return actionName => {
    return actionMap.includes(actionName); 
  };
}

/**
  * @function
  * @name help 
  * @description shows apps interface reference.
  */
function help() {
  console.log(
    '\nUsage: colldoc [source_folder] [result_folder] \n',
    'Generat documentation from html files \n\n',
    '-h, --help - show comands description \n',
  );
  stop();
}

/** 
  * @function
  * @name getPathes
  * @description help to get pathes from init process or set default.
  * @param {array} arguments - array with all proccess arguments. 
  * @returns {string} - path to resource files.
  */
function getPathes(arguments = []) {
  let params = arguments.filter(argument => {
    return argument[0] !== '-';
  });

  let pathes = params.splice(2,params.length - 2);

  return {
    resource: _ => {
      return pathes[0] ? pathes[0] : RESOURCE_FOLDER;
    },
    final: _ => {
      return pathes[1] ? pathes[1] : FINAL_FOLDER;
    }
  }
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
function getFilesNames(path) {
  return path && new Promise((resolve, reject) => {
    fs.readdir(path, function (error, items) {
      error ? errorMessage('', error) : resolve(items);
    });
  });
} 

/**
  * @function
  * @name syncNewDirectory
  * @description Check if folder exist and if it not it will create it.
  * @param {string} path - expected new folder path.
  * @returns {boolean} - flag that means that folder exist.
  */
function syncNewDirectory(path) {
  return path && new Promise((resolve, reject) => {
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
  });
}

/**
  * @function
  * @name orderFilesNames
  * @description Sort files in way that letters will be first.
  * @param {array} filesNames - list of files names.
  * @returns {array} - files names with new order.
  */
function orderFilesNames(filesNames) {
  let orderedFilesNames = filesNames.slice().sort( function (a, b) { 
    for (index in a) {
      let first = a[index];
      let second = b[index] || '';

      if (isNaN(first) !== isNaN(second)) {
        if (isNaN(first) === false) {
          return -1;
        } 
        return 1;
      }

      if ((second === '_') || (first < second)) {
        return -1;
      } else if ((first === '_') || (first > second)) {
        return 1;
      }

      return 0;
    }
  });
  return orderedFilesNames
}

/**
  * @function
  * @name generateMenu
  * @description Html menu generator according list of files and active item.
  * @param {array} filesNames - list of files names.
  * @param {string} activeItem - name of file which is currently open.
  * @returns {string} - html menu.
  */
function generateMenu(filesNames = [], activeItem = '') {
  
  let orderedFilesNames = orderFilesNames(filesNames);
  
  let menu = orderedFilesNames.reduce((a, b) => {

    let active = activeItem === b ? 'active' : '';

    return `${a} <li class="${active}">
        <a href="${b}">
          ${pathLib.parse(b).name}
        </a>
      </li>`;

  }, '<nav class="menu"><ul>') + '</ul></nav>';
  return menu;
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
  * @function
  * @name generateNewContent
  * @description generate html with addition container and side menu.
  * @param {string} menu - html menu according files that in folder.
  * @param {string} content - html file content.
  * @returns {string} - new content with additional container and navigation.
  */
function generateNewContent(menu = '', fileName = '', content = '') {

  return new Promise((resolve, reject) => {

    let $ = cheerio.load(content);

    let body = $('body').html();
    let columns = `
      <aside class="menu"></aside>
      <section class="content"></section>
    `;
    let titleText = pathLib.basename(fileName, '.html');
    let title = `
      <tite>${titleText}</tite>
    `;

    let $body = $('body'); 
    let $title = $('title');
    let $head = $('head');

    $body.text('');

    $body.append(columns.trim());
    $title.html() ? 
      $title.text(titleText) :
      $head.append(title);

    $('.menu').append(menu.trim());
    $('.content').append(body.trim());

    resolve($.html());

  });

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
  * @name generateFiles
  * @description Making actions from checking if all exist to generating and 
  * saving files.
  * @param {array} filesNames - list of files names.
  * @returns {Statistic} - json entity that contains information of how much 
  * files was written and how much failed.
  */
async function generateFiles(filesNames = [], resPath, finalPath) {

  let htmlFilesNames = filesNames
    .filter( fileName => pathLib.parse(fileName).ext === '.html' );
  
  let info = new Statistic();

  resPath === finalPath && 
    await confirmMessage(REWRITE_INSURE)
      .catch( e => stop() ); 

  await syncNewDirectory(finalPath);

  for (let fileName of htmlFilesNames) {

    let menu = generateMenu(htmlFilesNames, fileName);

    let filePath = `${resPath}/${fileName}`;
    let newFilePath = `${finalPath}/${fileName}`;

    let fileContent = await getFileContent(filePath);
    let newFileContent = await generateNewContent(menu, fileName, fileContent);

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
  */
async function colldoc() {

  const isNeedTo = delegateParams(process.argv);

  if (isNeedTo('help')) help();

  let pathes = getPathes(process.argv);
  let resPath = pathes.resource();
  let finalPath = pathes.final();

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