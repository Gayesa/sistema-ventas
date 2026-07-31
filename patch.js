const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.html')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const files = walkSync(path.join(__dirname, 'frontend/src/app'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace instances of `| currency }}` or `| currency }` or `| currency  }}`
  // with `| currency:'COP':'symbol':'1.0-0' }}`
  // Regex looks for `| currency` followed by spaces and a closing brace `}` or parenthesis `)` or bracket `]` or nothing but a space.
  // Actually, let's just find `| currency` not followed by `:`
  
  content = content.replace(/\|\s*currency(?!\s*:)/g, "| currency:'COP':'symbol':'1.0-0'");
  
  // Also we have some that already have `'USD'`, we can change them to `'COP'` and `'1.0-0'` if we want,
  // but let's change all `currency:'USD':'symbol':'1.0-0'` to `currency:'COP':'symbol':'1.0-0'`
  content = content.replace(/currency:'USD':'symbol':'1.0-0'/g, "currency:'COP':'symbol':'1.0-0'");
  // And `currency:'USD':'symbol':'1.2-2'` to `currency:'COP':'symbol':'1.0-0'`
  content = content.replace(/currency:'USD':'symbol':'1.2-2'/g, "currency:'COP':'symbol':'1.0-0'");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
