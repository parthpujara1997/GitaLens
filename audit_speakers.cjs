const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'gitaData.ts');
const outPath = path.join(__dirname, 'audit_results.txt');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Clear/Create file
    fs.writeFileSync(outPath, '', 'utf8');

    function log(msg) {
        fs.appendFileSync(outPath, msg + '\n', 'utf8');
    }

    let currentId = '';
    let currentText = '';
    let currentSpeaker = '';

    log('Starting Audit...');
    log('Format: [ID]   | Expected (Text)   | Found (Attr)      | Status');
    log('----------------------------------------------------------------');

    let inferredSpeaker = 'Sanjaya'; // Default start
    let inVerseObject = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('{')) {
            inVerseObject = true;
            currentText = '';
            currentSpeaker = '';
            currentId = '';
            continue;
        }

        if (line.startsWith('}')) {
            if (inVerseObject && currentId) {
                analyzeVerse(currentId, currentText, currentSpeaker);
            }
            inVerseObject = false;
            continue;
        }

        if (!inVerseObject) continue;

        if (line.startsWith('"id":')) {
            const m = line.match(/"id":\s*"(.*?)"/);
            if (m) currentId = m[1];
        }
        else if (line.startsWith('"text":')) {
            const m = line.match(/"text":\s*"(.*?)"/);
            if (m) currentText = m[1];
        }
        else if (line.startsWith('"speaker":')) {
            const m = line.match(/"speaker":\s*"(.*?)"/);
            if (m) currentSpeaker = m[1];
        }
    }

    function analyzeVerse(id, text, speakerAttr) {
        let textSpeaker = null;

        if (text.includes('Dhritarashtra said:')) textSpeaker = 'Dhritarashtra';
        else if (text.includes('Sanjaya said:')) textSpeaker = 'Sanjaya';
        else if (text.includes('Arjuna said:')) textSpeaker = 'Arjuna';
        else if (text.includes('The Blessed Lord said:')) textSpeaker = 'Krishna';

        if (textSpeaker) {
            inferredSpeaker = textSpeaker;
        }

        if (speakerAttr !== inferredSpeaker) {
            log(`${id.padEnd(8)} | ${inferredSpeaker.padEnd(17)} | ${speakerAttr.padEnd(17)} | MISMATCH`);
        }
    }

} catch (err) {
    fs.appendFileSync(outPath, 'Error: ' + err, 'utf8');
}
