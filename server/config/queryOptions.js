export const SORT_MODES = {
  newest: 'created_at DESC',
  oldest: 'created_at ASC',
  popular:   `(up_votes + down_votes) DESC`,
  prosecute: `((down_votes - up_votes)/total_votes) DESC`,
  defend:    `((up_votes - down_votes)/total_votes) DESC`,
  countdown: 'phase_end ASC NULLS LAST',
}

export const FILTER_MODES = {
  ALL: `TRUE`,
  ACTIVE: `phase_end IS NOT NULL`,
  ENDED: `phase_end IS NULL`,
  PROVISIONAL: `phase = 'PROVISIONAL' `,
  DISCOVERY: `phase = 'DISCOVERY' `,
  ARGUMENT: `phase = 'ARGUMENT' `,
  JURY_DELIBERATION: `phase = 'JURY_DELIBERATION' `,
  RULING: `phase = 'RULING' `,
  CLOSED: `phase = 'CLOSED' `,
  WITHDRAWN: `phase = 'WITHDRAWN' `,
  DISMISSED: `phase = 'DISMISSED' `
}