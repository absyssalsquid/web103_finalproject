
const MS_PER_DAY = 86400000;

export function getRandomInt(min, max) {
  // inclusive of max
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function dateWithDelta(delta, date=null) {
  const new_date = new Date(date?date:Date.now());
  if (delta.days  ) new_date.setDate    (new_date.getDate() + delta.days);
  if (delta.hours  ) new_date.setHours  (new_date.getHours() + delta.hours);
  if (delta.hours  ) new_date.setMinutes(new_date.getMinutes() + delta.hours);
  if (delta.seconds) new_date.setSeconds(new_date.getSeconds() + delta.seconds);
  return new_date
}

export const SAMPLE_USER = {
    user_id: 1,
    username: 'GuiltyGoose',
    image_url: 'https://images.squarespace-cdn.com/content/v1/5979177946c3c4cf12d4fb7c/1560806448788-CUXJOXPEWI6C4RUT25UL/goosehead.gif?format=1500w',
    bio: 'friend and defender of household objects',
    total_xp: getRandomInt(100, 1500),
    created_at: dateWithDelta({days: -79}),
    flair_name: 'One Wing to Rule Them All',
    // flair_name: 'Egg',
}

export const SAMPLE_CASE = {
    case_id: 1, 
    user_id: SAMPLE_USER.user_id,
    username: 'GuiltyGoose',
    user_image_url: 'https://images.squarespace-cdn.com/content/v1/5979177946c3c4cf12d4fb7c/1560806448788-CUXJOXPEWI6C4RUT25UL/goosehead.gif?format=1500w',
    created_at: dateWithDelta({days: -4}),
    object_name: 'office building on the intersection of elm street and 5th avenue',
    accusation: 'contains a counterfeit sky, deceiving birds into flying into it. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In molestie tortor nec augue imperdiet, quis vestibulum turpis euismod. Intege',
    image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRACaShpPQ3ja6N-rzqVb8WIlUpFV6F_xfzo4IdLkcfb7VYit44QOlPRTw&s=10",
    phase: 'ARGUMENT', 
    phase_start:  new Date(), 
    phase_end:    dateWithDelta({seconds: 5}), 
    verdict: null,

    up_count: 13,
    down_count: 1
}
export const SAMPLE_EVIDENCE = {
    evidence_id: getRandomInt(1, 100000000000), 
    case_id: SAMPLE_CASE.case_id, 
    user_id: SAMPLE_USER.user_id,
    username: 'GuiltyGoose',
    user_image_url: 'https://images.squarespace-cdn.com/content/v1/5979177946c3c4cf12d4fb7c/1560806448788-CUXJOXPEWI6C4RUT25UL/goosehead.gif?format=1500w',
    created_at: dateWithDelta({days: -5}),
    evidence_num: 1, 
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In molestie tortor nec augue imperdiet, quis vestibulum turpis euismod. Lorem ipsum dolor sit',
    image_url: null,
    up_count: 13,
    down_count: 1
}

export const SAMPLE_CASE_EVIDENCE = [
    {...SAMPLE_EVIDENCE, evidence_num: 1},
    {...SAMPLE_EVIDENCE, evidence_num: 2},
    {...SAMPLE_EVIDENCE, evidence_num: 3},
    {...SAMPLE_EVIDENCE, evidence_num: 4},
    {...SAMPLE_EVIDENCE, evidence_num: 5},
    {...SAMPLE_EVIDENCE, evidence_num: 6},
]

export const SAMPLE_JURY_SUMMARY = {
    'GUILTY': getRandomInt(30, 100), 
    'NOT_GUILTY': getRandomInt(10, 70),
    'INSUFFICIENT_EVIDENCE': getRandomInt(2, 12)
}


export const SAMPLE_ACHIEVEMENTS = [
    {   achievement_id: 1,
        name: 'First Chirp',
        requirements: 'Submit your first accusation.',
        threshold: 1,
        progress: 1,
        earned_at: dateWithDelta({days: -79})},
    {   achievement_id: 2,
        name: 'Opening Statement',
        requirements: 'Make your first argument. ',
        threshold: 1,
        progress: 1,
        earned_at: dateWithDelta({days: -79})},
    {   achievement_id: 45,
        name: 'Birdbrain',
        requirements: 'Submit 20 arguments without citing a single piece of evidence or precedent',
        threshold: 20,
        progress: 20,
        earned_at: dateWithDelta({days: -42})},
    {   achievement_id: 0,
        name: 'Lorem ipsum',
        requirements: 'Lorem ipsum dolor sit amet',
        threshold: 20,
        progress: 2,
        earned_at: null,},
]

export function randomJuryAssignment(recent=false){
    const VOTES = ["GUILTY", "NOT_GUILTY", "INSUFFICIENT_EVIDENCE", null]
    const vote = VOTES[getRandomInt(0,3)]

    const msBack = getRandomInt((recent?1:180)*MS_PER_DAY, 0);
    const date_start = new Date(Date.now() - msBack);
    
    const expiration_date = new Date(date_start.getTime() + getRandomInt(MS_PER_DAY/24,MS_PER_DAY)); // corresponds to when the jury phase of the case closes
    const completed_at = ! vote ? null : new Date(getRandomInt(
        date_start.getTime() + MS_PER_DAY/24/2, // at least half hour after assignment
        expiration_date.getTime()
    ))
    const status = completed_at ? 'COMPLETED' : (Date.now() >= expiration_date ? 'EXPIRED' : 'OPEN')
    return {
        id: getRandomInt(0, 10000), 
        case_id: getRandomInt(0, 1000),
        user_id: SAMPLE_USER.user_id,
        expiration_date: expiration_date,
        vote: vote, 
        created_at: date_start,
        completed_at: completed_at ,
        status: status
    }
} 

export function generateJuryAssignments(old_count, recent_count){
  const oldJA = Array(   old_count).fill(null).map(()=>randomJuryAssignment())
  const newJA = Array(recent_count).fill(null).map(()=>randomJuryAssignment(true))
  return [...oldJA, ...newJA].toSorted((a, b) => b.created_at - a.created_at);
}