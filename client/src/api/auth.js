const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function login(params) {
  // params = { username, password }
  console.log('signing in with', params)
  const options = {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  }

  return await fetch(`${API_BASE}/auth/login`, options);
}

export async function register(params) {
  // params = { email, username, password, password2 }
  console.log('registering with', params)
  const options = {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  }
  return await fetch(`${API_BASE}/auth/register`, options);
}

export async function logout() {
  console.log('logging out')
  const options = {
    method: "POST",
    credentials: "include",
    headers: { 
      "Content-Type": "application/json" },
  }
  return await fetch(`${API_BASE}/auth/logout`, options);
}

export async function userFromToken() {
  console.log('userFromToken')
  const options = {
    method: "GET",
    credentials: "include",
    headers: { 
      "Content-Type": "application/json" },
  }
  return await fetch(`${API_BASE}/me`, options);
}