const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'gitaData.ts');

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Extract the JSON array part
    const startMarker = 'export const GITA_VERSES: GitaVerse[] = [';
    const endMarker = '];';

    const startIndex = fileContent.indexOf(startMarker);
    if (startIndex === -1) throw new Error('Start marker not found');

    const arrayStart = startIndex + startMarker.length - 1; // Include '['

    // Find the first '];' AFTER the start
    // This assumes '];' does not appear inside the verse strings.
    const arrayEndIndex = fileContent.indexOf(endMarker, startIndex);
    if (arrayEndIndex === -1) throw new Error('End marker not found');

    const arrayEnd = arrayEndIndex + 1; // Include ']'

    // Check captured string
    const jsonString = fileContent.substring(arrayStart, arrayEnd);

    console.log('Evaluating string length:', jsonString.length);
    // console.log('End Check:', jsonString.substring(jsonString.length - 20));

    let verses;
    try {
        verses = eval(jsonString);
    } catch (e) {
        console.error('Eval failed:', e.message);
        throw e;
    }

    console.log(`Loaded ${verses.length} verses.`);

    // --- PART 1: SPEAKER CORRECTIONS ---

    const updateSpeaker = (chapter, startVerse, endVerse, newSpeaker) => {
        let count = 0;
        for (let i = startVerse; i <= endVerse; i++) {
            const id = `${chapter}-${i}`;
            const v = verses.find(v => v.id === id);
            if (v) {
                v.speaker = newSpeaker;
                count++;
            }
        }
        console.log(`Updated Ch ${chapter} (${startVerse}-${endVerse}): ${count} verses to ${newSpeaker}`);
    };

    updateSpeaker(1, 28, 46, "Arjuna");
    updateSpeaker(2, 5, 8, "Arjuna");
    updateSpeaker(2, 54, 54, "Arjuna");
    updateSpeaker(3, 36, 36, "Arjuna");
    updateSpeaker(4, 4, 4, "Arjuna");
    updateSpeaker(6, 34, 34, "Arjuna");
    updateSpeaker(6, 37, 39, "Arjuna");
    updateSpeaker(10, 12, 18, "Arjuna");
    updateSpeaker(11, 2, 4, "Arjuna");
    updateSpeaker(11, 9, 14, "Sanjaya");
    updateSpeaker(11, 15, 31, "Arjuna");
    updateSpeaker(11, 35, 35, "Sanjaya");
    updateSpeaker(11, 36, 46, "Arjuna");
    updateSpeaker(11, 50, 50, "Sanjaya");
    updateSpeaker(11, 51, 51, "Arjuna");
    updateSpeaker(12, 1, 1, "Arjuna");
    updateSpeaker(14, 21, 21, "Arjuna");
    updateSpeaker(17, 1, 1, "Arjuna");
    updateSpeaker(18, 1, 1, "Arjuna");
    updateSpeaker(18, 73, 73, "Arjuna");
    updateSpeaker(18, 74, 78, "Sanjaya");


    // --- PART 2: CHAPTER 13 ALIGNMENT ---
    console.log('Realigning Chapter 13...');

    const ch13Old = verses.filter(v => v.chapter === 13);
    const newCh13 = [];

    // Verse 1 (13.1) - Insert Missing
    newCh13.push({
        id: "13-1",
        chapter: 13,
        verse: 1,
        reference: "Chapter 13, Verse 1",
        text: "13.1 Arjuna said: Prakriti (Nature) and Purusha (Spirit), the Field and the Knower of the Field, knowledge and that which is to be known—I wish to know these, O Keshava.",
        reflection: "",
        themes: ["knowledge"],
        speaker: "Arjuna",
        sanskrit: ch13Old[0].sanskrit
    });

    // Verse 2-5 (Shift)
    for (let i = 1; i <= 4; i++) {
        const oldTextObj = ch13Old[i - 1];
        const oldSanskritObj = ch13Old[i];
        newCh13.push({
            id: `13-${i + 1}`,
            chapter: 13,
            verse: i + 1,
            reference: `Chapter 13, Verse ${i + 1}`,
            text: oldTextObj.text.replace(`13.${i}`, `13.${i + 1}`),
            reflection: oldTextObj.reflection,
            themes: oldTextObj.themes,
            speaker: "Krishna",
            sanskrit: oldSanskritObj.sanskrit
        });
    }

    // Verse 6 (Merge)
    const text6 = ch13Old[4].text.replace('13.5 ', '') + " " + ch13Old[5].text.replace('13.6 ', '');
    const sanskrit6 = ch13Old[5].sanskrit + " " + ch13Old[6].sanskrit;
    newCh13.push({
        id: "13-6",
        chapter: 13,
        verse: 6,
        reference: "Chapter 13, Verse 6",
        text: "13.6 " + text6,
        reflection: ch13Old[5].reflection,
        themes: ch13Old[5].themes,
        speaker: "Krishna",
        sanskrit: sanskrit6
    });

    // Verse 7-33 (Shift)
    for (let v = 7; v <= 33; v++) {
        const oldTextObj = ch13Old[v - 1];
        const oldSanskritObj = ch13Old[v];

        newCh13.push({
            id: `13-${v}`,
            chapter: 13,
            verse: v,
            reference: `Chapter 13, Verse ${v}`,
            text: oldTextObj.text,
            reflection: oldTextObj.reflection,
            themes: oldTextObj.themes,
            speaker: "Krishna",
            sanskrit: oldSanskritObj.sanskrit
        });
    }

    // Verse 34 (End)
    const sanskrit34 = "क्षेत्रक्षेत्रज्ञयोरेवमन्तरं ज्ञानचक्षुषा।भूतप्रकृतिमोक्षं च ये विदुर्यान्ति ते परम्।।13.34।।";
    newCh13.push({
        id: "13-34",
        chapter: 13,
        verse: 34,
        reference: "Chapter 13, Verse 34",
        text: ch13Old[33].text,
        reflection: ch13Old[33].reflection,
        themes: ch13Old[33].themes,
        speaker: "Krishna",
        sanskrit: sanskrit34
    });

    console.log('New Chapter 13 Verse Count:', newCh13.length);

    // Reconstruct
    const allVerses = verses.filter(v => v.chapter !== 13).concat(newCh13);
    allVerses.sort((a, b) => {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
    });

    const newContent = JSON.stringify(allVerses, null, 4);

    // Use replacer to overwrite file
    const newFileContent = fileContent.substring(0, arrayStart) +
        newContent +
        fileContent.substring(arrayEnd);

    fs.writeFileSync(filePath, newFileContent, 'utf8');
    console.log('Successfully wrote updated gitaData.ts');

} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
