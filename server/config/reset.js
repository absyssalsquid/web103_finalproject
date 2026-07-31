import { pool } from './database.js'
import './dotenv.js'
import { LENGTH_LIMITS } from '../config/userRules.js'

// enums shared across tables, created before any table that uses them
const ENUMS = {
    submission_rxn:    `submission_rxn AS ENUM ('UP', 'DOWN')`,
    case_phase:        `case_phase AS ENUM ('PROVISIONAL', 'DISCOVERY', 'ARGUMENT', 'JURY_DELIBERATION', 'RULING', 'CLOSED', 'WITHDRAWN', 'DISMISSED')`,
    juror_vote:        `juror_vote AS ENUM ('GUILTY', 'NOT_GUILTY', 'INSUFFICIENT_EVIDENCE')`,
    verdict:           `verdict AS ENUM ('GUILTY', 'NOT_GUILTY', 'TB_PECKED_AT')`,
    argument_tag:      `argument_tag AS ENUM('DEFENSE, PROSECUTION')`,
    submission_type:   `submission_type AS ENUM('CASE, EVIDENCE, ARGUMENT')`,
    
    xp_event_reason:   `xp_event_reason AS ENUM ('SUBMISSION', 'JURY_VOTE', 'CASE_ADVANCED_TO_TRIAL', 'SUBMISSION_RXN', 'SUBMISSION_CITED')`,
    xp_event_ref_type: `xp_event_ref_type AS ENUM ('CASE', 'EVIDENCE', 'ARGUMENT', 'VOTE')`,
}

const SINGLE_INDEXES = {
    // users: ['total_xp'],
    cases: ['created_at', 'phase', 'phase_end'],
    evidence: ['created_at'],
    arguments: ['created_at'],
    jury_assignments: ['user_id', 'created_at'],
    reactions: ['user_id'],
}

