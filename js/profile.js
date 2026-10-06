/* Profile Management + Calorie Calculation (pure functions, no DOM). */

export const ACTIVITY_LEVELS = [
  { value: 1.2,   label: 'Sedentary (desk job, no exercise)' },
  { value: 1.375, label: 'Light (1–3 days/week)' },
  { value: 1.55,  label: 'Moderate (3–5 days/week)' },
  { value: 1.725, label: 'Active (6–7 days/week)' },
  { value: 1.9,   label: 'Very Active (physical job + training)' }
];

// kcal/day applied on top of TDEE for each goal type
export const GOAL_TYPES = {
  lose:     { label: 'Lose weight (~0.5 kg/week)', delta: -500 },
  maintain: { label: 'Maintain weight',            delta: 0 },
  gain:     { label: 'Gain weight (~0.25 kg/week)', delta: 300 }
};

export const DEFAULT_PROFILE = {
  name: '', age: '', gender: 'male', height: '', weight: '', activity: 1.55, goal: 'maintain'
};

export function normalizeProfile(raw = {}) {
  const p = { ...DEFAULT_PROFILE, ...raw };
  p.age = toNum(p.age);
  p.height = toNum(p.height);
  p.weight = toNum(p.weight);
  p.activity = toNum(p.activity) || DEFAULT_PROFILE.activity;
  if (!GOAL_TYPES[p.goal]) p.goal = 'maintain';
  if (p.gender !== 'female') p.gender = 'male';
  p.name = String(p.name || '').trim().slice(0, 40);
  return p;
}

export function validateProfile(p) {
  const errors = [];
  if (!(p.age >= 10 && p.age <= 100)) errors.push('Age must be between 10 and 100');
  if (!(p.height >= 100 && p.height <= 250)) errors.push('Height must be between 100 and 250 cm');
  if (!(p.weight >= 25 && p.weight <= 300)) errors.push('Weight must be between 25 and 300 kg');
  return errors;
}

// Mifflin-St Jeor
export function calcBMR(p) {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return p.gender === 'female' ? base - 161 : base + 5;
}

export function calcBMI(p) {
  const m = p.height / 100;
  return m > 0 ? p.weight / (m * m) : 0;
}

export function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/** Daily calorie + macro targets derived from a validated profile. */
export function calcTargets(p) {
  const bmr = calcBMR(p);
  const tdee = Math.round(bmr * p.activity);
  const floor = p.gender === 'female' ? 1200 : 1500;
  const cal = Math.max(floor, tdee + GOAL_TYPES[p.goal].delta);
  return {
    bmr: Math.round(bmr),
    tdee,
    cal,
    prot: Math.round(p.weight * 1.8),
    carb: Math.round((cal * 0.40) / 4),
    fat: Math.round((cal * 0.30) / 9)
  };
}

function toNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
