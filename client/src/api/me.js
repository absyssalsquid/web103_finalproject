import { CRED_GET_OPTS } from "./utils"

export async function getMyJuryAssignments(params) {
  const q_string = Object.entries(params).map(([key, val])=>(`${key}=${val}`)).join('&')
  console.log('GET user jury assingments', )
  return await fetch(`/api/me/jury-assignments?${q_string}`, CRED_GET_OPTS);
}

export async function getUsage() {
  console.log('GET daily usage', )
  return await fetch(`/api/me/usage`, CRED_GET_OPTS);
}