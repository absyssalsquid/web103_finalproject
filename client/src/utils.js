export function toTitleCase(str) {
  if (!str) return str;
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

export function phaseDelta(currPhase, thisPhase){
  const phases = ['PROVISIONAL', 'DISCOVERY', 'ARGUMENT', 'JURY_DELIBERATION', 'RULING', 'CLOSED'];
  return phases.indexOf(thisPhase) - phases.indexOf(currPhase)
  // neg if passed
  // 0 if active
  // pos if not yet active
}