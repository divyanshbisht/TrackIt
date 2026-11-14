const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { zodResponseFormat } = require('openai/helpers/zod');
const { openai, isOpenAIConfigured } = require('../config/openai');

// Structured Output Schema
const SetOutputSchema = z.object({
  setNumber: z.number(),
  type: z.enum(['regular', 'warmup', 'drop', 'failure']),
  weight: z.number(),
  reps: z.number(),
});

const ExerciseOutputSchema = z.object({
  exerciseId: z.string(),
  name: z.string(),
  muscleGroup: z.string(),
  isCompound: z.boolean(),
  sets: z.array(SetOutputSchema),
});

const RoutineOutputSchema = z.object({
  splitName: z.string(),
  exercises: z.array(ExerciseOutputSchema),
});

const SYSTEM_PROMPT = `
You are an elite strength & conditioning coach and workout parser for the minimalist app "TrackIt".
Your job is to parse natural-language, single-line workout routine descriptions into structured JSON.

Strict Rules:
1. Strict Equipment Preservation:
   - NEVER interchange Dumbbells and Barbells!
   - "dumbbell shoulder press", "db shoulder press", "seated db press", "db overhead press" -> "Dumbbell Shoulder Press"
   - "overhead press", "ohp", "military press", "barbell shoulder press" -> "Overhead Barbell Press"
   - "dumbbell bench press", "db bench", "db flat press" -> "Dumbbell Bench Press"
   - "bench", "flat bench", "bb bench", "bench press" -> "Barbell Bench Press"
   - "incline db", "incline dumbbell", "db incline" -> "Incline Dumbbell Press"
   - "incline bb", "incline bench", "incline barbell" -> "Barbell Incline Bench Press"
   - "lateral raises", "lat raise", "side raise", "db lateral raise" -> "Dumbbell Lateral Raise"
   - "lat pulldown", "pulldown", "lat pull" -> "Lat Pulldown"
   - "hammer curl", "hammer curls" -> "Hammer Curls"
   - "bicep curl", "dumbbell curl", "db curl" -> "Dumbbell Bicep Curl"
   - "barbell curl", "bb curl" -> "Barbell Bicep Curl"
   - "squat", "back squat", "bb squat" -> "Barbell Back Squat"
   - "rdl", "romanian dl", "romanian deadlift" -> "Romanian Deadlift"
   - "deadlift", "conventional deadlift" -> "Barbell Deadlift"
   - "tricep pushdown", "rope pushdown" -> "Tricep Rope Pushdown"
2. exerciseId: A kebab-cased or snake-cased unique slug for the canonical name (e.g. "Dumbbell_Shoulder_Press" or "dumbbell-shoulder-press").
3. Muscle Group: One of "Chest", "Back", "Shoulders", "Legs", "Arms", "Core", or "Full Body".
4. Biomechanical Ordering: Always reorder the exercises biomechanically:
   - Heavy compound movements first (e.g. Squat, Bench, Row, Deadlift, OHP, Dumbbell Shoulder Press).
   - Secondary compound exercises next.
   - Isolation and accessory movements last (e.g. Lateral Raises, Curls, Pushdowns).
5. Sets & Reps:
   - Parse patterns like "3x8" or "3 x 8" -> 3 sets of 8 reps.
   - If only sets are mentioned (e.g. "4 sets"), default reps to 10.
   - If sets and reps are omitted entirely, default to 3 sets of 10 reps.
   - If weight is mentioned (e.g. "bench 3x8 @ 100kg" or "100kg bench 3x8"), parse weight as number, else default to 0.
   - Set type defaults to "regular" unless "warmup", "drop", or "failure" is specified.
6. splitName: Infer appropriate split ("Push", "Pull", "Legs", "Upper", "Lower", or "Custom").
`;

