
import { CRED_GET_OPTS, defaultPostOpts, defaultDeleteOpts, defaultPatchOpts } from "./utils"

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

// ------------------------ withdraw from case ------------------------

export async function deleteEvidence(evidence_id){
  const options = defaultDeleteOpts({})
  return await fetch(`/api/evidence/${evidence_id}`, options);
}

export async function deleteArgument(arg_id){
  const options = defaultDeleteOpts({})
  return await fetch(`/api/arguments/${arg_id}`, options);
}

// ------------------------ edit from case ------------------------

export async function editEvidence(params){
  // case_id, evidence_id, text -- case_id only necessary for validation of phase by middleware
  const options = defaultPatchOpts(params)
  return await fetch(`/api/evidence/${params.evidence_id}`, options);
}

export async function editArgument(params){
  // case_id, text, argument_tag, case_citations, evidence_citations, arg_id
  const options = defaultPatchOpts(params)
  return await fetch(`/api/arguments/${params.arg_id}`, options);
}

// ------------------------ judge decision ------------------------

export async function submitJudgeVerdict(case_id, params) {
  // params = { verdict, judge_ruling }
  // verdict: 'GUILTY' | 'NOT_GUILTY' | 'TB_PECKED_AT'
  const options = defaultPostOpts(params)
  return await fetch(`/api/cases/${case_id}/judge-verdict`, options);
}


// ------------------------ get singles ------------------------
export async function getArgument(arg_id) {
  return await fetch(`/api/arguments/${arg_id}`, CRED_GET_OPTS)
}
