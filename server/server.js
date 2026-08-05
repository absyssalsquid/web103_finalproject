import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'

import './config/dotenv.js'

import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'
import userRouter from './routes/users.js'
import caseRouter from './routes/cases.js'
import evidenceRouter from './routes/evidence.js'
import argumentsRouter from './routes/arguments.js'
import juryRouter from './routes/jury.js'
import rulesRouter from './routes/rules.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || 'https://bird-court.onrender.com'
      : 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

const app = express()
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use('/api/auth', authRouter)
app.use('/api/me', meRouter)
app.use('/api/users', userRouter)
app.use('/api/cases', caseRouter)
app.use('/api/evidence', evidenceRouter)
app.use('/api/arguments', argumentsRouter)
app.use('/api/jury', juryRouter)
app.use('/api/rules', rulesRouter)

// Serve static files from the built React app
// app.use(express.static(path.join(__dirname, '../client/dist')))

// // Fallback: serve index.html for client-side routing
// app.use((req, res) => {
//   res.sendFile(path.join(__dirname, '../client/dist/index.html'))
// })

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
})