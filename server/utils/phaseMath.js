export const PHASES = ['PROVISIONAL', 'DISMISSED', 'DISCOVERY', 'ARGUMENT', 'JURY_DELIBERATION', 'RULING', 'CLOSED', 'WITHDRAWN'];

export function phaseDelta(currPhase, targetPhase){
  return PHASES.indexOf(targetPhase) - PHASES.indexOf(currPhase)
  // neg if target has passed
  // 0 if active
  // pos if target not yet active
}

export function nextPhase(currPhase){
  let idx = PHASES.indexOf(currPhase);
  if (idx + 1 < PHASES.length) idx ++;
  return PHASES[idx];
}