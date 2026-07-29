const API_BASE = import.meta.env.VITE_API_BASE_URL;

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
  return await fetch(`${API_BASE}/jury/serve`, options);
}

export async function getJuryAssignmentDetails(assignment_id) {
  console.log(`GET ja_id(${assignment_id}) => case_id`)
  const options = {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    }
  }
  return await fetch(`${API_BASE}/jury/${assignment_id}`, options);
}

