const fs = require('fs');

const content = fs.readFileSync('./gitaData.ts', 'utf8');
const lines = content.split('\n');

let inVerse = false;
let verseBuffer = [];
let currentId = '';

for (const line of lines) {
    if (line.includes('"id": "11-55"')) {
        inVerse = true;
        console.log("FOUND 11-55");
    }

    if (inVerse) {
        verseBuffer.push(line);
        if (line.includes('},')) {
            console.log(verseBuffer.join('\n'));
            process.exit(0);
        }
    }
}
