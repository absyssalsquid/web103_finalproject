import { DateTime} from 'luxon'

import { getRandomInt } from '../utils/time.js'
import { LENGTH_LIMITS } from '../config/userRules.js';
import { PHASES } from '../utils/phaseMath.js'

import achievements from './achievements.js'

// ----------------------------------------- utils ----------------------------------------- 

const LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquet tellus ipsum, at euismod risus blandit sed. Nunc congue, mi eget iaculis tempus, justo libero condimentum massa, sed convallis sapien erat sit amet risus. Nunc vel nisl nec mi accumsan ullamcorper. Cras ut lectus purus. Quisque eu urna nec neque aliquam lacinia quis at turpis. Praesent ullamcorper eros at enim eleifend, et scelerisque velit euismod. Nam suscipit euismod urna eleifend cursus. Aliquam imperdiet, diam a suscipit congue, ante est bibendum ante, nec congue lorem risus sed diam. Nullam enim tortor, blandit vel egestas ac, ultricies in augue. Mauris at tortor nec eros ornare ultrices. Donec at lectus ac velit pretium aliquet ac eu urna. Fusce molestie auctor enim, id tincidunt nulla lobortis consequat. In hac habitasse platea dictumst. Mauris pellentesque pretium tortor id tincidunt. Morbi sem ipsum, ullamcorper sed sapien et, auctor lobortis ante. Donec vitae ante id lorem pretium tincidunt. Nunc dapibus pulvinar lobortis. Sed vel massa sit amet metus feugiat lobortis. Vestibulum interdum iaculis sem id blandit. Sed eleifend risus eget nisl pharetra, non commodo mi condimentum. Cras eget nisi nisi. Ut dapibus sapien quis ipsum egestas malesuada. Nunc placerat condimentum metus. Sed augue arcu, ornare nec rhoncus eu, rhoncus quis ante. Sed egestas eleifend accumsan. Aliquam molestie pretium ligula sit amet rutrum. Sed sed dignissim quam. Cras at lacus ultricies, commodo urna gravida, fringilla est. Quisque eu tellus sit amet mi finibus fermentum. Aenean volutpat ipsum sem. Praesent facilisis, dui pellentesque posuere maximus, diam mauris pretium purus, id convallis lacus arcu id tortor. Nam non dui eu magna porta consectetur. Nullam eget accumsan risus, ac suscipit eros. Praesent volutpat dignissim ante, nec convallis leo mattis at. Vivamus aliquet sit amet nunc vel efficitur. Curabitur at metus eget elit ornare dapibus in semper lectus. Duis ornare lacus et leo porttitor, congue tempor nibh bibendum. In aliquam turpis arcu, sed varius urna ullamcorper ut. Morbi dapibus tortor justo, eget maximus mi interdum in. Aenean congue odio mi, eu posuere nulla suscipit vitae. Cras eget lorem faucibus, maximus ex a, vulputate massa. Nulla nulla nisl, bibendum a ipsum eget, scelerisque placerat erat. "

export function generateLoremIpsum(min, max){ 
    // min <= len <= max
    while (true) {
        const len = getRandomInt(min, max);
        
        let start = getRandomInt(0, LOREM_IPSUM.length - len)
        while (start>0 && !/[A-Z]/.test(LOREM_IPSUM[start])) start--

        let end = start + len // end is after substr end
        while (end > start && end < LOREM_IPSUM.length && LOREM_IPSUM[end] != ' ') end--
        
        const actualLen = end - start;
        if (actualLen >= min)
            return LOREM_IPSUM.substring(start, end);
    }
}

export function getRandomDate(start, end=DateTime.now()) {
  const startMs = start.toMillis();
  const endMs = end.toMillis();
  const randomMs = startMs + Math.random() * (endMs - startMs);
  
  return DateTime.fromMillis(randomMs);
}

function getRandomElements(arr, n) {
  const result = [...arr];          // Create a shallow copy to keep the original array immutable
  const length = result.length;
  const size = Math.min(n, length); // Guard clause to ensure we do not sample more elements than available

  for (let i = 0; i < size; i++) {
    const j = getRandomInt(i, length - 1);           // Pick a random index from the remaining unpicked elements
    [result[i], result[j]] = [result[j], result[i]]; // Swap the current element with the element at the random index
  }

  return result.slice(0, size);
}

// ----------------------------------------- utils ----------------------------------------- 

export function generateUsers(usernames){
    return usernames.map((username, i) => ({
        username,
        email: `samplebird${i}6@gmail.com`,
        pw: 'seedeater',
        image_url: 'https://images.unsplash.com/photo-1606567595334-d39972c85dbe',
    }))
}

export function generateEvidence(count, users){
    return [...Array(count).keys()].map((i) => {
        const user_idx =  getRandomInt(0, users.length - 1)
        const user_id = users[user_idx].user_id

        return {
            user_id,
            evidence_num: i+1,
            text: generateLoremIpsum(
                LENGTH_LIMITS.evidence_min,
                LENGTH_LIMITS.evidence_max), 
            up_votes: getRandomInt(1, 100),
            down_votes: getRandomInt(1, 100),
        }
    })
}

