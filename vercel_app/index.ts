import { VercelRequest, VercelResponse } from '@vercel/node'
import handler from '../server/handle'

export default async function (req: VercelRequest, res: VercelResponse) {
  await handler(req, res)
}

