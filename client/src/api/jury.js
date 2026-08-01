import { CRED_GET_OPTS } from "./utils"

export async function consumeJurySummons() {
  // params = { object_name, accusation, image }
  // console.log('newJuryAssignment')
  const options = {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  }
  return await fetch(`/api/jury/serve`, options);
}

export async function getJuryAssignmentDetails(assignment_id) {
  console.log(`GET ja_id(${assignment_id}) => case_id`)
  return await fetch(`/api/jury/${assignment_id}`, CRED_GET_OPTS);
}

export async function voteJury(jassignment_id, params){
  // vote: null, fav_args: []
  console.log(jassignment_id, params)
  const options = {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  }
  return await fetch(`/api/jury/${jassignment_id}`, options);
    // console.log('voted jury' , jury_assignment_id, vote)
    // on server side
    // ensure actually in in jury phase
}
