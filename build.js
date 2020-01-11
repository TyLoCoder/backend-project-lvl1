console.log('> Sarmat Control\'s backend');
console.log('-> Checking dir...');

const pah = require('path');

path.exists('data', exists => {
  if(exists) console.log('--> Data directory founded');
  else console.log('--> Data directory not founded!');
});

path.exists('server.js', exists => {
  if(exists) console.log('--> server.js file founded');
  else console.log('--> server.js not founded');
});

console.log('---> Finished');
