import { CRED_GET_OPTS } from "./utils"

export async function getMyJuryAssignments(params) {
  const q_string = Object.entries(params).map(([key, val])=>(`${key}=${val}`)).join('&')
  return await fetch(`/api/me/jury-assignments?${q_string}`, CRED_GET_OPTS);
}

export async function getUsage() {
  return await fetch(`/api/me/usage`, CRED_GET_OPTS);
}

// params: { bio, flair, image } — image is a File (optional). sent as multipart
// so an image-upload backend can be dropped in later without changing the client.
export async function updateProfile({ bio, flair, image }) {
  const formData = new FormData();
  formData.append("bio", bio ?? "");
  formData.append("flair", flair == null ? "" : flair);
  if (image) formData.append("image", image);

  return await fetch(`/api/me/edit`, {
    method: "PATCH",
    credentials: "include",
    body: formData,
  });
}