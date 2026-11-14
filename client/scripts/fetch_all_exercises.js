/**
 * Utility script to fetch and format 800+ exercises from the open-source
 * 'free-exercise-db' GitHub repository (yuhonas/free-exercise-db).
 *
 * Run with: node scripts/fetch_all_exercises.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const OUTPUT_FILE = path.join(__dirname, '..', 'assets', 'exercises.json');

const muscleMapping = {
  chest: 'Chest',
  lats: 'Back',
  'middle back': 'Back',
  'lower back': 'Back',
  traps: 'Back',
  shoulders: 'Shoulders',
  quadriceps: 'Legs',
  hamstrings: 'Legs',
  glutes: 'Legs',
  calves: 'Legs',
  biceps: 'Arms',
  triceps: 'Arms',
  forearms: 'Arms',
  abdominals: 'Core',
};

console.log(`Downloading online exercise library from: ${SOURCE_URL}...`);

https.get(SOURCE_URL, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download: Status code ${res.statusCode}`);
    return;
  }

  let rawData = '';
  res.on('data', (chunk) => {
    rawData += chunk;
  });

  res.on('end', () => {
    try {
      const items = JSON.parse(rawData);
      console.log(`Downloaded ${items.length} raw exercises.`);

      const baseExercises = [
        { "id": "barbell-bench-press", "name": "Barbell Bench Press", "muscleGroup": "Chest", "isCompound": true },
        { "id": "incline-dumbbell-press", "name": "Incline Dumbbell Press", "muscleGroup": "Chest", "isCompound": true },
        { "id": "cable-chest-fly", "name": "Cable Chest Fly", "muscleGroup": "Chest", "isCompound": false },
        { "id": "overhead-press", "name": "Overhead Barbell Press", "muscleGroup": "Shoulders", "isCompound": true },
        { "id": "dumbbell-lateral-raise", "name": "Dumbbell Lateral Raise", "muscleGroup": "Shoulders", "isCompound": false },
        { "id": "barbell-back-squat", "name": "Barbell Back Squat", "muscleGroup": "Legs", "isCompound": true },
        { "id": "romanian-deadlift", "name": "Romanian Deadlift", "muscleGroup": "Legs", "isCompound": true },
        { "id": "leg-extension", "name": "Leg Extension", "muscleGroup": "Legs", "isCompound": false },
        { "id": "lat-pulldown", "name": "Lat Pulldown", "muscleGroup": "Back", "isCompound": true },
        { "id": "barbell-bent-over-row", "name": "Barbell Bent Over Row", "muscleGroup": "Back", "isCompound": true },
        { "id": "tricep-rope-pushdown", "name": "Tricep Rope Pushdown", "muscleGroup": "Arms", "isCompound": false },
        { "id": "barbell-bicep-curl", "name": "Barbell Bicep Curl", "muscleGroup": "Arms", "isCompound": false }
      ];

      const seenNames = new Set(baseExercises.map(b => b.name.toLowerCase()));
      const seenIds = new Set(baseExercises.map(b => b.id.toLowerCase()));
      const merged = [...baseExercises];

      for (const item of items) {
        const name = item.name.trim();
        const primaryMuscle = (item.primaryMuscles && item.primaryMuscles[0]) || 'other';
        const muscleGroup = muscleMapping[primaryMuscle.toLowerCase()] || 'Other';
        const isCompound = item.mechanic === 'compound';
        const id = item.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        if (!seenNames.has(name.toLowerCase()) && !seenIds.has(id.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          seenIds.add(id.toLowerCase());
          merged.push({
            id,
            name,
            muscleGroup,
            isCompound,
          });
        }
      }

      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2), 'utf8');
      console.log(`Successfully merged and saved ${merged.length} exercises (including base 12) to: ${OUTPUT_FILE}`);
    } catch (err) {
      console.error('Error parsing JSON:', err.message);
    }
  });
}).on('error', (err) => {
  console.error('Network request failed:', err.message);
});
