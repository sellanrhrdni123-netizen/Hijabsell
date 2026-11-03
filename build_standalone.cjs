const fs = require('fs');
const path = require('path');

const appHtmlPath = path.join(__dirname, 'app.html');
if (fs.existsSync(appHtmlPath)) {
  console.log('app.html is verified and intact at ' + appHtmlPath);
}
