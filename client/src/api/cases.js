
import { CRED_GET_OPTS, defaultPostOpts } from "./utils"

export async function submitCase(params) {
  // params = { object_name, accusation, image }
  console.log('posting case', params)
  const options = defaultPostOpts(params)
  return await fetch(`/api/cases`, options);
}

export async function fetchCase(case_id){
  return await fetch(`/api/cases/${case_id}`, CRED_GET_OPTS);
}

export async function fetchCases(params) {
  const q_string = Object.entries(params).map(([key, val])=>(`${key}=${val}`)).join('&')
  return await fetch(`/api/cases?${q_string}`, CRED_GET_OPTS);
}

// ------------------------ per case fetches ------------------------

export async function fetchCaseEvidence(case_id, q_params){
  const q_string = Object.entries(q_params).map(([key, val])=>(`${key}=${val}`)).join('&')
  console.log(q_params)
  return await fetch(`/api/cases/${case_id}/evidence?${q_string}`, CRED_GET_OPTS);
}

export async function fetchCaseArguments(case_id, q_params){
  const q_string = Object.entries(q_params).map(([key, val])=>(`${key}=${val}`)).join('&')
  return await fetch(`/api/cases/${case_id}/arguments?${q_string}`, CRED_GET_OPTS);
}

export async function fetchJurySummary(case_id){
  return await fetch(`/api/cases/${case_id}/jury-summary`, CRED_GET_OPTS);
}

// ------------------------ submit to case ------------------------

export async function submitEvidence(params){
  // case_id, text
  const options = defaultPostOpts(params)
  return await fetch(`/api/evidence`, options);
}
export async function submitArgument(params) {
  // params = { case_id, text }
  const options = defaultPostOpts(params)
  return await fetch(`/api/arguments`, options);
}

