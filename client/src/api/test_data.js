
const MS_PER_DAY = 86400000;

const LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquet tellus ipsum, at euismod risus blandit sed. Nunc congue, mi eget iaculis tempus, justo libero condimentum massa, sed convallis sapien erat sit amet risus. Nunc vel nisl nec mi accumsan ullamcorper. Cras ut lectus purus. Quisque eu urna nec neque aliquam lacinia quis at turpis. Praesent ullamcorper eros at enim eleifend, et scelerisque velit euismod. Nam suscipit euismod urna eleifend cursus. Aliquam imperdiet, diam a suscipit congue, ante est bibendum ante, nec congue lorem risus sed diam. Nullam enim tortor, blandit vel egestas ac, ultricies in augue. Mauris at tortor nec eros ornare ultrices. Donec at lectus ac velit pretium aliquet ac eu urna. Fusce molestie auctor enim, id tincidunt nulla lobortis consequat. In hac habitasse platea dictumst. Mauris pellentesque pretium tortor id tincidunt. Morbi sem ipsum, ullamcorper sed sapien et, auctor lobortis ante. Donec vitae ante id lorem pretium tincidunt. Nunc dapibus pulvinar lobortis. Sed vel massa sit amet metus feugiat lobortis. Vestibulum interdum iaculis sem id blandit. Sed eleifend risus eget nisl pharetra, non commodo mi condimentum. Cras eget nisi nisi. Ut dapibus sapien quis ipsum egestas malesuada. Nunc placerat condimentum metus. Sed augue arcu, ornare nec rhoncus eu, rhoncus quis ante. Sed egestas eleifend accumsan. Aliquam molestie pretium ligula sit amet rutrum. Sed sed dignissim quam. Cras at lacus ultricies, commodo urna gravida, fringilla est. Quisque eu tellus sit amet mi finibus fermentum. Aenean volutpat ipsum sem. Praesent facilisis, dui pellentesque posuere maximus, diam mauris pretium purus, id convallis lacus arcu id tortor. Nam non dui eu magna porta consectetur. Nullam eget accumsan risus, ac suscipit eros. Praesent volutpat dignissim ante, nec convallis leo mattis at. Vivamus aliquet sit amet nunc vel efficitur. Curabitur at metus eget elit ornare dapibus in semper lectus. Duis ornare lacus et leo porttitor, congue tempor nibh bibendum. In aliquam turpis arcu, sed varius urna ullamcorper ut. Morbi dapibus tortor justo, eget maximus mi interdum in. Aenean congue odio mi, eu posuere nulla suscipit vitae. Cras eget lorem faucibus, maximus ex a, vulputate massa. Nulla nulla nisl, bibendum a ipsum eget, scelerisque placerat erat. "
function generateLoremIpsum(min, max){ // char count between
    const len = getRandomInt(min, max);
    let start = getRandomInt(0, LOREM_IPSUM.length - len)
    while (start>0 && !/^[A-Z]*$/.test(LOREM_IPSUM[start])) start--
    let end = start + len
    while (end != LOREM_IPSUM.length && end>start && LOREM_IPSUM[end+1] != ' ') end--
    return LOREM_IPSUM.substring(start, end+1)
}


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
    user_flair: 'One Wing to Rule Them All',
    created_at: dateWithDelta({days: -4}),
    object_name: 'office building on the intersection of elm street and 5th avenue',
    accusation: 'contains a counterfeit sky, deceiving birds into flying into it. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In molestie tortor nec augue imperdiet, quis vestibulum turpis euismod. Intege',
    image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRACaShpPQ3ja6N-rzqVb8WIlUpFV6F_xfzo4IdLkcfb7VYit44QOlPRTw&s=10",
    phase: 'ARGUMENT', 
    phase_start:  new Date(), 
    phase_end:    dateWithDelta({seconds: 5}), 
    verdict: null,

    up_count: getRandomInt(1, 100),
    down_count: getRandomInt(1, 100),
}

function generateSampleEvidence(){
    return {
        evidence_id: getRandomInt(1, 100000000), 
        case_id: SAMPLE_CASE.case_id, 
        user_id: SAMPLE_USER.user_id,
        username: 'GuiltyGoose',
        user_image_url: 'https://images.squarespace-cdn.com/content/v1/5979177946c3c4cf12d4fb7c/1560806448788-CUXJOXPEWI6C4RUT25UL/goosehead.gif?format=1500w',
        user_flair: 'One Wing to Rule Them All',
        created_at: dateWithDelta({days: -5}),
        evidence_num: 1, 
        text: generateLoremIpsum(50, 200),
        image_url: null,
        up_count: getRandomInt(1, 100),
        down_count: getRandomInt(1, 100),
    }

}

export function generateSampleEvidences(count){
    const arr = []
    for (let i = 0; i < count; i++) {
        arr.push({...generateSampleEvidence(), evidence_num: i+1});
    }
    return arr;
}

function generateSampleCaseCitations(count){
    const arr = []
    for (let i = 0; i < count; i++) {
        arr.push({
            case_id: getRandomInt(1, 100000),
            image_url: null,
            ruling: generateLoremIpsum(180, 300),
        });
    }
    return arr;
}

function generateSampleEvidenceCitations(count){
    const arr = []
    for (let i = 0; i < count; i++) {
        arr.push({
            evidence_id: getRandomInt(1, 100000000),
            evidence_num: getRandomInt(1, 100), 
            text: generateLoremIpsum(70, 200),
            image_url: null,
            up_count: getRandomInt(1, 100),
            down_count: getRandomInt(1, 100),
        });
    }
    return arr;
}

function generateSampleArgument(){
    const n_case_citations = getRandomInt(0, 3)
    const n_evidence_citations = getRandomInt(0, 5-n_case_citations)

    return {
        arg_id: getRandomInt(1, 100000000),
        case_id: getRandomInt(1, 100000),
        arg_num: getRandomInt(1, 50),
        text: generateLoremIpsum(220, 600),
        case_citations: generateSampleCaseCitations(n_case_citations),
        evidence_citations: generateSampleEvidenceCitations(n_evidence_citations),
    
        user_id: SAMPLE_USER.user_id,
        username: 'GuiltyGoose',
        user_image_url: 'https://images.squarespace-cdn.com/content/v1/5979177946c3c4cf12d4fb7c/1560806448788-CUXJOXPEWI6C4RUT25UL/goosehead.gif?format=1500w',
        user_flair: 'One Wing to Rule Them All',
        created_at: dateWithDelta({days: -4}),
        
        up_count: getRandomInt(1, 100),
        down_count: getRandomInt(1, 100),
    }
}

export function generateSampleArguments(count){
    const arr = []
    for (let i = 0; i < count; i++) {
        arr.push({...generateSampleArgument(), evidence_num: i+1});
    }
    return arr;
}

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