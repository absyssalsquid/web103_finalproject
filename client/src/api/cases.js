
import {SAMPLE_CASE, generateSampleEvidences, generateSampleArguments, SAMPLE_JURY_SUMMARY} from "./test_data"
const API_BASE = import.meta.env.VITE_API_BASE_URL;

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
  return await fetch(`${API_BASE}/cases`, options);
}

export async function fetchCase(case_id){
    return {
        ok: true,
        status: 200,
        async json() {
        return SAMPLE_CASE
        },
    };
}

export async function fetchCases(params) {
  const q_string = Object.entries(params).map(([key, val])=>(`${key}=${val}`)).join('&')
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }
  return await fetch(`${API_BASE}/cases?${q_string}`, options);

//   return {
//     ok: true,
//     status: 200,
//     async json() {
//       return [
//         {...SAMPLE_CASE, case_id: 1, phase: 'PROVISIONAL',       },
//         {...SAMPLE_CASE, case_id: 2, phase: 'ARGUMENT',          },
//         {...SAMPLE_CASE, case_id: 3, phase: 'JURY_DELIBERATION', },
//         {...SAMPLE_CASE, case_id: 4, phase: 'CLOSED',            },
//         {...SAMPLE_CASE, case_id: 5, phase: 'DISCOVERY',         },
//         {...SAMPLE_CASE, case_id: 6, phase: 'RULING',            },
//       ];
//     },
//   };
}

export async function fetchCaseEvidence(case_id, page_num, items_per_page){
  return {
    ok: true,
    status: 200,
    async json() {
      return generateSampleEvidences(20);
    },
  };
}

export async function fetchCaseArguments(case_id, page_num, items_per_page){
    return {
    ok: true,
    status: 200,
    async json() {
      return generateSampleArguments(20);
    },
  };
}

export async function fetchJurySummary(case_id, page_num, items_per_page){
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

export async function voteJury(jury_assignment_id, vote){
    console.log('voted jury' , jury_assignment_id, vote)
    // on server side
    // ensure actually in in jury phase
}
