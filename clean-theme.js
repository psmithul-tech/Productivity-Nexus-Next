const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'app');

function cleanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      cleanDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Fix primary-fixed
      content = content.replace(/primary-fixed-dim/g, 'primary-dim');
      content = content.replace(/primary-fixed/g, 'primary');
      
      // Fix cyan shadows
      content = content.replace(/shadow-\[0_0_[0-9]+px_rgba\(0,240,255,0\.[0-9]+\)\]/g, 'shadow-sm');
      
      // Fix other dark background boxes
      content = content.replace(/bg-\[#161618\]/g, 'bg-surface-container');
      content = content.replace(/bg-\[#1b1b1d\]/g, 'bg-surface-variant');
      content = content.replace(/text-\[#b600f8\]/g, 'text-primary');
      content = content.replace(/border-t-\[#b600f8\]/g, 'border-t-primary');
      content = content.replace(/bg-\[#b600f8\]/g, 'bg-primary');
      
      // Remove glow-fx completely
      content = content.replace(/glow-fx/g, '');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

cleanDirectory(targetDir);
console.log("Cleanup complete!");
