const API_BASE = import.meta.env.VITE_API_BASE_URL;
import { SAMPLE_ACHIEVEMENTS} from "./test_data"

export async function fetchUserData(user_id){
  console.log('GET user', user_id)
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  }
  return await fetch(`${API_BASE}/users/${user_id}`, options);
}

export async function fetchUserStats(user_id) {
  console.log('GET user stats', user_id)
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  }
  return await fetch(`${API_BASE}/users/${user_id}/stats`, options);
}


export async function fetchUserAchievements(user_id){
    return {
        ok: true,
        status: 200,
        async json() {
          return SAMPLE_ACHIEVEMENTS
        },
    };
}


