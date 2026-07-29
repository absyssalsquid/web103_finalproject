export function getRandomInt(min, max) {
  // inclusive of max
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function dateWithDelta(delta, date=null) {
  const new_date = new Date(date?date:Date.now());
  if (delta.days   ) new_date.setDate   (new_date.getDate() + delta.days);
  if (delta.hours  ) new_date.setHours  (new_date.getHours() + delta.hours);
  if (delta.minutes) new_date.setMinutes(new_date.getMinutes() + delta.minutes);
  if (delta.seconds) new_date.setSeconds(new_date.getSeconds() + delta.seconds);
  return new_date
}