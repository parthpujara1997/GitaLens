
const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\pujar\\Desktop\\gitalens\\gitaData.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const targets = ['"id": "8-1"', '"id": "8-2"', '"id": "12-3"', '"id": "12-18"'];

targets.forEach(target => {
    lines.forEach((line, index) => {
        if (line.includes(target)) {
            console.log(`Found ${target} at line ${index + 1}`);
            // Print surrounding lines
            for (let i = index; i < index + 10; i++) {
                console.log(`${i + 1}: ${lines[i]}`);
            }
        }
    });
});
