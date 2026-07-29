const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function getMyJuryAssignments(params) {
  const q_string = Object.entries(params).map(([key, val])=>(`${key}=${val}`)).join('&')
  console.log('GET user jury assingments', )
  const options = {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    }
  }
  return await fetch(`${API_BASE}/me/jury-assignments?${q_string}`, options);
}


export async function getUsage() {
  console.log('GET daily usage', )
  const options = {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    }
  }
  return await fetch(`${API_BASE}/me/usage`, options);
}