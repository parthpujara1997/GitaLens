const fs = require('fs');

const filePath = 'c:\\Users\\pujar\\Desktop\\gitalens\\gitaData.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let currentId = null;
let currentText = "";
let currentSpeakerAttr = "";
let currentSanskrit = "";
let activeSpeaker = "Dhritarashtra";
let discrepancies = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const idMatch = line.match(/"id":\s*"([^"]+)"/);
    if (idMatch) {
        // Evaluate previous verse before starting new one
        if (currentId) {
            checkAndFlag();
        }
        currentId = idMatch[1];
        currentText = "";
        currentSpeakerAttr = "";
        currentSanskrit = "";
    }

    const textMatch = line.match(/"text":\s*"([^"]+)"/);
    if (textMatch) currentText = textMatch[1];

    const speakerMatch = line.match(/"speaker":\s*"([^"]+)"/);
    if (speakerMatch) currentSpeakerAttr = speakerMatch[1];

    const sanskritMatch = line.match(/"sanskrit":\s*"([^"]+)"/);
    if (sanskritMatch) currentSanskrit = sanskritMatch[1];
}

// Check the last one
if (currentId) checkAndFlag();

function checkAndFlag() {
    let newSpeaker = null;

    // Check text for speaker transitions
    if (currentText.includes("Dhritarashtra said:")) newSpeaker = "Dhritarashtra";
    else if (currentText.includes("Sanjaya said:")) newSpeaker = "Sanjaya";
    else if (currentText.includes("Arjuna said:")) newSpeaker = "Arjuna";
    else if (currentText.includes("The Blessed Lord said:") || currentText.includes("The Supreme Lord said:")) newSpeaker = "Krishna";

    // Check sanskrit for transitions
    if (currentSanskrit.includes("धृतराष्ट्र उवाच")) newSpeaker = "Dhritarashtra";
    else if (currentSanskrit.includes("सञ्जय उवाच")) newSpeaker = "Sanjaya";
    else if (currentSanskrit.includes("अर्जुन उवाच")) newSpeaker = "Arjuna";
    else if (currentSanskrit.includes("श्री भगवानुवाच")) newSpeaker = "Krishna";

    // 1-25 Special case (Hrishikesha said -> Krishna)
    if (currentId === "1-25") newSpeaker = "Krishna";

    if (newSpeaker) {
        activeSpeaker = newSpeaker;
    }

    if (currentSpeakerAttr !== activeSpeaker) {
        discrepancies.push({
            id: currentId,
            old: currentSpeakerAttr,
            expected: activeSpeaker,
            text: currentText.substring(0, 50)
        });
    }
}

console.log(`Found ${discrepancies.length} discrepancies.`);
discrepancies.forEach(d => {
    console.log(`${d.id}: ${d.old} -> ${d.expected} | ${d.text}...`);
});