export function generateArguments(count, users, ev_arr, cases_arr=[]){
    return [...Array(count).keys()].map((i) => {
        // select evidence
        const n_ev = getRandomInt(0, 5)
        const n_arg = getRandomInt(0, 5-n_ev)
        const user_idx =  getRandomInt(0, users.length - 1)
        const user_id = users[user_idx].user_id
        
        return {
            user_id,
            arg_num: i+1,
            argument_tag: getRandomInt(0, 1) == 0 ? 'PROSECUTION' : 'DEFENSE', 
            text: generateLoremIpsum(
                LENGTH_LIMITS.argument_min + 5,
                LENGTH_LIMITS.argument_max), 
            cited_evidence_ids: getRandomElements(ev_arr, n_ev),
            cited_case_ids: getRandomElements(cases_arr, n_arg),
            up_votes: getRandomInt(1, 100),
            down_votes: getRandomInt(1, 100),
        }
    })
}

export function generateUserAchievements(user){
    const N = getRandomInt(3, 10) // select 3-10 random achievements
    let user_achievements = new Array(N)
    let n_completed = getRandomInt(0, N)
    
    let ach_idxs = achievements.map((item)=>(item.achievement_id - 1))
    ach_idxs = getRandomElements(ach_idxs, N)

    // for each achievement
    for (var i=0; i < N; i++){
        const ach = achievements[ach_idxs[i]]
        let entry = {
            user_id: user.user_id,
            achievement_id: ach.achievement_id,
            progress: (i < n_completed) ? ach.threshold : getRandomInt(1, ach.threshold), // generate progress: 1 <= x <= threshold
        }
        if (entry.progress == ach.threshold){
            entry.earned_at = getRandomDate(user.created_at.plus({days: 10}))
        }
        user_achievements[i] = entry
    }
    return user_achievements
}

export function generateJuryBallots(caseData, users){
    const guilty_threshold = Math.random() // case bias; if below, not guilty
    const response_rate = Math.random() // fraction of users that participate
    const ballot_completion_probability = 0.8

    const jury_start_dt = caseData.created_at.plus({days:3})
    const jury_end_dt = jury_start_dt.plus({days:1})

    let filtered_users = users.filter(user => user.created_at < jury_start_dt)
    const n_responses = Math.floor(response_rate * filtered_users.length)
    filtered_users = getRandomElements(filtered_users, n_responses)

    return filtered_users.map((user, idx) => {

        const ballot =  {
            case_id: caseData.case_id,
            user_id: user.user_id,
            vote: null,
            created_at: getRandomDate(jury_start_dt, jury_end_dt.plus({hours: -2})), 
            expires_at: jury_end_dt,
            completed_at: null,
        }
    
        if (Math.random() <= ballot_completion_probability) {
            const user_bias = Math.random()
            ballot.vote = user_bias < guilty_threshold ? 'NOT_GUILTY' : 'GUILTY'
            ballot.completed_at = getRandomDate(ballot.created_at, ballot.expires_at)
        }

        return ballot
    })
}


const END_PHASES = ['CLOSED', 'WITHDRAWN', 'DISMISSED']
const DELTA_DAYS = { // phase start in days after created_at
    PROVISIONAL: 0,
    DISMISSED: 1,
    DISCOVERY: 1,
    ARGUMENT: 2,
    JURY_DELIBERATION: 3,
    RULING: 4,
    CLOSED: 5
}
const NORMAL_PHASE_PROGRESSION = [
    'PROVISIONAL',
    'DISCOVERY',
    'ARGUMENT',
    'JURY_DELIBERATION',
    'RULING',
    'CLOSED',
]

export function generateCases(count, users, startDate){
    const reversed_progression = NORMAL_PHASE_PROGRESSION.toReversed()

    return [...Array(count).keys()].map((i) => {
        const user_idx =  getRandomInt(0, users.length - 1)
        const user_id = users[user_idx].user_id
        const created_at = getRandomDate(startDate)
        
        // calcualte phase based on created_at date. 
        let phase = null
        const rand = Math.random()
        if      (rand < 0.10 ) { phase = 'DISMISSED' } // small probability of abnormal exit
        else if (rand < 0.15) { phase = 'WITHDRAWN' } 
        else {
            // normal case progression
            for (const ph of reversed_progression){
                const ph_st = created_at.plus({days: DELTA_DAYS[ph]})
                const ph_end = ph_st.plus({days: 1})
                // console.log(ph, ph_st <= DateTime.now(), DateTime.now() < ph_end)
                
                if (DateTime.now() >= ph_st){ 
                    // console.log("assigned", ph, "\n")
                    phase = ph
                    break
                }
            }
        }

        const phase_start = (phase === 'WITHDRAWN') 
            ? getRandomDate(created_at, created_at.plus({days: DELTA_DAYS.CLOSED}))
            : created_at.plus({days: DELTA_DAYS[phase]})

        return {
            user_id,
            created_at, 
            object_name: `sample object ${i}`, 
            accusation: `sample accusation and the harm or offense it has caused to birds.`, 
            image_url: null, 
            phase,
            phase_start,
            phase_end: END_PHASES.includes(phase) ? null : phase_start.plus({days:1})
        }
    })
}

const users = [{user_id: 1}]
const cases = generateCases(20, users, DateTime.now().plus({days:-6}))