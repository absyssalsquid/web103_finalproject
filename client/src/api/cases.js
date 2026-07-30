
import { generateSampleEvidences, generateSampleArguments, SAMPLE_JURY_SUMMARY} from "./test_data"
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

export async function fetchCaseArguments(params){
  const q_string = Object.entries(params).map(([key, val])=>(`${key}=${val}`)).join('&')
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        last_page: 2,
        entries: generateSampleArguments(20)
      }
    },
  };
}

export async function fetchJurySummary(case_id){
  return {
    ok: true,
    status: 200,
    async json() {
    return {
        total: Object.values(SAMPLE_JURY_SUMMARY).reduce((acc, x) => acc + x, 0),
        breakdown: SAMPLE_JURY_SUMMARY // breakdown is only returned if case is past jury phase
    }
    },
  };
}

export async function voteProvisional(data){
    console.log('voted provisional' , data.post_id, data.vote)
    // on server side
    // ensure actually in in provisional phase
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

export async function voteJury(jury_assignment_id, vote){
    console.log('voted jury' , jury_assignment_id, vote)
    // on server side
    // ensure actually in in jury phase
}
