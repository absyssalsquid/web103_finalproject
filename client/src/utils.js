const PHASES = ['PROVISIONAL', 'DISCOVERY', 'ARGUMENT', 'JURY_DELIBERATION', 'RULING', 'CLOSED'];


export function toTitleCase(str) {
  if (!str) return str;
  str = str.replace(/_/g,' ')
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

export function phaseDelta(currPhase, thisPhase){
  return PHASES.indexOf(thisPhase) - PHASES.indexOf(currPhase)
  // neg if passed
  // 0 if active
  // pos if not yet active
}

export function nextPhase(currPhase){
  let idx = PHASES.indexOf(currPhase);
  if (idx + 1 < PHASES.length) idx ++;
  return PHASES[idx];
}


export function getNextOccurrence(Time){
  const now = new Date();

  const nextRefresh = new Date(now);
  nextRefresh.setHours(
      Time.getHours(),
      Time.getMinutes(),
      Time.getSeconds(),
      Time.getMilliseconds()
  );

  if (nextRefresh <= now) {
      nextRefresh.setDate(nextRefresh.getDate() + 1);
  }
  console.log(nextRefresh)
  return nextRefresh;
}

export function getTimeString(date){
  return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
  })
  // console.log(ds)
  // return ds
}

export function formatDateTime(date){
  const date_str = date.toLocaleDateString();
  const time_str = date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
  })
  return date_str + ' · ' + time_str
}