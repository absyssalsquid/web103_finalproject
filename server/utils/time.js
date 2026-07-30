import { DateTime } from "luxon";
import { REFRESH_TIME } from '../config/userRules.js'

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

export function getNextRefresh() {
  let refresh = DateTime.now()
    .setZone(REFRESH_TIME.tz)
    .set({ hour: REFRESH_TIME.hour, minute: 0, second: 0, millisecond: 0 });

  if (refresh <= DateTime.now().setZone(REFRESH_TIME.time_zone)) {
    refresh = refresh.plus({ days: 1 });
  }

  return refresh.toUTC();
}