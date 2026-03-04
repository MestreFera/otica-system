/**
 * fix_json.cjs - Fix the novo_fluxo.json by removing placeholder header lines
 * and outputting valid JSON to novo_fluxo_clean.json
 */
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'novo_fluxo.json');
const outputFile = path.join(__dirname, 'novo_fluxo_clean.json');

console.log('Reading:', inputFile);
const raw = fs.readFileSync(inputFile, 'utf8');

// The file has this structure:
// Line 1: {
// Line 2:     // Mestre, cole todo aquele código gigante do n8n aqui dentro!
// Line 3:     // Substitua tudo isso pelo JSON do seu fluxo.
// Line 4: }{
// Line 5+: actual JSON content starting with "nodes": [
// We need to extract from line 5 onwards and wrap in { }

const lines = raw.split(/\r?\n/);
console.log('Total lines:', lines.length);
console.log('First 5 lines:');
for (let i = 0; i < 5 && i < lines.length; i++) {
    console.log(`  [${i}]: ${lines[i].substring(0, 80)}`);
}

// Find the line that starts the actual JSON content (starts with "nodes")
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('"nodes"')) {
        startIdx = i;
        break;
    }
}

if (startIdx === -1) {
    console.error('Could not find "nodes" key in the JSON!');
    process.exit(1);
}

console.log('Found "nodes" at line index:', startIdx);

// Build the clean JSON: wrap the content from startIdx to end in { }
const cleanLines = ['{', ...lines.slice(startIdx)];
const cleanText = cleanLines.join('\n');

// Try to parse to validate
try {
    const parsed = JSON.parse(cleanText);
    const pretty = JSON.stringify(parsed, null, 2);
    fs.writeFileSync(outputFile, pretty, 'utf8');
    console.log('SUCCESS! Valid JSON written to:', outputFile);
    console.log('Nodes count:', parsed.nodes ? parsed.nodes.length : 'N/A');
    console.log('File size:', pretty.length, 'bytes');
} catch (e) {
    console.error('JSON parse error:', e.message);
    // Save the raw cleaned version anyway for debugging
    fs.writeFileSync(outputFile + '.debug.txt', cleanText, 'utf8');
    console.error('Debug file saved to:', outputFile + '.debug.txt');
    process.exit(1);
}
