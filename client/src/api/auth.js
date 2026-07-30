import { CRED_GET_OPTS } from "./utils"

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

  return await fetch(`/api/auth/login`, options);
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
  return await fetch(`/api/auth/register`, options);
}

export async function logout() {
  console.log('logging out')
  const options = {
    method: "POST",
    credentials: "include",
    headers: { 
      "Content-Type": "application/json" },
  }
  return await fetch(`/api/auth/logout`, options);
}

export async function decodeToken() {
  return await fetch(`/api/me`, CRED_GET_OPTS);
}