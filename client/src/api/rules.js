import { DEFAULT_GET_OPTS } from "./utils"

export async function getUserLimits() {
  return await fetch(`/api/rules/user-limits`, DEFAULT_GET_OPTS);
}

export async function getLengthLimits() {
  return await fetch(`/api/rules/length-limits`, DEFAULT_GET_OPTS);
}

export async function getRefreshTime() {
  return await fetch(`/api/rules/reset-time`, DEFAULT_GET_OPTS);
}