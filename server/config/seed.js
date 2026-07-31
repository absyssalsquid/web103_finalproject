import { pool } from './database.js'
import bcrypt from 'bcrypt'
import { DateTime} from 'luxon'
import { getRandomInt } from '../utils/time.js'

import './dotenv.js'

import achievements from '../data/achievements.js'
import users from '../data/users.js'
import cases from '../data/cases.js'
import { generateArguments, generateEvidence } from '../data/generators.js'
// import evidence from '../data/evidence.js'
// import arguments from '../data/arguments.js'

const CREATED_AT_DELTA_DAYS = {
    PROVISIONAL: -1,
    DISCOVERY: -2,
    ARGUMENT: -3,
    JURY_DELIBERATION: -4,
    RULING: -5,
}

// ----------------------------------------- utils ----------------------------------------- 

function randomDate({start=DateTime.now().plus({days: -30}), end=DateTime.now()}){
    const randomValue = Math.random() * (end.valueOf() - start.valueOf());
    return DateTime.fromMillis(start.valueOf() + randomValue);
}

function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Pick a random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements using destructuring assignment
  }
}


// ----------------------------------------- users ----------------------------------------- 

async function insertUser(user){
    const passwordHash = await bcrypt.hash(user.pw, 12);
    
    try {
        const result = await pool.query(`
            INSERT INTO users (email, username, pw_hash, created_at, flair, bio, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [user.email, user.username, passwordHash, user.created_at.toISO(), user.flair, user.bio, user.image_url]
        );
        console.log(`OOO user created: ${user.username}`)
    } catch (err) {
        console.error(`XXX error creating user: ${user.username}`, err)
    }
}

const seedAchievements = async () => {
    console.log("seeding achievements table")
    const results = await Promise.allSettled(
        achievements.map(ach =>
            pool.query(
                `INSERT INTO achievements (achievement_id, name, requirements, threshold, image_url) VALUES ($1, $2, $3, $4, $5)`,
                [ach.achievement_id, ach.name, ach.requirements, ach.threshold, ach.image_url]
            )
        )
    )
    const success_count = results.filter(r => r.status === 'fulfilled').length
    results.forEach((result, i) => {
        if (result.status === 'rejected') {
            console.error(`XXX error seeding achievement: ${achievements[i].name}`, result.reason)
        }
    })
    const symbol = success_count === achievements.length ? 'OOO' : 'XXX'
    console.log(`${symbol} seeded ${success_count}/${achievements.length} achievements`)
}

function generateUserAchievements(user){
    const N = getRandomInt(3, 10) // select 3-10 random achievements
    let user_achievements = new Array(N)
    let n_completed = getRandomInt(0, N)
    
    const ach_idxs = achievements.map((item)=>(item.achievement_id - 1))
    shuffleInPlace(ach_idxs)

    // for each achievement
    for (var i=0; i < N; i++){
        const ach = achievements[ach_idxs[i]]
        let entry = {
            achievement_id: ach.achievement_id,
            progress: (i < n_completed) ? ach.threshold : getRandomInt(1, ach.threshold), // generate progress: 1 <= x <= threshold
        }
        if (entry.progress == ach.threshold){
            entry.earned_at = randomDate({start: user.created_at})
        }
        user_achievements[i] = entry
    }
    return user_achievements
}

async function seedUserAchievements(user_id, arr){
    const results = await Promise.allSettled(
        arr.map(u_ach =>
            pool.query(
                `INSERT INTO user_achievements (user_id, achievement_id, progress, earned_at) 
                VALUES ($1, $2, $3, $4)`,
                [user_id, u_ach.achievement_id, u_ach.progress, u_ach.earned_at]
            )
        )
    )
    const success_count = results.filter(r => r.status === 'fulfilled').length
    results.forEach((result, i) => {
        if (result.status === 'rejected') {
            console.error(`XXX error seeding achievement: ${achievements[i].name}`, result.reason)
        }
    })
    return success_count
}


// ----------------------------------------- cases ----------------------------------------- 
async function insertCase(cased){
    if (cased.phase_start == null){
        cased.phase_start = cased.phase_end.plus({days:-1})
        cased.created_at = cased.phase_end.plus({days: CREATED_AT_DELTA_DAYS[cased.phase]})
    }
    try {
        const result = await pool.query(`
            INSERT INTO cases (
                user_id, created_at, 
                object_name, accusation, image_url, 
                phase, phase_start, phase_end )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING case_id`,
            [cased.user_id, cased.created_at.toISO(), 
             cased.object_name, cased.accusation, cased.image_url,
             cased.phase, cased.phase_start.toISO(), cased.phase_end?.toISO(), 
            ]
        );
        return result.rows[0].case_id
        console.log(`OOO case created: ${cased.object_name}`)
    } catch (err) {
        console.error(`XXX error creating case: ${cased.object_name}`, err)
    }
}

async function insertEvidence(case_id, ev){
    try {
        const result = await pool.query(`
            INSERT INTO evidence (case_id, user_id, evidence_num, text, up_votes, down_votes)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [case_id, ev.user_id, ev.evidence_num, ev.text, ev.up_votes, ev.down_votes]
        );
    } catch (err) {
        console.error(`    XXX error creating evidence: #${ev.evidence_num}`, err)
    }
}

async function insertArgument(case_id, arg) {
    return
}

async function seedAll(){
    await seedAchievements();

    for (const user of users) {
        await insertUser(user)
    }
    
    // seed user achievements
    for (var i=0; i < users.length; i++){
        const user_id = i+1
        const u_achs = generateUserAchievements(users[i])
        const success_count = await seedUserAchievements(user_id, u_achs)
        const symbol = success_count === u_achs.length ? 'OOO' : 'XXX'
        console.log(`${symbol} ${users[i].username}: seeded ${success_count}/${u_achs.length} achievements`)

        // select one achievement to flair
        if (u_achs[0].earned_at != null)
            pool.query(`UPDATE users SET flair = $1 WHERE user_id = $2`, [u_achs[0].achievement_id, user_id])
    }

    // seed cases
    for (var i=0; i < cases.length; i++){
        const case_id = await insertCase(cases[i])
        console.log(`case created #${case_id}`)
        
        // seed evidence
        const ev_count = getRandomInt(5, 25)
        console.log(`  evidence count: ${ev_count} `)
        const evidence = generateEvidence(ev_count)
        for (const ev of evidence) {
            await insertEvidence(case_id, ev)
        }

        // seed arguments
        const arg_count = getRandomInt(5, 25)
        console.log(`  argument count: ${arg_count} `)
        const args = generateArguments(arg_count)
        for (const arg of args) {
            await insertArgument(case_id, arg)
        }
    }

    await pool.end(); 
}

seedAll()