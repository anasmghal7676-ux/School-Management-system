#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const apiDir = 'src/app/api';

// Find all proxy routes (those that re-export from another module)
function getExports(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const methods = [];
  for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
    if (content.includes(`export async function ${method}`) || 
        content.includes(`export function ${method}`) ||
        content.includes(`export { ${method}`) ||
        new RegExp(`export\\s+\\{[^}]*\\b${method}\\b[^}]*\\}`).test(content)) {
      methods.push(method);
    }
  }
  return methods;
}

let fixed = 0;

function fixProxyFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if this is a proxy file (simple re-export)
  const proxyMatch = content.match(/export\s+\{[^}]+\}\s+from\s+['"]([^'"]+)['"]/);
  if (!proxyMatch) return;
  
  const targetPath = path.resolve(path.dirname(filePath), proxyMatch[1]);
  const targetTs = targetPath.endsWith('.ts') ? targetPath : targetPath + '.ts';
  
  if (!fs.existsSync(targetTs)) return;
  
  const targetExports = getExports(targetTs);
  if (targetExports.length === 0) return;
  
  // Check what we're currently trying to export
  const currentExports = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].filter(m => content.includes(m));
  
  // Find exports that don't exist in target
  const badExports = currentExports.filter(m => !targetExports.includes(m));
  
  if (badExports.length === 0) return; // No fix needed
  
  // Rewrite the file with only valid exports
  const validExports = currentExports.filter(m => targetExports.includes(m));
  
  if (validExports.length === 0) {
    // No valid re-exports, replace with a GET-only stub that returns 405 for others
    const relPath = proxyMatch[1];
    const targetModule = path.dirname(filePath).split('/').pop();
    const newContent = `export const dynamic = 'force-dynamic';
// Proxy route — delegates to ${relPath}
export { ${targetExports.join(', ')} } from '${relPath}';
`;
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed (reduced exports): ${filePath} -> [${targetExports.join(',')}]`);
    fixed++;
    return;
  }
  
  // Rewrite with only valid exports
  const relPath = proxyMatch[1];
  const commentLine = content.match(/\/\/.*/) ? content.match(/\/.*/)[0] : '';
  const newContent = `export const dynamic = 'force-dynamic';
${commentLine}
export { ${validExports.join(', ')} } from '${relPath}';
`;
  fs.writeFileSync(filePath, newContent);
  console.log(`Fixed: ${filePath} removed [${badExports.join(',')}], kept [${validExports.join(',')}]`);
  fixed++;
}

// Walk all API routes
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full);
    } else if (entry.name === 'route.ts') {
      fixProxyFile(full);
    }
  }
}

walkDir(apiDir);
console.log(`\nTotal fixed: ${fixed}`);
