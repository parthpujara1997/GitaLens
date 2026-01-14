const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'gitaData.ts');

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const startMarker = 'export const GITA_VERSES: GitaVerse[] = [';
    const endMarker = '];';

    const startIndex = fileContent.indexOf(startMarker);
    if (startIndex === -1) {
        console.log('Start marker NOT found');
        process.exit(1);
    }

    // Check what we are finding
    console.log('Found start at:', startIndex);

    const arrayStart = startIndex + startMarker.length - 1;

    // Print 100 chars around arrayStart
    const context = fileContent.substring(arrayStart - 20, arrayStart + 50);
    console.log('Context around start:');
    console.log(context);
    console.log('---');

    // Extract actual string
    const arrayEnd = fileContent.lastIndexOf(endMarker) + 1;
    const jsonString = fileContent.substring(arrayStart, arrayEnd);

    console.log('Extracted Start:', jsonString.substring(0, 50));
    console.log('Extracted End:', jsonString.substring(jsonString.length - 50));

    // Check if eval works on first few items
    // Construct a small array
    const smallPart = jsonString.substring(0, 500) + ' }]'; // Hacky
    // console.log('Eval test on small part:', eval(smallPart)); -- Just log string

} catch (e) {
    console.error(e);
}
