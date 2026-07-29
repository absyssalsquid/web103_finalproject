import { pool } from './database.js'
import bcrypt from 'bcrypt'

import { dateWithDelta } from '../utils/time.js'

import './dotenv.js'

import achievements from '../data/achievements.js'
import users from '../data/users.js'
import cases from '../data/cases.js'
// import evidence from '../data/evidence.js'
// import arguments from '../data/arguments.js'

const CREATED_AT_DELTA_DAYS = {
    PROVISIONAL: -1,
    DISCOVERY: -2,
    ARGUMENT: -3,
    JURY_DELIBERATION: -4,
    RULING: -5,
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
            console.error(`⚠️ error seeding achievement: ${achievements[i].name}`, result.reason)
        }
    })
    const symbol = success_count === achievements.length ? '🎉' : '⚠️'
    console.log(`${symbol} seeded ${success_count}/${achievements.length} achievements`)
}


async function insertUser(user){
    const passwordHash = await bcrypt.hash(user.pw, 12);
    
    try {
        const result = await pool.query(`
            INSERT INTO users (email, username, pw_hash, created_at, flair, bio)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.email, user.username, passwordHash, user.created_at.toISOString(), user.flair, user.bio]
        );
        console.log(`🎉 user created: ${user.username}`)
    } catch (err) {
        console.error(`⚠️ error creating user: ${user.username}`, err)
    }
}

async function insertCase(cased){
    if (cased.phase_start == null){
        cased.phase_start = dateWithDelta({days:-1}, cased.phase_end)
        cased.created_at = dateWithDelta({days: CREATED_AT_DELTA_DAYS[cased.phase]}, cased.phase_end)
    }
    try {
        const result = await pool.query(`
            INSERT INTO cases (
                user_id, created_at, 
                object_name, accusation, image_url, 
                phase, phase_start, phase_end )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [cased.user_id, cased.created_at.toISOString(), 
             cased.object_name, cased.accusation, cased.image_url,
             cased.phase, cased.phase_start.toISOString(), cased.phase_end?.toISOString(), 
            ]
        );
        console.log(`🎉 case created: ${cased.object_name}`)
    } catch (err) {
        console.error(`⚠️ error creating case: ${cased.object_name}`, err)
    }
}

async function seedAll(){
    await seedAchievements();

    for (const user of users) {
        await insertUser(user)
    }

    for (const cased of cases) {
        await insertCase(cased)
    }
    await pool.end(); 
}

seedAll()