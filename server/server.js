import express from 'express'
dotenv.config()

import userRouter from './routes/users.js'
import caseRouter from './routes/cases.js'

const app = express()

const PORT = process.env.PORT || 3001

app.get('/', (req, res) => {
  res.status(200).send('<h1 style="text-align: center; margin-top: 50px;">UnEarthed API</h1>')
})

app.use('/users', userRouter)
app.use('/cases', caseRouter)


app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
})