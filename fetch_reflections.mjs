
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const verseCounts = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78];

async function fetchReflections() {
    const reflections = {};
    let successCount = 0;
    let failCount = 0;

    console.log("Starting bulk fetch of reflections...");

    for (let i = 0; i < verseCounts.length; i++) {
        const chapter = i + 1;
        const count = verseCounts[i];
        console.log(`Processing Chapter ${chapter} (${count} verses)...`);

        for (let verse = 1; verse <= count; verse++) {
            const url = `https://vedicscriptures.github.io/slok/${chapter}/${verse}/`;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();

                    // Prioritize Swami Sivananda's English commentary/translation
                    let text = data.siva?.et || data.siva?.ec || data.commentary || data.translation;

                    // Fallback to other sources if needed
                    if (!text && data.tej?.ht) text = data.tej.ht; // Hindi fallback? Maybe better to skip or look for English.

                    // Clean up text if needed (sometimes html tags?)
                    if (text) {
                        reflections[`${chapter}.${verse}`] = text;
                        successCount++;
                    } else {
                        console.warn(`No reflection text found for ${chapter}.${verse}`);
                        failCount++;
                    }
                } else {
                    console.error(`Failed to fetch ${chapter}.${verse}: ${response.status}`);
                    failCount++;
                }
            } catch (err) {
                console.error(`Error fetching ${chapter}.${verse}: ${err.message}`);
                failCount++;
            }

            // Be nice to the API
            await new Promise(r => setTimeout(r, 50));
        }
    }

    console.log(`\nFinished! Success: ${successCount}, Failed: ${failCount}`);

    const outputPath = path.join(process.cwd(), 'src', 'data', 'reflections.json');

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(reflections, null, 2));
    console.log(`Saved reflections to ${outputPath}`);
}

fetchReflections();
