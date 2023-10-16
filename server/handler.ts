import type { VercelApiHandler } from '@vercel/node'
import { draw } from 'exba-node'

const pluginName = `ExBA`
export const handler: VercelApiHandler = async (req, res) => {
  try {
    const left = req.query?.left
    const right = req.query?.right

    if (
      !left?.length ||
      !right?.length ||
      typeof left !== 'string' ||
      typeof right !== 'string'
    ) {
      res.status(400).send({
        code: 1,
        msg: 'text cannot be empty',
      })
      return
    }

    console.log(`${pluginName}: trigger render`)
    const readStream = await draw({
      text: {
        left,
        right,
      },
      output: './out.jpg',
      stream: true,
    })
    console.log(`${pluginName}: render success`)
    // jpg response header
    res.setHeader('Content-Type', 'image/jpeg')
    // pass read stream to response
    readStream.pipe(res)
  } catch (e) {
    // console.log('error: ', e);
    res.send({
      code: 1,
      msg: 'render error',
    })
  }
}