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

