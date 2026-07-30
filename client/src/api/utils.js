export const DEFAULT_GET_OPTS = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  }
}

export const CRED_GET_OPTS = {
  method: "GET",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  }
}

export function sampleResponse(ret_val){
  return {
      ok: true,
      status: 200,
      async json() {
        return ret_val
      },
  };
}