const WILSON_FN = `
    CREATE OR REPLACE FUNCTION wilson_score(up_votes INT, down_votes INT)
    RETURNS DOUBLE PRECISION
    LANGUAGE sql
    IMMUTABLE
    AS $$
    SELECT
    CASE
    WHEN up_votes + down_votes = 0 THEN 0
    ELSE (
        (
        (up_votes::float / (up_votes + down_votes))
        + 3.8416 / (2 * (up_votes + down_votes))
        - 1.96 * sqrt(
            (
                (up_votes::float / (up_votes + down_votes))
                * (1 - up_votes::float / (up_votes + down_votes))
                + 3.8416 / (4 * (up_votes + down_votes))
            ) / (up_votes + down_votes)
            )
        ) / (1 + 3.8416 / (up_votes + down_votes))
    )
    END;
    $$;
`

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
            username    VARCHAR(${LENGTH_LIMITS.username_max}) NOT NULL,
            email       VARCHAR(500),
            pw_hash     VARCHAR(255) NOT NULL,
            image_url   VARCHAR(500),
            bio         VARCHAR(${LENGTH_LIMITS.bio_max}),
            total_xp    INT DEFAULT 0,
            created_at  TIMESTAMPTZ DEFAULT NOW(),
            flair       INT REFERENCES achievements(achievement_id),
            UNIQUE(username),
            UNIQUE(email),
            CONSTRAINT chk_min_length CHECK (length(username) >= ${LENGTH_LIMITS.username_min})
        )
    `,

    cases: `
        CREATE TABLE IF NOT EXISTS cases (
            case_id         SERIAL PRIMARY KEY,
            user_id         INT REFERENCES users(user_id),
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            object_name     VARCHAR(${LENGTH_LIMITS.object_name_max}),
            accusation      VARCHAR(${LENGTH_LIMITS.accusation_max}),
            image_url       VARCHAR(500),
            verdict         verdict,
            judge_id        INT REFERENCES users(user_id),
            judge_ruling    VARCHAR(300),
            phase           case_phase DEFAULT 'PROVISIONAL',
            phase_start     TIMESTAMPTZ,
            phase_end       TIMESTAMPTZ,
            up_votes        INT DEFAULT 0,
            down_votes      INT DEFAULT 0,
            CONSTRAINT chk_min_length_obj CHECK (length(object_name) >= ${LENGTH_LIMITS.object_name_min}),
            CONSTRAINT chk_min_length_acc CHECK (length(accusation) >= ${LENGTH_LIMITS.accusation_min}) 
        )
    `,

    evidence: `
        CREATE TABLE IF NOT EXISTS evidence (
            evidence_id     SERIAL PRIMARY KEY,
            case_id         INT REFERENCES cases(case_id) NOT NULL,
            user_id         INT REFERENCES users(user_id) NOT NULL,
            evidence_num    INT,
            text            VARCHAR(${LENGTH_LIMITS.evidence_max}),
            image_url       VARCHAR(500),
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            up_votes        INT,
            down_votes      INT,
            UNIQUE(case_id, evidence_num),
            CONSTRAINT chk_min_length_ev CHECK (length(text) >= ${LENGTH_LIMITS.evidence_min}) 
        )
    `,

    arguments: `
        CREATE TABLE IF NOT EXISTS arguments (
            arg_id          SERIAL PRIMARY KEY,
            case_id         INT REFERENCES cases(case_id) NOT NULL,
            user_id         INT REFERENCES users(user_id) NOT NULL,
            arg_num         INT,
            text            VARCHAR(${LENGTH_LIMITS.argument_max}),
            argument_tag    argument_tag,
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            up_votes        INT,
            down_votes      INT,
            UNIQUE(case_id, arg_num),
            CONSTRAINT chk_min_length_arg CHECK (length(text) >= ${LENGTH_LIMITS.argument_min}) 
        )
    `,

    argument_case_refs: `
        CREATE TABLE IF NOT EXISTS argument_case_refs (
            arg_id          INT REFERENCES arguments(arg_id),
            refd_case_id    INT REFERENCES cases(case_id),
            PRIMARY KEY(arg_id, refd_case_id)
        )
    `,

    argument_evidence_refs: `
        CREATE TABLE IF NOT EXISTS argument_evidence_refs (
            arg_id          INT REFERENCES arguments(arg_id),
            evidence_id     INT REFERENCES evidence(evidence_id),
            PRIMARY KEY(arg_id, evidence_id)
        )
    `,

    reactions: `
        CREATE TABLE IF NOT EXISTS reactions (
            submission_type     submission_type,
            submission_id       INT,
            user_id             INT REFERENCES users(user_id) NOT NULL,
            reaction            submission_rxn,
            PRIMARY KEY(submission_type, submission_id, user_id),
            CONSTRAINT chk_rxn_valid CHECK ( reaction in ('UP', 'DOWN', NULL) )
        )
    `,

    jury_assignments: `
        CREATE TABLE IF NOT EXISTS jury_assignments (
            id                  SERIAL PRIMARY KEY,
            case_id             INT REFERENCES cases(case_id) NOT NULL,
            user_id             INT REFERENCES users(user_id) NOT NULL,
            vote                juror_vote,
            created_at          TIMESTAMPTZ DEFAULT NOW(),
            expires_at          TIMESTAMPTZ,
            completed_at        TIMESTAMPTZ,
            UNIQUE(case_id, user_id)
        )
    `,

    jury_arg_refs: `
        CREATE TABLE IF NOT EXISTS jury_arg_refs (
            ja_id       INT REFERENCES jury_assignments(id),
            arg_id      INT REFERENCES arguments(arg_id),
            PRIMARY KEY(ja_id, arg_id)
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
            earned_at       TIMESTAMPTZ DEFAULT NULL,
            PRIMARY KEY(user_id, achievement_id)
        )
    `,
}

const createEnum = async (enum_name, enum_vals) => {
    const query = `
        DO $$ BEGIN
            CREATE TYPE ${enum_vals};
            EXCEPTION WHEN duplicate_object THEN null;
        END $$;
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
        await pool.query(`DROP TABLE IF EXISTS ${table_name} CASCADE`)
        console.log(`🎉 table deleted: ${table_name}`)
    } catch (err) {
        console.error(`⚠️ error deleting table: ${table_name}`, err)
    }
}

const createIndex = async(table_name, field) => {
    const query = `CREATE INDEX idx_${table_name}_${field} ON ${table_name}(${field});`
    try {
        await pool.query(query)
        console.log(`🎉 index created: ${table_name}, ${field}`)
    } catch (err) {
        console.error(`⚠️ error creating index: ${table_name}, ${field}`, err)
    }
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

    console.log("creating indexes")
    for (const [table_name, fields] of Object.entries(SINGLE_INDEXES)) {
        for (const field of fields) {
            await createIndex(table_name, field)
        }
    }

    try {
        await pool.query(WILSON_FN)
        console.log(`🎉 created wilson_score`)
    } catch (err) {
        console.error(`⚠️ error creating wilson_score`, err)
    }

    await pool.end(); 
}

doAll();