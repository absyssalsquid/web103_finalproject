import { pool } from '../config/database.js'
import { NotFoundError, PhaseError } from './errors.js'

const UP = 'UP';
const DOWN = 'DOWN';

const config = {
    case: {
        table: "cases",
        idColumn: "case_id",
        phase_window: 'PROVISIONAL',
    },
    evidence: {
      table: "evidence",
      idColumn: "evidence_id",
      phase_window: 'DISCOVERY',
    },
    argument: {
        table: "arguments",
        idColumn: "argument_id",
        phase_window: 'ARGUMENT',  
    },
};

export async function updateReaction(params) {
  let { submission_type, submission_id, user_id, reaction } = params;

  // validate inputs
  submission_id = Number(submission_id);
  if (!Number.isInteger(submission_id))
      return {status: 422, message: 'Invalid submission id' }

  user_id = Number(user_id);
  if (!Number.isInteger(user_id))
      return {status: 422, message: 'Invalid user id' }
      
  const entity = config[submission_type];
  if (!entity) 
      return {status: 422, message: 'Invalid submission type' }
  const { table, idColumn } = entity;

  if (![UP, DOWN, null].includes(reaction)) 
      return {status: 422, message: 'Reaction must be UP, DOWN, or null' }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // validate user exists, early abort. later extract from jwt
    const user = await client.query(
      `SELECT user_id FROM users WHERE user_id = $1`,
      [user_id]
    );
    if (user.rowCount === 0)
      throw new NotFoundError('User')

    // lock submission. also locks reactions, as all reaction updates must pass submission lock first 
    const submission = await client.query(`
      SELECT phase FROM ${table} WHERE ${idColumn} = $1 FOR UPDATE`,
      [submission_id]
    );
    if (submission.rowCount === 0) 
      throw new NotFoundError('Submission')
    if (submission.rows[0].phase != phase_window)
      throw new PhaseError(phase_window, submission.rows[0].phase)

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
    if (oldReaction === reaction) {
      await client.query('COMMIT');
      return { 
        status: 200, 
        data: {
          unchanged: true 
        }
      };
    }
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
        WHERE ${idColumn} = $3
        RETURNING up_votes, down_votes`,
      [upDelta, downDelta, submission_id]
    );

    await client.query('COMMIT');
    return {
      status: 200,
      data: {
        unchanged: false, 
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
    const ret = {
      status: err.status || 500,
      message: err.message
    }
    console.error('updateReaction:', ret);
    return ret;
  } finally {
    client.release();
  }
}