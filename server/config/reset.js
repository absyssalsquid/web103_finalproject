import { pool } from './database.js'
import './dotenv.js'
import achievements from '../data/achievements.js'

// enums shared across tables, created before any table that uses them
const ENUMS = {
    submission_vote:   `submission_vote AS ENUM ('UP', 'DOWN')`,
    case_phase:        `case_phase AS ENUM ('PROVISIONAL', 'DISCOVERY', 'ARGUMENT', 'JURY_DELIBERATION', 'RULING', 'CLOSED')`,
    juror_vote:        `juror_vote AS ENUM ('GUILTY', 'NOT_GUILTY', 'INSUFFICIENT_EVIDENCE')`,
    verdict:           `verdict AS ENUM ('GUILTY', 'NOT_GUILTY', 'TB_PECKED_AT')`,
    argument_tag:      `argument_tag AS ENUM('DEFENSE, PROSECUTION')`,
    
    xp_event_reason:   `xp_event_reason AS ENUM ('SUBMISSION', 'JURY_VOTE', 'CASE_ADVANCED_TO_TRIAL', 'SUBMISSION_VOTE', 'SUBMISSION_CITED')`,
    xp_event_ref_type: `xp_event_ref_type AS ENUM ('CASE', 'EVIDENCE', 'ARGUMENT', 'VOTE')`,
}

// in create order (accounts for FK dependencies).
const TABLES = {
    achievements: `
        CREATE TABLE IF NOT EXISTS achievements (
            achievement_id  INT PRIMARY KEY,
            name            VARCHAR(80) NOT NULL,
            requirements    VARCHAR(120),
            threshold       INT,
            image_url       VARCHAR(500)
        )
    `,

    users: `
        CREATE TABLE IF NOT EXISTS users (
            user_id     SERIAL PRIMARY KEY,
            username    VARCHAR(40) NOT NULL,
            image_url   VARCHAR(500),
            bio         VARCHAR(500),
            total_xp    INT DEFAULT 0,
            created_at  TIMESTAMPTZ DEFAULT NOW(),
            flair       INT REFERENCES achievements(achievement_id),
            UNIQUE(username)
        )
    `,

    cases: `
        CREATE TABLE IF NOT EXISTS cases (
            case_id         SERIAL PRIMARY KEY,
            user_id         INT REFERENCES users(user_id),
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            object_name     VARCHAR(60),
            accusation      VARCHAR(250),
            image_url       VARCHAR(500),
            verdict         verdict,
            judge_id        INT REFERENCES users(user_id),
            judge_ruling    VARCHAR(300),
            phase           case_phase,
            phase_start     TIMESTAMPTZ,
            phase_end       TIMESTAMPTZ
        )
    `,

    evidence: `
        CREATE TABLE IF NOT EXISTS evidence (
            evidence_id     SERIAL PRIMARY KEY,
            case_id         INT REFERENCES cases(case_id),
            user_id         INT REFERENCES users(user_id),
            evidence_num    INT,
            text            VARCHAR(200),
            image_url       VARCHAR(500),
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(case_id, evidence_num)
        )
    `,

    arguments: `
        CREATE TABLE IF NOT EXISTS arguments (
            arg_id          SERIAL PRIMARY KEY,
            case_id         INT REFERENCES cases(case_id),
            user_id         INT REFERENCES users(user_id),
            arg_num         INT,
            text            VARCHAR(600),
            argument_tag    argument_tag,
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(case_id, arg_num)
        )
    `,

    argument_case_refs: `
        CREATE TABLE IF NOT EXISTS argument_case_refs (
            arg_id      INT REFERENCES arguments(arg_id),
            case_id     INT REFERENCES cases(case_id),
            PRIMARY KEY(arg_id, case_id)
        )
    `,

    argument_evidence_refs: `
        CREATE TABLE IF NOT EXISTS argument_evidence_refs (
            arg_id      INT REFERENCES arguments(arg_id),
            evidence_id INT REFERENCES evidence(evidence_id),
            PRIMARY KEY(arg_id, evidence_id)
        )
    `,

    case_submission_votes: `
        CREATE TABLE IF NOT EXISTS case_submission_votes (
            case_id     INT REFERENCES cases(case_id),
            user_id     INT REFERENCES users(user_id),
            vote        submission_vote,
            PRIMARY KEY(case_id, user_id)
        )
    `,

    evidence_votes: `
        CREATE TABLE IF NOT EXISTS evidence_votes (
            evidence_id INT REFERENCES evidence(evidence_id),
            user_id     INT REFERENCES users(user_id),
            vote        submission_vote,
            PRIMARY KEY(evidence_id, user_id)
        )
    `,

    argument_votes: `
        CREATE TABLE IF NOT EXISTS argument_votes (
            arg_id      INT REFERENCES arguments(arg_id),
            user_id     INT REFERENCES users(user_id),
            vote        submission_vote,
            PRIMARY KEY(arg_id, user_id)
        )
    `,

    jury_assignments: `
        CREATE TABLE IF NOT EXISTS jury_assignments (
            id           SERIAL PRIMARY KEY,
            case_id      INT REFERENCES cases(case_id),
            user_id      INT REFERENCES users(user_id),
            vote         juror_vote,
            created_at   TIMESTAMPTZ DEFAULT NOW(),
            completed_at TIMESTAMPTZ,
            UNIQUE(case_id, user_id)
        )
    `,

    jury_arg_refs: `
        CREATE TABLE IF NOT EXISTS jury_arg_refs (
            jv_id       INT REFERENCES jury_assignments(id),
            arg_id      INT REFERENCES arguments(arg_id),
            PRIMARY KEY(jv_id, arg_id)
        )
    `,

    xp_events: `
        CREATE TABLE IF NOT EXISTS xp_events (
            xp_event_id     SERIAL PRIMARY KEY,
            user_id         INT REFERENCES users(user_id),
            amount          INT,
            reason          xp_event_reason,
            reference_type  xp_event_ref_type,
            reference_id    INT,
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, reason, reference_type, reference_id)
        )
    `,

    user_achievements: `
        CREATE TABLE IF NOT EXISTS user_achievements (
            user_id         INT REFERENCES users(user_id),
            achievement_id  INT REFERENCES achievements(achievement_id),
            progress        INT DEFAULT 0,
            earned_at       TIMESTAMPTZ,
            PRIMARY KEY(user_id, achievement_id)
        )
    `,
}