// Load exercise library for intelligent local matching
let exercisesData = [];
try {
  const localDataPath = path.join(__dirname, '..', 'data', 'exercises.json');
  if (fs.existsSync(localDataPath)) {
    exercisesData = JSON.parse(fs.readFileSync(localDataPath, 'utf8'));
  } else {
    const clientPath = path.join(__dirname, '..', '..', '..', 'client', 'assets', 'exercises.json');
    if (fs.existsSync(clientPath)) {
      exercisesData = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
    }
  }
} catch (e) {
  console.warn('[AI Controller] Could not load exercises.json, using built-in table:', e.message);
}

// Highly precise slang & abbreviation map (checked before fuzzy search)
const SLANG_MAP = [
  // Chest - Incline
  { regex: /\b(?:incline db|incline dumbbell|db incline)\s*(?:bench|press)?\b/i, name: 'Incline Dumbbell Press', muscle: 'Chest', compound: true, id: 'incline-dumbbell-press' },
  { regex: /\b(?:incline bb|incline barbell|barbell incline|incline bench)\b/i, name: 'Barbell Incline Bench Press', muscle: 'Chest', compound: true, id: 'Barbell_Incline_Bench_Press_-_Medium_Grip' },
  // Chest - Flat
  { regex: /\b(?:db bench|dumbbell bench|db flat press|flat db press|dumbbell flat bench)\b/i, name: 'Dumbbell Bench Press', muscle: 'Chest', compound: true, id: 'Dumbbell_Bench_Press' },
  { regex: /\b(?:flat bench|barbell bench|bb bench|bench press|\bbench\b)\b/i, name: 'Barbell Bench Press', muscle: 'Chest', compound: true, id: 'barbell-bench-press' },
  { regex: /\b(?:cable fly|chest fly|pec deck|cable crossover)\b/i, name: 'Cable Chest Fly', muscle: 'Chest', compound: false, id: 'cable-chest-fly' },

  // Shoulders - Dumbbell
  { regex: /\b(?:dumbbell shoulder press|db shoulder press|seated db press|db overhead press|dumbbell overhead press|db seated press|seated dumbbell press)\b/i, name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', compound: true, id: 'Dumbbell_Shoulder_Press' },
  { regex: /\barnold\s*(?:db|dumbbell)?\s*press\b/i, name: 'Arnold Dumbbell Press', muscle: 'Shoulders', compound: true, id: 'Arnold_Dumbbell_Press' },
  // Shoulders - Barbell
  { regex: /\b(?:overhead press|ohp|military press|barbell shoulder press|bb shoulder press|barbell overhead press)\b/i, name: 'Overhead Barbell Press', muscle: 'Shoulders', compound: true, id: 'overhead-press' },
  // Shoulders - Raises
  { regex: /\b(?:cable\s*(?:lat|lateral|side)\s*raise)\b/i, name: 'Cable Lateral Raise', muscle: 'Shoulders', compound: false, id: 'Cable_Lateral_Raise' },
  { regex: /\b(?:lat(?:eral)?|side)\s*raises?\b/i, name: 'Dumbbell Lateral Raise', muscle: 'Shoulders', compound: false, id: 'dumbbell-lateral-raise' },
  { regex: /\b(?:rear delt fly|reverse fly|face pull|facepulls?)\b/i, name: 'Face Pull', muscle: 'Shoulders', compound: false, id: 'Face_Pull' },

  // Back
  { regex: /\b(?:lat pulldown|pulldown|lat pull)\b/i, name: 'Lat Pulldown', muscle: 'Back', compound: true, id: 'lat-pulldown' },
  { regex: /\b(?:bent over row|barbell row|bb row|pendlay row)\b/i, name: 'Barbell Bent Over Row', muscle: 'Back', compound: true, id: 'barbell-bent-over-row' },
  { regex: /\b(?:seated cable row|cable row|seated row)\b/i, name: 'Seated Cable Rows', muscle: 'Back', compound: true, id: 'Seated_Cable_Rows' },
  { regex: /\b(?:db row|dumbbell row|one arm row)\b/i, name: 'One-Arm Dumbbell Row', muscle: 'Back', compound: true, id: 'One-Arm_Dumbbell_Row' },
  { regex: /\b(?:pull[- ]?ups?|chin[- ]?ups?)\b/i, name: 'Pullups', muscle: 'Back', compound: true, id: 'Pullups' },

  // Legs - Quads / Squat
  { regex: /\b(?:front squat|barbell front squat)\b/i, name: 'Front Barbell Squat', muscle: 'Legs', compound: true, id: 'Front_Barbell_Squat' },
  { regex: /\b(?:back squat|barbell squat|bb squat|\bsquat\b)\b/i, name: 'Barbell Back Squat', muscle: 'Legs', compound: true, id: 'barbell-back-squat' },
  { regex: /\b(?:leg press)\b/i, name: 'Leg Press', muscle: 'Legs', compound: true, id: 'Leg_Press' },
  { regex: /\b(?:leg ext(?:ension)?)\b/i, name: 'Leg Extension', muscle: 'Legs', compound: false, id: 'leg-extension' },
  { regex: /\b(?:hack squat)\b/i, name: 'Hack Squat', muscle: 'Legs', compound: true, id: 'Hack_Squat' },

  // Legs - Hamstrings / Posterior
  { regex: /\b(?:rdl|romanian deadlift|romanian dl)\b/i, name: 'Romanian Deadlift', muscle: 'Legs', compound: true, id: 'romanian-deadlift' },
  { regex: /\b(?:deadlift|conventional deadlift|bb deadlift)\b/i, name: 'Barbell Deadlift', muscle: 'Legs', compound: true, id: 'Barbell_Deadlift' },
  { regex: /\b(?:leg curl|lying leg curl|seated leg curl|hamstring curl)\b/i, name: 'Leg Curl', muscle: 'Legs', compound: false, id: 'Lying_Leg_Curls' },
  { regex: /\b(?:calf raise|standing calf raise|seated calf raise)\b/i, name: 'Standing Calf Raises', muscle: 'Legs', compound: false, id: 'Standing_Calf_Raises' },

  // Arms - Triceps
  { regex: /\b(?:tricep pushdown|rope pushdown|tricep rope|pushdown)\b/i, name: 'Tricep Rope Pushdown', muscle: 'Arms', compound: false, id: 'tricep-rope-pushdown' },
  { regex: /\b(?:skull crusher|skullcrusher|lying tricep extension)\b/i, name: 'Skull Crushers', muscle: 'Arms', compound: false, id: 'EZ-Bar_Skullcrusher' },
  { regex: /\b(?:dips?|tricep dips?)\b/i, name: 'Dips - Triceps Version', muscle: 'Arms', compound: true, id: 'Dips_-_Triceps_Version' },

  // Arms - Biceps
  { regex: /\b(?:hammer curls?|db hammer curls?)\b/i, name: 'Hammer Curls', muscle: 'Arms', compound: false, id: 'Hammer_Curls' },
  { regex: /\b(?:barbell curl|bb curl)\b/i, name: 'Barbell Bicep Curl', muscle: 'Arms', compound: false, id: 'barbell-bicep-curl' },
  { regex: /\b(?:incline db curl|incline curl)\b/i, name: 'Incline Dumbbell Curl', muscle: 'Arms', compound: false, id: 'Incline_Dumbbell_Curl' },
  { regex: /\b(?:bicep curl|db curl|dumbbell curl|\bcurls?\b)\b/i, name: 'Dumbbell Bicep Curl', muscle: 'Arms', compound: false, id: 'Dumbbell_Bicep_Curl' },
];

/**
 * Intelligent exercise resolver
 */
function findExercise(rawName) {
  const clean = rawName.trim().toLowerCase();

  // 1. Direct Regex Slang Match
  for (const item of SLANG_MAP) {
    if (item.regex.test(clean)) {
      return {
        id: item.id,
        name: item.name,
        muscleGroup: item.muscle,
        isCompound: item.compound,
      };
    }
  }

  // 2. Normalize common equipment terms for search in library
  const normalizedQuery = clean
    .replace(/\bdb\b/g, 'dumbbell')
    .replace(/\bbb\b/g, 'barbell')
    .replace(/\bohp\b/g, 'overhead press')
    .replace(/\brdl\b/g, 'romanian deadlift')
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim();

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  // 3. Search exercises library with scoring
  if (exercisesData.length > 0) {
    let bestMatch = null;
    let bestScore = -1;

    const requiresDumbbell = queryTokens.includes('dumbbell');
    const requiresBarbell = queryTokens.includes('barbell');
    const requiresCable = queryTokens.includes('cable');

    for (const ex of exercisesData) {
      const exNameLower = ex.name.toLowerCase();
      let score = 0;

      // Equipment penalties: do not swap equipment
      if (requiresDumbbell && !exNameLower.includes('dumbbell')) score -= 60;
      if (requiresBarbell && !exNameLower.includes('barbell')) score -= 60;
      if (requiresCable && !exNameLower.includes('cable')) score -= 60;

      // Check token matches
      let matchedTokens = 0;
      for (const token of queryTokens) {
        if (exNameLower.includes(token)) {
          matchedTokens++;
          score += 15;
        }
      }

      // Exact substring bonus
      if (exNameLower.includes(normalizedQuery)) {
        score += 40;
      }
      // Exact match bonus
      if (exNameLower === normalizedQuery) {
        score += 100;
      }

      if (matchedTokens === queryTokens.length && score > bestScore) {
        bestScore = score;
        bestMatch = ex;
      } else if (score > bestScore && score > 20) {
        bestScore = score;
        bestMatch = ex;
      }
    }

    if (bestMatch && bestScore > 10) {
      return {
        id: bestMatch.id,
        name: bestMatch.name,
        muscleGroup: bestMatch.muscleGroup || 'Full Body',
        isCompound: bestMatch.isCompound !== undefined ? bestMatch.isCompound : false,
      };
    }
  }

  // 4. Fallback formatting
  const title = rawName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  let inferredMuscle = 'Full Body';
  if (/chest|bench|pec|fly/i.test(clean)) inferredMuscle = 'Chest';
  else if (/back|row|pulldown|pull-up|lat/i.test(clean)) inferredMuscle = 'Back';
  else if (/shoulder|delt|press|raise|ohp/i.test(clean)) inferredMuscle = 'Shoulders';
  else if (/leg|squat|quad|hamstring|calf|lunge/i.test(clean)) inferredMuscle = 'Legs';
  else if (/arm|bicep|tricep|curl|dip/i.test(clean)) inferredMuscle = 'Arms';
  else if (/ab|core|crunch|plank/i.test(clean)) inferredMuscle = 'Core';

  const isCompound = /press|squat|deadlift|row|pull|chin|dip|clean/i.test(clean);

  return {
    id: clean.replace(/[^a-z0-9]+/g, '-'),
    name: title,
    muscleGroup: inferredMuscle,
    isCompound,
  };
}

/**
 * Robust local fallback parser
 */
function fallbackParse(rawInput) {
  let cleanInput = rawInput.trim();
  let explicitSplit = null;

  // Split name prefix, e.g. "push day: dumbbell shoulder press 3x10, lateral raises 3x12"
  const colonIdx = cleanInput.indexOf(':');
  if (colonIdx > 0 && colonIdx < 30) {
    const candidateSplit = cleanInput.slice(0, colonIdx).trim();
    if (!/\d+x\d+/i.test(candidateSplit)) {
      explicitSplit = candidateSplit;
      cleanInput = cleanInput.slice(colonIdx + 1).trim();
    }
  }

  const parts = cleanInput.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  const parsedExercises = [];

  for (const part of parts) {
    const lower = part.toLowerCase();

    // Extract sets & reps
    let setsCount = 3;
    let repsCount = 10;
    let weight = 0;

    const setRepMatch = lower.match(/(\d+)\s*(?:x|\*)\s*(\d+)/i);
    if (setRepMatch) {
      setsCount = parseInt(setRepMatch[1], 10);
      repsCount = parseInt(setRepMatch[2], 10);
    } else {
      const setsMatch = lower.match(/(\d+)\s*sets?/i);
      if (setsMatch) setsCount = parseInt(setsMatch[1], 10);
      const repsMatch = lower.match(/(\d+)\s*reps?/i);
      if (repsMatch) repsCount = parseInt(repsMatch[1], 10);
    }

    const weightMatch = lower.match(/(?:@|\bat\b)?\s*(\d+(?:\.\d+)?)\s*(?:kg|lbs?)/i);
    if (weightMatch) {
      weight = parseFloat(weightMatch[1]);
    }

    let setType = 'regular';
    if (lower.includes('warmup') || lower.includes('warm up')) setType = 'warmup';
    if (lower.includes('drop set') || lower.includes('dropset')) setType = 'drop';
    if (lower.includes('failure') || lower.includes('to failure')) setType = 'failure';

    // Strip numbers and set-type keywords to isolate exercise name
    const cleanedName = part
      .replace(/(?:@|\bat\b)?\s*\d+(?:\.\d+)?\s*(?:kg|lbs?)/gi, '')
      .replace(/\d+\s*(?:x|\*)\s*\d+/gi, '')
      .replace(/\d+\s*sets?/gi, '')
      .replace(/\d+\s*reps?/gi, '')
      .replace(/warmup|warm up|drop set|dropset|failure|to failure/gi, '')
      .trim();

    const matchedEx = findExercise(cleanedName || part);

    const sets = [];
    for (let i = 1; i <= Math.min(setsCount, 10); i++) {
      sets.push({
        setNumber: i,
        type: setType,
        weight: weight,
        reps: repsCount,
      });
    }

    parsedExercises.push({
      exerciseId: matchedEx.id,
      name: matchedEx.name,
      muscleGroup: matchedEx.muscleGroup,
      isCompound: matchedEx.isCompound,
      sets,
    });
  }

  // Biomechanical ordering: compound first, isolation next
  parsedExercises.sort((a, b) => (b.isCompound ? 1 : 0) - (a.isCompound ? 1 : 0));

  let splitName = explicitSplit || 'Custom Routine';
  if (!explicitSplit) {
    const muscles = parsedExercises.map((e) => e.muscleGroup);
    if (muscles.includes('Chest') || muscles.includes('Shoulders')) splitName = 'Push Day';
    else if (muscles.includes('Back')) splitName = 'Pull Day';
    else if (muscles.includes('Legs')) splitName = 'Legs Day';
  }

  return {
    splitName,
    exercises: parsedExercises,
  };
}

exports.parseWorkout = async (req, res) => {
  try {
    const { rawInput } = req.body;

    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return res.status(400).json({ error: 'rawInput string is required' });
    }

    // Check if OpenAI is configured and available
    if (isOpenAIConfigured()) {
      try {
        const response = await openai.beta.chat.completions.parse({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: rawInput.trim() },
          ],
          response_format: zodResponseFormat(RoutineOutputSchema, 'workout_routine'),
          temperature: 0.2,
        });

        const routine = response.choices[0]?.message?.parsed;
        if (routine && routine.exercises && routine.exercises.length > 0) {
          return res.status(200).json({
            success: true,
            source: 'openai-gpt-4o-mini',
            data: routine,
          });
        }
      } catch (openAiErr) {
        console.warn(
          '[OpenAI Error] Parsing failed with OpenAI, falling back to smart local parser:',
          openAiErr.message
        );
      }
    }

    // Fallback parser if OpenAI is not configured or failed
    const fallbackRoutine = fallbackParse(rawInput.trim());
    return res.status(200).json({
      success: true,
      source: 'smart-rule-fallback',
      data: fallbackRoutine,
    });
  } catch (error) {
    console.error('[AI Controller Error]:', error);
    return res.status(500).json({ error: 'Internal server error parsing workout routine' });
  }
};
