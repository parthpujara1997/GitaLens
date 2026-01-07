
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainFilePath = path.join(__dirname, 'src', 'data', 'ai_reflections.json');
const updateFilePath = path.join(__dirname, 'updates.json');

try {
    const mainData = JSON.parse(fs.readFileSync(mainFilePath, 'utf8'));
    const updateData = JSON.parse(fs.readFileSync(updateFilePath, 'utf8'));

    // Merge updateData into mainData
    const updatedReflections = { ...mainData, ...updateData };

    fs.writeFileSync(mainFilePath, JSON.stringify(updatedReflections, null, 4), 'utf8');
    console.log(`Successfully updated reflections. Merged ${Object.keys(updateData).length} entries.`);
} catch (error) {
    console.error('Error updating reflections:', error);
    process.exit(1);
}
