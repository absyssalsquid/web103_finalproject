
import { generateSampleArguments, SAMPLE_JURY_SUMMARY} from "./test_data"
import { DEFAULT_GET_OPTS, defaultPostOpts } from "./utils"

export async function submitCase(params) {
  // params = { object_name, accusation, image }
  console.log('posting case', params)
  const options = {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  }
  return await fetch(`/api/cases`, options);
}

export async function fetchCase(case_id){
  return await fetch(`/api/cases/${case_id}`, DEFAULT_GET_OPTS);
}

export async function fetchCases(params) {
  const q_string = Object.entries(params).map(([key, val])=>(`${key}=${val}`)).join('&')
  return await fetch(`/api/cases?${q_string}`, DEFAULT_GET_OPTS);
}

export async function submitEvidence(params){
  // case_id, text
  const options = defaultPostOpts(params)
  return await fetch(`/api/evidence`, options);
}

export async function fetchCaseEvidence(case_id, q_params){
  const q_string = Object.entries(q_params).map(([key, val])=>(`${key}=${val}`)).join('&')
  return await fetch(`/api/cases/${case_id}/evidence?${q_string}`, DEFAULT_GET_OPTS);
}

export async function fetchCaseArguments(case_id, q_params){
  const q_string = Object.entries(q_params).map(([key, val])=>(`${key}=${val}`)).join('&')
  return await fetch(`/api/cases/${case_id}/arguments?${q_string}`, DEFAULT_GET_OPTS);
}

export async function fetchJurySummary(case_id){
  return await fetch(`/api/cases/${case_id}/jury-summary`, DEFAULT_GET_OPTS);
}

export async function voteProvisional(data){
    console.log('voted provisional' , data.post_id, data.vote)
}

export async function voteEvidence(evidence_id, vote_state){
    console.log('voted on evidence' , evidence_id, vote_state)
}

export async function voteArgument(argument_id, vote_state){
    console.log('voted on evidence' , argument_id, vote_state)

}

export async function submitArgument(params) {
  // params = { caseId, content }
  const options = {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  }
  return await fetch(`/api/arguments`, options);
}

