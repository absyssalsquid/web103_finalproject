import { pool } from '../config/database.js'
import { updateReaction } from '../utils/reactionService.js'

const createArgument = async (req, res) => {
  // Create argument submission
  try {
    const { caseId, content } = req.body
    res.json({ /* argument data */ })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error." })
  }
}

const getArgument = async (req, res) => {
  // Get specific argument by ID
  try {
    const { id } = req.params
    res.json({ /* argument data */ })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error." })
  }
}

const deleteArgument = async (req, res) => {
  // Delete argument (restricted by phase)
  try {
    const { id } = req.params
    res.json({ success: true })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error." })
  }
}

const voteArgument = async (req, res) => {
  // Vote on argument (argument phase)
  try {
    const params = {
      submission_type: 'ARGUMENT',
      submission_id: req.params.id,
      user_id: req.token_payload.user.user_id,
      reaction: req.body.reaction,
      case_id: req.body.case_id,
    }
    
    const response = await updateReaction(params)
    if (!response.ok)
      return res.status(response.status).json(response.message)
    res.status(response.status).json(response.data)

  } catch (error) {
    console.log("voteArgument", error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const voteCountArgument = async (req, res) => {
  // Get vote count for argument
  try {
    const { id } = req.params
    res.json({ upvotes: 0, downvotes: 0 })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error." })
  }
}

export default { createArgument, getArgument, deleteArgument, voteArgument, voteCountArgument }
