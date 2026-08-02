import { pool } from './database.js'
import bcrypt from 'bcrypt'
import { DateTime} from 'luxon'
import { getRandomInt } from '../utils/time.js'
import { phaseDelta } from '../utils/phaseMath.js'

import './dotenv.js'

import achievements from '../data/achievements.js'
import users from '../data/users.js'
import usernames from '../data/usernames.js'
import {
    getRandomDate, generateUsers, generateUserAchievements, generateCases , 
    generateEvidence, generateArguments, generateJuryBallots
} from '../data/generators.js'

const CREATED_AT_DELTA_DAYS = {
    PROVISIONAL: -1,
    DISCOVERY: -2,
    ARGUMENT: -3,
    JURY_DELIBERATION: -4,
    RULING: -5,
}

const USER_CREATION_START = DateTime.now().plus({years:-2})

const bulletPt = (count, target=1) => (count === target) ? '  -' : '  X'

function processResults(results, name, callback=null){
    let errors_output = 0
    results.forEach((result, i) => {
        if (result.status === 'fulfilled'){
            if (callback) callback(result, i)
        }
        else if (errors_output < 3) {
            console.error(`${bulletPt(0)} error seeding ${name}:`, result.reason)
            errors_output ++
        }
    })
}

// ----------------------------------------- users ----------------------------------------- 

async function insertUser(user){
    const passwordHash = await bcrypt.hash(user.pw, 12);
    user.created_at = getRandomDate(USER_CREATION_START)

    return pool.query(
      `
      WITH new_row AS (
        INSERT INTO users (username, created_at, bio, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id
      )
      INSERT INTO credentials (user_id, email, pw_hash)
      SELECT new_row.user_id, $5, $6
      FROM new_row
      RETURNING user_id
      `,
      [user.username, user.created_at.toISO(), user.bio, user.image_url, user.email, passwordHash]
    );
}

async function seedUsers(all_users) {
    const results = await Promise.allSettled(
        all_users.map(user => insertUser(user))
    )
    const success_count = results.filter(r => r.status === 'fulfilled').length
    console.log(`${bulletPt(success_count, all_users.length)} seeded ${success_count}/${all_users.length} users`)
    
    const callback = (result, i) => all_users[i].user_id = result.value.rows[0].user_id
    processResults(results, "user", callback)
}

async function seedAchievements(achievements) {
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
    console.log(`${bulletPt(success_count, achievements.length)} seeded ${success_count}/${achievements.length} achievements`)
    
    processResults(results, "achievement")
}

async function seedUserAchievements(arr){
    const results = await Promise.allSettled(
        arr.map(u_ach =>
            pool.query(
                `INSERT INTO user_achievements (user_id, achievement_id, progress, earned_at) 
                VALUES ($1, $2, $3, $4)`,
                [u_ach.user_id, u_ach.achievement_id, u_ach.progress, u_ach.earned_at]
            )
        )
    )
    const success_count = results.filter(r => r.status === 'fulfilled').length
    console.log(`${bulletPt(success_count, arr.length)} seeded ${success_count}/${arr.length} achievements`)
    
    processResults(results, "user achievement")
}

// ----------------------------------------- cases ----------------------------------------- 
async function insertCase(cased){
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
        cased.case_id = result.rows[0].case_id
        return cased.case_id
    } catch (err) {
        console.error(`${bulletPt(0)} error creating case: ${cased.object_name}`, err)
        return null
    }
}

async function seedEvidence(case_id, arr){
    const results = await Promise.allSettled(
        arr.map(ev => pool.query(`
            INSERT INTO evidence (case_id, user_id, evidence_num, text, up_votes, down_votes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING evidence_id`,
            [case_id, ev.user_id, ev.evidence_num, ev.text, ev.up_votes, ev.down_votes]
        ))
    )
    const success_count = results.filter(r => r.status === 'fulfilled').length
    console.log(`${bulletPt(success_count, arr.length)} seeded ${success_count}/${arr.length} pieces of evidence`)

    const callback = (result, i) => arr[i].evidence_id = result.value.rows[0].evidence_id
    processResults(results, "evidence", callback)
}

async function seedArguments(case_id, arr){
    const arg_results = await Promise.allSettled(
        arr.map((arg) => pool.query(`
            WITH new_row AS (
                INSERT INTO arguments (case_id, user_id, arg_num, text, argument_tag, up_votes, down_votes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING arg_id
            ),
            ins AS (
                INSERT INTO argument_evidence_refs (arg_id, evidence_id)
                SELECT arg_id, unnest($8::int[])
                FROM new_row
            )
            SELECT arg_id
            FROM new_row;
            `,
            [case_id, arg.user_id, arg.arg_num, arg.text, arg.argument_tag, arg.up_votes, arg.down_votes, arg.cited_evidence_ids]
        ))
    )
    let success_count = arg_results.filter(r => r.status === 'fulfilled').length
    console.log(`${bulletPt(success_count, arr.length)} seeded ${success_count}/${arr.length} arguments`)

    const callback = (result, i) => arr[i].arg_id = result.value.rows[0].arg_id
    processResults(arg_results, "argument", callback)    
}

