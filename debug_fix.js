const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'gitaData.ts');

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const startMarker = 'export const GITA_VERSES: GitaVerse[] = [';
    const endMarker = '];';

    const startIndex = fileContent.indexOf(startMarker);
    const arrayStart = startIndex + startMarker.length - 1; // Include '['
    const arrayEnd = fileContent.lastIndexOf(endMarker) + 1; // Include ']'

    let jsonString = fileContent.substring(arrayStart, arrayEnd);

    console.log('Extracted length:', jsonString.length);
    console.log('Start:', jsonString.substring(0, 50));
    console.log('End:', jsonString.substring(jsonString.length - 50));

    // Check for trailing comma manual detection
    if (jsonString.match(/,\s*\]$/)) {
        console.log('Detected trailing comma.');
        jsonString = jsonString.replace(/,\s*\]$/, ']');
    } else {
        console.log('No trailing comma detected at end.');
    }

    // Try Parse
    JSON.parse(jsonString);
    console.log('JSON Parse SUCCESS!');

} catch (e) {
    console.error('Error:', e.message);
    // Find position of syntax error if possible
    if (e.message.includes('position')) {
        const match = e.message.match(/position (\d+)/);
        if (match) {
            const pos = parseInt(match[1]);
            // Show context
            // Safety check
            const safePos = Math.min(Math.max(0, pos), 2000000);
            // We can't access jsonString easily if it was in try block scope limitation?
            // Re-read or just catch in scope.
            // But jsonString is let defined inside try. 
            // Moving declaration up needed? No, catch block can't access `jsonString` if defined in try block.
            // But `jsonString` is defined in `try` scope.
            // Wait, this code is sloppy.
        }
    }
}
