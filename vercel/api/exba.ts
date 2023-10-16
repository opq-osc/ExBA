import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handler as serverHandler } from 'exba-server/handler'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (!request.url) {
    response.status(400)
    return
  }

  // @ts-ignore
  serverHandler(request, response)
}
