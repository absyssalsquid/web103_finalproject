import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import './config/dotenv.js'

import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'
import userRouter from './routes/users.js'
import caseRouter from './routes/cases.js'
import evidenceRouter from './routes/evidence.js'
import argumentsRouter from './routes/arguments.js'
import juryRouter from './routes/jury.js'

const corsOptions = {
    origin: 'http://localhost:5173',                      // Restrict to this origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],   // Allowed HTTP verbs
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true                                     // Allow cookies/auth headers
};

const app = express()
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));


app.get('/', (req, res) => {
  res.status(200).send('<h1 style="text-align: center; margin-top: 50px;">Bird Court API</h1>')
})

app.use('/auth', authRouter)
app.use('/me', meRouter)
app.use('/users', userRouter)
app.use('/cases', caseRouter)
app.use('/evidence', evidenceRouter)
app.use('/arguments', argumentsRouter)
app.use('/jury', juryRouter)


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
})