import express from 'express'
import pino from 'pino'
import { LogLayer, LoggerType } from '../src'

// We only need to create the logging library instance once
const p = pino({
  level: 'trace',
})

const app = express()
const port = 3000

// Define logging middleware
app.use((req, res, next) => {
  req.log = new LogLayer({
    logger: {
      instance: p,
      type: LoggerType.PINO,
    },
    // Add a request id for each new request
  }).withContext({
    // generate a random id
    reqId: Math.floor(Math.random() * 100000).toString(10),
    // let's also add in some additional details about the server
    env: 'prod',
  })

  next()
})

app.get('/', (req, res) => {
  // Log the message
  req.log.info('sending hello world response')

  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