const createEnum = async (enum_name, enum_vals) => {
    const query = `
        DO $$ BEGIN
            CREATE TYPE ${enum_vals};
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    `
    try {
        await pool.query(query)
        console.log(`🎉 enum created: ${enum_name}`)
    } catch (err) {
        console.error(`⚠️ error creating enum: ${enum_name}`, err)
    }
}

const deleteEnum = async (enum_name) => {
    const query = `DROP TYPE ${enum_name}`
    try {
        await pool.query(query)
        console.log(`🎉 enum deleted: ${enum_name}`)
    } catch (err) {
        console.error(`⚠️ error deleting enum: ${enum_name}`, err)
    }
}

const createTable = async (table_name, query) => {
    try {
        await pool.query(query)
        console.log(`🎉 table created: ${table_name}`)
    } catch (err) {
        console.error(`⚠️ error creating table: ${table_name}`, err)
    }
}

const deleteTable = async (table_name) => {
    try {
        await pool.query(`DROP TABLE IF EXISTS ${table_name}`)
        console.log(`🎉 table deleted: ${table_name}`)
    } catch (err) {
        console.error(`⚠️ error deleting table: ${table_name}`, err)
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
            console.error(`⚠️ error seeding achievement: ${achievements[i].name}`, result.reason)
        }
    })
    const symbol = success_count === achievements.length ? '🎉' : '⚠️'
    console.log(`${symbol} seeded ${success_count}/${achievements.length} achievements`)
}

async function doAll(){
    console.log("deleting all tables")
    for (const [table_name, query] of Object.entries(TABLES).toReversed()) {
        await deleteTable(table_name);
    }

    console.log("deleting all enums")
    for (const [enum_name, query] of Object.entries(ENUMS)) {
        await deleteEnum(enum_name, query)
    }

    console.log("creating all enums")
    for (const [enum_name, query] of Object.entries(ENUMS)) {
        await createEnum(enum_name, query)
    }

    console.log("creating all tables")
    for (const [table_name, query] of Object.entries(TABLES)) {
        await createTable(table_name, query)
    }

    await seedAchievements();
}

doAll();