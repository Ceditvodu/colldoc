const rl = require('readline');

/**
  * @function
  * @name getColor
  * @description filling some colors to comand line
  * @param {string} color - name of color that it hase next syntacs:
  * {font|back}{colorName}
  * @returns {string} - color code copitable with comande line.
  */
function getColor (color) {
  let colorMap = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",

    frontBlack: "\x1b[30m",
    frontRed: "\x1b[31m",
    frontGreen: "\x1b[32m",
    frontYellow: "\x1b[33m",
    frontBlue: "\x1b[34m",
    frontMagenta: "\x1b[35m",
    frontCyan: "\x1b[36m",
    frontWhite: "\x1b[37m",

    backBlack: "\x1b[40m",
    backRed: "\x1b[41m",
    backGreen: "\x1b[42m",
    backYellow: "\x1b[43m",
    backBlue: "\x1b[44m",
    backMagenta: "\x1b[45m",
    backCyan: "\x1b[46m",
    backWhite: "\x1b[47m",
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
function successMessage (message = '') {
  console.log(
    getColor('backCyan'),
    getColor('frontBlack'),
    '♫',
    getColor('backBlack') +
    getColor('frontCyan') +
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
function infoMessage (message = '') {
  console.log(
    getColor('backGreen'),
    getColor('frontBlack'),
    '?',
    getColor('backBlack') +
    getColor('frontGreen') +
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
function warningMessage (message = '') {
  console.log(
    getColor('backYellow'),
    getColor('frontBlack'),
    '!',
    getColor('backBlack') +
    getColor('frontYellow') +
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
function errorMessage (message = '', error) {
  let errorMessage = error ? error.message : '';

  console.log(
    getColor('backRed'),
    getColor('frontBlack'),
    '‼',
    getColor('backBlack') +
    getColor('frontRed') +
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
function confirmMessage (message = CONFIRM_INIT_TEXT) {

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

  return new Promise((resolve, reject) => {
    ask.question(`${styledMessage} (y/n) \n`, answer => {
      (answer === 'y') || (answer === 'yes') ?
        resolve(true) : reject();
      ask.close();
    });
  });
}

module.exports = {
  getColor,
  confirmMessage,
  errorMessage,
  infoMessage,
  successMessage,
  warningMessage,
};