import {defaultPutOpts} from './utils.js'

export async function reactProvisional(_, case_id, reaction){
  // console.log('react provisional', case_id, reaction, case_id)
  const options = defaultPutOpts({case_id, reaction})
  return await fetch(`/api/cases/${case_id}/vote`, options);
}

export async function reactEvidence(case_id, evidence_id, reaction){
  // console.log('react evidence', evidence_id, reaction, case_id)
  const options = defaultPutOpts({case_id, reaction})
  return await fetch(`/api/evidence/${evidence_id}/vote`, options);
}

export async function reactArgument(case_id, argument_id, reaction){
    // console.log('react argument', argument_id, reaction, case_id)
    const options = defaultPutOpts({case_id, reaction})
    return await fetch(`/api/arguments/${argument_id}/vote`, options);
}