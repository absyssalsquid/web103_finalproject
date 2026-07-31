import { pool } from '../config/database.js'
import { updateReaction } from '../utils/reactionService.js'
import { DateTime } from "luxon";

import { uploadCaseImage, deleteCaseImage } from '../utils/imageUpload.js'
import { phaseDelta } from '../utils/phaseMath.js'
import { CASE_FILTER_MODES, CASE_SORT_MODES, EV_ARG_SORT_MODES, ARGUMENT_FILTER_MODES } from '../config/queryOptions.js'


const getCases = async (req, res) => {
  let { filterBy, sortBy, limit, page } = req.query
  const offset = (page-1) * limit;

  try {
    // calcualate last page
    const count_response = await pool.query(`
      SELECT COUNT(*)
      FROM cases
      WHERE ${CASE_FILTER_MODES[filterBy]}`)
    const count = Number(count_response.rows[0].count)
    const last_page = Math.ceil(count / limit)

    const response = await pool.query(`
      SELECT
        cases.*,
        (down_votes + up_votes) AS total_votes,
        users.username,
        users.image_url AS user_image_url,
        ach.name AS flair_name
      FROM cases
      JOIN users
        ON cases.user_id = users.user_id
      LEFT JOIN achievements AS ach
        ON users.flair = ach.achievement_id
      WHERE ${CASE_FILTER_MODES[filterBy]}
      ORDER BY ${CASE_SORT_MODES[sortBy]}
      LIMIT $1
      OFFSET $2
      `, [limit, offset])
    const entries = response.rows

    res.status(200).json({
      last_page,
      entries
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const createCase = async (req, res) => {
  let uploadedPublicId = null

  try {
    const { object_name, accusation } = req.body
    const { user_id } = req.token_payload.user
    const now = DateTime.now();
    const tomorrow = now.plus({days: 1})

    // TODO: limit verification

    let imageUrl = null
    if (req.file) {
      try {
        const uploaded = await uploadCaseImage(req.file.buffer)
        imageUrl = uploaded.url
        uploadedPublicId = uploaded.publicId
      } catch (uploadError) {
        console.log('Case image upload failed:', uploadError.message)
        return res.status(500).json({ error: 'Image upload failed.' })
      }
    }

    try {
      const response = await pool.query(`
        INSERT INTO cases (user_id, created_at, object_name, accusation, image_url, phase_start, phase_end)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING case_id, image_url`,
        [user_id, now, object_name, accusation, imageUrl, now.toISO(), tomorrow.toISO()]
      )

      res.status(201).json({ case_id: response.rows[0].case_id, image_url: response.rows[0].image_url })
    } catch (dbError) {
      // the case row was never created, so an uploaded image would be orphaned — clean it up
      if (uploadedPublicId) {
        try {
          await deleteCaseImage(uploadedPublicId)
        } catch (cleanupError) {
          console.log('Cleanup failed for orphaned Cloudinary asset:', uploadedPublicId, cleanupError.message)
        }
      }
      throw dbError
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

// Withdraw case (only by case author)
const withdrawCase = async (req, res) => {
  try {
    const { id } = req.params
    const now = DateTime.now().toISO();

    const response = await pool.query(`
      UPDATE cases
      SET (phase, phase_start, phase_end) = ($1, $2, $3)
      WHERE case_id = $4`,
      ['WITHDRAWN', now, null, id]
    )

    res.status(204)
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const getCase = async (req, res) => {
  // Get case card data
  try {
    const { id } = req.params
    const response = await pool.query(`
      SELECT
        cases.*,
        users.username,
        users.image_url AS user_image_url,
        ach.name AS flair_name
      FROM cases
      JOIN users
        ON cases.user_id = users.user_id
      LEFT JOIN achievements AS ach
        ON users.flair = ach.achievement_id
      WHERE case_id = $1`,
      [id]
    )
    if (response.rows.length === 0){
      res.status(404).json(null)
    }
    res.json(response.rows[0])
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const voteCase = async (req, res) => {
  // Vote on case (provisional phase)
  try {
    const params = {
      submission_type: 'case',
      submission_id: req.params.id,
      user_id: req.body.user_id,
      reaction: req.body.reaction,
    }
    const { status, message, data } = updateReaction(params)
    res.status(status).json(data || message)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' })
  }
}

// Get vote count for case
const voteCountCase = async (req, res) => {
  try {
    const { id } = req.params
    res.json({ upvotes: 0, downvotes: 0 })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const getCaseEvidence = async (req, res) => {
  // Get all evidence for case (?limit=20&page=1&sort=oldest|newest|most-voted)
  // console.log('getCaseEvidence')
  try {
    const { id } = req.params
    const { sortBy, limit, page } = req.query
    const offset = (page-1) * limit;

    // calcualate last page
    const count_response = await pool.query(`
      SELECT COUNT(*)
      FROM evidence
      WHERE case_id = $1
      `, [id])
    const count = Number(count_response.rows[0].count)
    const last_page = Math.ceil(count / limit)
    
    // entries
    const response = await pool.query(`
      SELECT
        evidence.*,
        users.username,
        users.image_url AS user_image_url,
        ach.name AS flair_name
      FROM evidence
      JOIN users
        ON evidence.user_id = users.user_id
      LEFT JOIN achievements AS ach
        ON users.flair = ach.achievement_id
      WHERE case_id = $1
      ORDER BY ${EV_ARG_SORT_MODES[sortBy]}
      LIMIT $2
      OFFSET $3
      `, [id, limit, offset])

    const entries = response.rows

    res.status(200).json({
      last_page,
      entries
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const getCaseArguments = async (req, res) => {
  // Get all arguments for case (?limit=20&page=1&sort=all|prosecution|defense)
  try {
    const { id } = req.params
    const { sortBy, filterBy, limit, page } = req.query
    const offset = (page-1) * limit;

    // calcualate last page
    const count_response = await pool.query(`
      SELECT COUNT(*)
      FROM arguments
      WHERE case_id = $1
      `, [id])
    const count = Number(count_response.rows[0].count)
    const last_page = Math.ceil(count / limit)

    const response = await pool.query(`
      SELECT
        arguments.*,
        users.username,
        users.image_url AS user_image_url,
        ach.name AS flair_name
      FROM arguments
      JOIN users
        ON arguments.user_id = users.user_id
      LEFT JOIN achievements AS ach
        ON users.flair = ach.achievement_id
      WHERE case_id = $1 AND ${ARGUMENT_FILTER_MODES[filterBy]}
      ORDER BY ${EV_ARG_SORT_MODES[sortBy]}
      LIMIT $2
      OFFSET $3
    `, [id, limit, offset])

    let entries = response.rows
    const argIds = entries.map(e => e.arg_id);

    // add evidence citations to arguments
    const evResponse = await pool.query(`
      SELECT
          aef.arg_id,
          COALESCE(
              json_agg(
                  json_build_object(
                      'evidence_num', ev.evidence_num,
                      'text', ev.text
                  )
                  ORDER BY ev.evidence_num
              ),
              '[]'::json
          ) AS ev_citations
      FROM argument_evidence_refs AS aef
      JOIN evidence AS ev
          ON aef.evidence_id = ev.evidence_id
      WHERE aef.arg_id = ANY($1)
      GROUP BY aef.arg_id
    `, [argIds])
    const evidenceMap = new Map(
      evResponse.rows.map(row => [row.arg_id, row.ev_citations])
    );

    for (const entry of entries) {
      entry.evidence_citations = evidenceMap.get(entry.arg_id) ?? [];
    }

    // add case citations to arguments
    const caseResponse = await pool.query(`
      SELECT
        acr.arg_id,
        COALESCE(
          json_agg(
            json_build_object(
              'case_id', c.case_id,
              'judge_ruling', c.judge_ruling
            )
            ORDER BY c.case_id
          ),
          '[]'::json
        ) AS case_citations
      FROM argument_case_refs AS acr
      JOIN cases AS c
        ON acr.refd_case_id = c.case_id
      WHERE acr.arg_id = ANY($1)
      GROUP BY acr.arg_id
    `, [argIds]);

    const caseMap = new Map(
      caseResponse.rows.map(row => [row.arg_id, row.case_citations])
    );

    for (const entry of entries) {
      entry.case_citations = caseMap.get(entry.arg_id) ?? [];
    }

    res.status(200).json({
      last_page,
      entries
    })
  } catch (error) {
    console.log("getCaseArguments", error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const getJurySummary = async (req, res) => {
  const { id } = req.params
  // Get jury summary (count during phase, breakdown after phase ends)
  try {
    const phase_response = await pool.query(`
      SELECT phase
      FROM cases
      WHERE case_id = $1
    `, [id])

    if (phase_response.rows.length === 0)
      return res.status(404).json({ error: 'Case not found.' })

    const {phase} = phase_response.rows[0]
    const phDelta = phaseDelta(phase, 'JURY_DELIBERATION')
    if (phDelta > 0)
      return res.status(400).json({ error: 'Jury deliberation has not begun yet.' })

    const summary_response = await pool.query(`
      SELECT vote, COUNT(*)
      FROM jury_assignments
      WHERE case_id = $1
        AND vote IS NOT NULL
      GROUP BY vote
    `, [id])

    const breakdown = {};
    for (const row of summary_response.rows) {
      breakdown[row.vote] = Number(row.count);
    }
    const total = Object.values(breakdown).reduce((acc, x) => acc + x, 0);
    const ret = { total };

    // if phase has passed, return breakdown and verdict
    if (phDelta < 0) {
      breakdown.GUILTY ??= 0;
      breakdown.NOT_GUILTY ??= 0;

      let verdict = null;
      if (breakdown.GUILTY > breakdown.NOT_GUILTY)
        verdict = 'GUILTY';
      else if (breakdown.GUILTY < breakdown.NOT_GUILTY)
        verdict = 'NOT_GUILTY';
      else
        verdict = 'TB_PECKED_AT';

      ret.verdict = verdict;
      ret.breakdown = breakdown;
    }

    res.status(200).json(ret);
  } catch (error) {
    console.log("getJurySummary", error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const submitRuling = async (req, res) => {
  // Submit judge ruling after jury deliberation (only by judge)
  try {
    const { id } = req.params
    const { ruling } = req.body
    res.json({ /* ruling data */ })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const changePhase = async (req, res) => {
  try {
    const { id } = req.params
    const { targetPhase } = req.body
    const newStart = DateTime.now()
    const newEnd = newStart.plus({days:1})

    const response = await pool.query(`
      UPDATE cases 
      SET (phase, phase_start, phase_end) = ($1, $2, $3)
      WHERE case_id = $4`,
      [targetPhase, newStart, newEnd, id]
    )
    const data = response.rows[0]

    // Update case phase (for rollback or manual advance, only presiding judge can do)
    res.json({ /* updated case */ })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' })
  }
}

export default { getCases, createCase, withdrawCase, getCase, voteCase, voteCountCase, getCaseEvidence, getCaseArguments, getJurySummary, submitRuling, changePhase }
