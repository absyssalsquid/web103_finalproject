export const CRED_GET_OPTS = {
  method: "GET",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  }
}

export function defaultDeleteOpts(params){
  return {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  }
}

export function defaultPatchOpts(params){
  return {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  }
}

export function defaultPostOpts(params){
  return {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  }
}

export function defaultPutOpts(params){
  return {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
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