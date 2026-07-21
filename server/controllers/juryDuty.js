import { supabase } from '../client.js'

const assignCase = async (req, res) => {
  try {
    // Auto-assign user to random eligible case with >2hrs remaining in jury phase
    res.json({ /* assignment data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params
    // Get specific jury assignment details
    res.json({ /* assignment data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const castBallot = async (req, res) => {
  try {
    const { assignment_id } = req.params
    const { verdict, bestArgumentIds } = req.body
    // Submit jury verdict and best arguments (only during jury phase)
    // Delete previously voted best arguments from jury_arg_refs before adding new ones
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export default { assignCase, getAssignment, castBallot }
