import { supabase } from '../client.js'

const getLimits = async (req, res) => {
  try {
    // Get global limits configuration
    res.json({ /* limits data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export default { getLimits }
