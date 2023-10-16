import express from 'express'
import handler from './handle'


const run = async () => {
  const app = express()
  app.get(`/api/v1/exba`, async (req, res) => {
    await handler(req, res)
  })
  const port = process.env.PORT || 9528
  app.listen(port, () => {
    console.log(`ExBA server started at ${port}`)
    console.log(`api point: http://localhost:${port}/api/v1/exba`)
  })
}

run()
