import { pool } from '../database.js'
import bcrypt from 'bcrypt'
import { DateTime} from 'luxon'

import '../dotenv.js'

import { ALL_TABLES } from './data/tables.js'
import { APP_INCEPTION_DATE } from './data/generators.js'
import achievements from './data/achievements.js'
import users from './data/users.js'
import usernames from './data/usernames.js'
import { getRandomDate, generateUsers, generateUserAchievements } from './data/generators.js'

import { bulletPt, processResults } from './utils.js'

// -----------------------------------------  ----------------------------------------- 

async function insertUser(user){
    const passwordHash = await bcrypt.hash(user.pw, 12);
    if (!user.created_at)
        user.created_at = getRandomDate(APP_INCEPTION_DATE)

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

// -----------------------------------------  ----------------------------------------- 

async function seedUserData(){
    // clear tables
    for (const table of ALL_TABLES.toReversed()){
        await pool.query(`DELETE FROM ${table}`)
        console.log(`wiped table ${table}`)
    } 

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

    await pool.end(); 
}

seedUserData()