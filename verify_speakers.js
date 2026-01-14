const fs = require('fs');
const path = require('path');

function auditSpeakers() {
    const filePath = path.join('c:', 'Users', 'pujar', 'Desktop', 'gitalens', 'gitaData.ts');

    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error("Error reading file:", err);
        return;
    }

    // Extract the GITA_VERSES array content
    const match = content.match(/export const GITA_VERSES: GitaVerse\[\] = (\[[\s\S]*?\]);/);
    if (!match) {
        console.error("Could not find GITA_VERSES array in gitaData.ts");
        return;
    }

    let versesJson = match[1];

    // Clean up TS-isms (like trailing commas and potentially untyped objects)
    // This is a naive cleanup but might work for valid JSON-like structures
    let cleanedJson = versesJson
        .replace(/,\s*\]/g, ']')
        .replace(/,\s*\}/g, '}');

    let verses;
    try {
        verses = JSON.parse(cleanedJson);
    } catch (e) {
        console.error("Error parsing GITA_VERSES as JSON:", e.message);
        // If JSON.parse fails, it might be due to unquoted keys or other TS features
        // Let's try to eval it safely (since we know the file content is mostly static data)
        try {
            // Remove 'export const ...' and surrounding TS to make it valid JS
            verses = eval(`(${versesJson})`);
        } catch (e2) {
            console.error("Eval also failed:", e2.message);
            return;
        }
    }

    let activeSpeaker = "Dhritarashtra";
    const discrepancies = [];

    verses.forEach(v => {
        const text = v.text || '';
        const oldSpeaker = v.speaker || '';
        const sanskrit = v.sanskrit || '';

        let newSpeaker = null;
        if (text.includes("Dhritarashtra said:")) {
            newSpeaker = "Dhritarashtra";
        } else if (text.includes("Sanjaya said:")) {
            newSpeaker = "Sanjaya";
        } else if (text.includes("Arjuna said:")) {
            newSpeaker = "Arjuna";
        } else if (text.includes("The Blessed Lord said:")) {
            newSpeaker = "Krishna";
        } else if (sanskrit.includes("श्री भगवानुवाच")) { // Shri Bhagavan uvaca in Sanskrit
            newSpeaker = "Krishna";
        } else if (sanskrit.includes("सञ्जय उवाच")) {
            newSpeaker = "Sanjaya";
        } else if (sanskrit.includes("अर्जुन उवाच")) {
            newSpeaker = "Arjuna";
        } else if (sanskrit.includes("धृतराष्ट्र उवाच")) {
            newSpeaker = "Dhritarashtra";
        }

        // Special case for 1.25 as discussed
        if (v.id === "1-25") {
            newSpeaker = "Krishna";
        }

        if (new_speaker = newSpeaker) {
            activeSpeaker = new_speaker;
        }

        if (oldSpeaker !== activeSpeaker) {
            discrepancies.push({
                id: v.id,
                text_preview: text.substring(0, 100),
                old_speaker: oldSpeaker,
                new_speaker: activeSpeaker
            });
        }
    });

    console.log(`Found ${discrepancies.length} discrepancies.`);
    discrepancies.forEach(d => {
        console.log(`Verse ${d.id}: '${d.old_speaker}' -> '${d.new_speaker}'`);
        // console.log(`  Snippet: ${d.text_preview}...`);
    });
}

auditSpeakers();
