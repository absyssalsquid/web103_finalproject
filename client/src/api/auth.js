export async function login(params) {
    console.log('signing in with', params.username, params.password)
  // ...
}

export async function register(params) {
    console.log('registering with', params.username, params.password)
  // ...
}

export async function logout() {
    console.log('logging out')
  // ...
}

export async function getCurrentUserID() {
  // make query to api to fetch user info based on stored session cookies
  return null
  // const response = await fetch("/api/me", {
  //   credentials: "include",
  // });

  // if (response.status === 401) { // Anauthorized
  //   return null;
  // }

  // if (!response.ok) {
  //   throw new Error("Failed to fetch current user.");
  // }

  // return await response.json();
}