
import {SAMPLE_USER, SAMPLE_CASE, SAMPLE_CASE_EVIDENCE, SAMPLE_JURY_SUMMARY, SAMPLE_ACHIEVEMENTS} from "./rand"

export async function fetchUserData(case_id){
    return SAMPLE_USER
}

export async function fetchUserAchievements(case_id){
    return SAMPLE_ACHIEVEMENTS
}

export async function fetchCaseData(case_id){
    return SAMPLE_CASE
}

export async function fetchCaseEvidence(case_id){
    return SAMPLE_CASE_EVIDENCE
}

export async function fetchCaseArguments(case_id){
    return []
}

export async function fetchJurySummary(case_id){
    return {
        total: Object.values(SAMPLE_JURY_SUMMARY).reduce((acc, x) => acc + x, 0),
        breakdown: SAMPLE_JURY_SUMMARY // breakdown is only returned if case is past jury phase
    }
}

export async function voteProvisional(data){
    console.log('voted provisional' , data.post_id, data.vote)
    // on server side
    // ensure actually in in provisional phase
}

export async function voteEvidence(evidence_id, vote_state){
    console.log('voted on evidence' , evidence_id, vote_state)
}

export async function voteArgument(argument_id, vote_state){
    console.log('voted on evidence' , argument_id, vote_state)

}

export async function voteJury(jury_assignment_id, vote){
    console.log('voted jury' , jury_assignment_id, vote)
    // on server side
    // ensure actually in in jury phase
}

export async function getJuryCaseAssignment(user_id, jury_assignment_id){
    console.log('validating jury case assignment' , user_id, jury_assignment_id)
    // const query = ```
    //     SELECT * FROM jury_assignments
    //     WHERE id = $1  
    //     AND user_id = $2
    // ```;
    // (query, [jury_assignment_id, user_id])
    const case_id = 2335;

    console.log("case id", case_id)

    return case_id
}

export async function getNewJuryAssignment(user_id){
    user_id
    return 12
}