const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'gitaData.ts');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let currentChapter = 0;
    let currentVerse = 0;
    let currentText = '';
    let currentSpeaker = '';
    let currentId = '';

    // We will parse line by line to extract objects roughly
    // This is a heuristic parser for the specific format of gitaData.ts

    console.log('Starting Audit...');
    console.log('Format: [ID] | Expected (Text Marker) | Found (Attribute) | Match?');
    console.log('----------------------------------------------------------------');

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
            inVerseObject = false;
            // End of object, analyze
            if (currentId) {
                analyzeVerse(currentId, currentText, currentSpeaker);
            }
            continue;
        }

        if (!inVerseObject) continue;

        if (line.startsWith('"id":')) {
            currentId = line.match(/"id": "(.*)"/)[1];
        }
        if (line.startsWith('"text":')) {
            // regex to capture content inside strictly
            // Warning: text might span multiple lines if json was formatted differently, 
            // but here it seems one line per field based on previous `view_file`.
            const match = line.match(/"text": "(.*)"/);
            if (match) currentText = match[1];
        }
        if (line.startsWith('"speaker":')) {
            const match = line.match(/"speaker": "(.*)"/);
            if (match) currentSpeaker = match[1];
        }
    }

    function analyzeVerse(id, text, speakerAttr) {
        let textSpeaker = null;

        // Explicit markers
        if (text.includes('Dhritarashtra said:')) textSpeaker = 'Dhritarashtra';
        else if (text.includes('Sanjaya said:')) textSpeaker = 'Sanjaya';
        else if (text.includes('Arjuna said:')) textSpeaker = 'Arjuna';
        else if (text.includes('The Blessed Lord said:')) textSpeaker = 'Krishna';

        // Update inferred speaker only if there's an explicit change
        if (textSpeaker) {
            inferredSpeaker = textSpeaker;
        }

        // Check for mismatch
        // We compare the attribute `speakerAttr` with `inferredSpeaker`

        // Special Handling for Chapter 1 Duryodhana
        // In Ch 1, Sanjaya narrates what Duryodhana says. 
        // e.g., 1.3 "Behold..." - text doesn't say "Duryodhana said". 
        // Logic: 1.2 says "Duryodhana ... spoke these words". 
        // If we want to be strict, we might need manual overrides or smarter logic.
        // For now, let's just log mismatches between `inferredSpeaker` and `speakerAttr`.

        if (speakerAttr !== inferredSpeaker) {
            console.log(`${id.padEnd(6)} | ${inferredSpeaker.padEnd(15)} | ${speakerAttr.padEnd(15)} | MISMATCH`);
            // Also check if text implies a speaker change that we missed (e.g. implied context)
            if (text.includes('said:')) {
                // console.log(`      ^^ Text contains 'said:', might be a transition: "${text.substring(0, 50)}..."`);
            }
        }
    }

} catch (err) {
    console.error('Error reading file:', err);
}