async function seedJuryAssignments(arr){
    const ballot_results = await Promise.allSettled(
        arr.map((ballot)=>pool.query(`
            INSERT INTO jury_assignments (case_id, user_id, vote, created_at, expires_at, completed_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [ballot.case_id, ballot.user_id, ballot.vote, ballot.created_at.toISO(), ballot.expires_at.toISO(), ballot.completed_at?.toISO()]
        ))
    )
    let success_count = ballot_results.filter(r => r.status === 'fulfilled').length
    console.log(`${bulletPt(success_count, arr.length)} seeded ${success_count}/${arr.length} jury assignments`)

    processResults(ballot_results, "jury assignments")
}

async function setFlairs(arr){
    const results = await Promise.allSettled(
        arr.map((pair) => pool.query(
            `UPDATE users SET flair = $1 WHERE user_id = $2`, 
            [pair.flair, pair.user_id])
        )
    )
    let success_count = results.filter(r => r.status === 'fulfilled').length
    console.log(`${bulletPt(success_count, arr.length)} set ${success_count}/${arr.length} user flairs`)

    processResults(results, "user flairs")
}

async function seedAll(){
    await seedAchievements(achievements);

    console.log("seeding users")
    const generatedUsers = generateUsers(usernames)
    const all_users = [...users, ...generatedUsers]
    await seedUsers(all_users)

    const filtered_users = all_users.filter(user => user.user_id)

    // seed user achievements
    const flairs = []
    const all_u_achs = []
    console.log("seeding user achievements")
    for (const user of filtered_users){
        const u_achs = generateUserAchievements(user)
        all_u_achs.push(...u_achs)
       
        // select one achievement to flair
        if (u_achs[0].earned_at != null)
            flairs.push({
                user_id: user.user_id, 
                flair: u_achs[0].achievement_id
            })
    }
    await seedUserAchievements(all_u_achs)
    await setFlairs(flairs)

    const cases_old = [] // generateCases(30, filtered_users, USER_CREATION_START)
    const cases_new = generateCases(20, filtered_users, DateTime.now().plus({days: -6}))
    const cases = [...cases_old, ...cases_new]

    // seed cases
    for (var i=0; i < cases.length; i++){
        const case_data = cases[i]
        await insertCase(case_data)
        const case_id = case_data.case_id
        if (!case_id) {
            console.log("failed to create case#", case_data.object_name, case_data.phase)
            continue
        }

        console.log(`case created #${case_id}: ${case_data.object_name}`)


        // seed evidence
        const ev_count = getRandomInt(5, 35)
        const evidence = generateEvidence(ev_count, filtered_users)
        await seedEvidence(case_id, evidence)
        const ev_ids = evidence.filter(ev => ev.evidence_id).map(ev => ev.evidence_id)
        if (phaseDelta(case_data.phase, 'DISCOVERY') === 0) continue

        // seed arguments
        const arg_count = getRandomInt(5, Math.floor(ev_count/2))
        const args = generateArguments(arg_count, filtered_users, ev_ids)
        await seedArguments(case_id, args)
        if (phaseDelta(case_data.phase, 'ARGUMENT') === 0) continue

        // seed votes
        const ballots = generateJuryBallots(case_data, filtered_users)
        await seedJuryAssignments(ballots)
        if (phaseDelta(case_data.phase, 'JURY_DELIBERATION') === 0) continue

        // calculate ruling
        let [guilty_count, not_guilty_count] = [0,0]
        for (const ballot of ballots){
            if (!ballot.vote) continue
            if (ballot.vote==='GUILTY') guilty_count++
            if (ballot.vote==='NOT_GUILTY') not_guilty_count++
        }

        let verdict
        if (guilty_count + not_guilty_count === 0) verdict = null
        else if (guilty_count === not_guilty_count) verdict = 'TB_PECKED_AT'
        else if (guilty_count > not_guilty_count) verdict = 'GUILTY'
        else if (guilty_count < not_guilty_count) verdict = 'NOT_GUILTY'
        
        await pool.query(`UPDATE cases SET verdict = $1 WHERE case_id = $2`, [verdict, case_data.case_id])

        if (phaseDelta(case_data.phase, 'JURY_DELIBERATION') < 0) continue

    }

    await pool.end(); 
}

seedAll()