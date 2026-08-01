
import { CRED_GET_OPTS } from "./utils"

export async function fetchUserData(user_id){
  console.log('GET user', user_id)
  return await fetch(`/api/users/${user_id}`, CRED_GET_OPTS);
}

export async function fetchUserStats(user_id) {
  console.log('GET user stats', user_id)
  return await fetch(`/api/users/${user_id}/stats`, CRED_GET_OPTS);
}

export async function fetchUserAchievements(user_id){
  console.log('GET user achievements', user_id)
  return await fetch(`/api/users/${user_id}/achievements`, CRED_GET_OPTS);
}


