import { pool } from '../config/database.js'
import { DateTime } from 'luxon'
import { isPositiveInt } from './validation.js'
import { NotFoundError, PhaseError, IDError } from './errors.js'

const UP = 'UP';
const DOWN = 'DOWN';

const SUBMISSION_TYPE_CONFIG = {
    CASE: {
        table: "cases",
        id_column: "case_id",
        phase_window: 'PROVISIONAL',
    },
    EVIDENCE: {
      table: "evidence",
      id_column: "evidence_id",
      phase_window: 'DISCOVERY',
    },
    ARGUMENT: {
        table: "arguments",
        id_column: "arg_id",
        phase_window: 'ARGUMENT',  
    },
};

async function validateParams(params){
  let { case_id, submission_type, submission_id, user_id, reaction } = params;
  const {table, id_column, phase_window} = SUBMISSION_TYPE_CONFIG[submission_type]

  params.user_id = Number(user_id)

  if (!(submission_type in SUBMISSION_TYPE_CONFIG))
    throw new NotFoundError(`Submission type ${submission_type}`)

  let parsed_submission_id = Number(submission_id)
  if (!isPositiveInt(parsed_submission_id))
    throw new IDError(submission_id, table)
  params.submission_id = parsed_submission_id
  
  if (![UP, DOWN, null].includes(reaction)){
    let error = new Error("Invalid reaction. Must be UP or DOWN.");
    error.status = 422;
    throw new error;
  }

  let parsed_case_id = Number(submission_id)
  if (!isPositiveInt(parsed_case_id))
    throw new IDError(submission_id, table)
  params.submission_id = parsed_case_id

  // validate phase
  const case_res = await pool.query(`
    SELECT phase, phase_end FROM cases WHERE case_id = $1`,
    [case_id]
  );
   
  let case_data = case_res.rows
  if (case_data.length === 0)
    throw new NotFoundError('Case not found')
  case_data = case_data[0]

  if (case_data.phase != phase_window || case_data.phase_end < DateTime.now())
    throw new PhaseError(phase_window, case_data.phase)
}

export async function updateReaction(params) {
  const client = await pool.connect();

  try {
    await validateParams(params)

    let { case_id, submission_type, submission_id, user_id, reaction } = params;
    const {table, id_column, phase_window} = SUBMISSION_TYPE_CONFIG[submission_type]
    
    await client.query('BEGIN');

    // lock submission. also locks reactions, as all reaction updates must pass submission lock first 
    const submission = await client.query(`
      SELECT 1 FROM ${table} WHERE ${id_column} = $1 FOR UPDATE`,
      [submission_id]
    );
    if (submission.rowCount === 0) 
      throw new NotFoundError('Submission')
    
    // Lock existing reaction row if it exists. FOR UPDATE redundant, but still need to make query for reaction
    const existing = await client.query(
      `SELECT reaction
         FROM reactions
        WHERE (submission_type, submission_id, user_id) = ($1, $2, $3)
        FOR UPDATE`,
      [submission_type, submission_id, user_id]
    );
    const oldReaction = existing.rows[0]?.reaction ?? null;

    // No-op if unchanged
    // if (oldReaction === reaction) {
    //   await client.query('COMMIT');
    //   return { 
    //     ok: true,
    //     status: 200, 
    //     data: {
    //       unchanged: true 
    //     }
    //   };
    // }
    if (reaction === null){
        // delete reaction
        await client.query(`
          DELETE 
            FROM reactions 
          WHERE (submission_type, submission_id, user_id) = ($1, $2, $3)`,
          [submission_type, submission_id, user_id]
        )
    }
    else{
        // Upsert reaction
        await client.query(`
          INSERT INTO reactions (submission_type, submission_id, user_id, reaction)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (submission_type, submission_id, user_id)
          DO UPDATE SET reaction = EXCLUDED.reaction`,
          [submission_type, submission_id, user_id, reaction]
        );
    }

    // Compute counter deltas
    const upDelta   = (reaction === UP  ) - (oldReaction === UP  );
    const downDelta = (reaction === DOWN) - (oldReaction === DOWN);

    // Atomic counter update
    const result = await client.query(
      `UPDATE ${table}
          SET up_votes   = up_votes + $1,
              down_votes = down_votes + $2
        WHERE ${id_column} = $3
        RETURNING up_votes, down_votes`,
      [upDelta, downDelta, submission_id]
    );

    await client.query('COMMIT');
    return {
      ok: true,
      status: 200,
      data: {
        // unchanged: false, 
        submission_id: submission_id,
        reaction: reaction,
        up_votes: result.rows[0].up_votes,
        down_votes: result.rows[0].down_votes
      }
    };

  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch(rollbackErr) {
      console.error("updateReaction: Rollback failed:", rollbackErr);
    }

    return {
      ok: false,
      status: err.status || 500,
      message: err.message
    }
  } finally {
    client.release();
  }
}