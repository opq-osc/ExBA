import { existsSync, mkdirSync } from 'fs'
import { IMahiroUse } from 'mahiro'
import { join } from 'path'
import { draw } from 'exba-node'

const prefix = ['ba', 'BA', 'exba', 'EXBA', 'ExBA'] as const
const isMatchPrefix = (msg: string) => {
  // early return
  if (!msg?.length) {
    return false
  }
  if (!msg.includes(' ')) {
    return false
  }
  const firstSpaceIndex = msg.indexOf(' ')
  const lastSpaceIndex = msg.lastIndexOf(' ')
  if (!~firstSpaceIndex || !~lastSpaceIndex) {
    return false
  }
  if (firstSpaceIndex === lastSpaceIndex) {
    return false
  }
  return prefix.some((i) => {
    return msg.startsWith(`${i} `)
  })
}

export const ExBA = () => {
  const use: IMahiroUse = async (mahiro) => {
    const logger = mahiro.logger.withTag('ExBA') as typeof mahiro.logger
    logger.info('loading ExBA plugin...')

    const _ = mahiro.utils.lodash

    mahiro.onGroupMessage('ExBA', async (useful) => {
      const msg = useful?.msg?.Content

      if (!msg?.length) {
        return
      }
      const trimmed = _.trim(msg) as string
      if (!trimmed?.length) {
        return
      }

      if (isMatchPrefix(trimmed)) {
        const firstSpaceIndex = trimmed.indexOf(' ')
        const msgWithoutPrefix = trimmed.slice(firstSpaceIndex + 1)
        const trimmedMsg = _.trim(msgWithoutPrefix)
        if (!trimmedMsg?.length) {
          return
        }

        const secondSpaceIndex = trimmedMsg.indexOf(' ')
        if (!~secondSpaceIndex) {
          return
        }
        const leftText = trimmedMsg.slice(0, secondSpaceIndex)
        const rightText = trimmedMsg.slice(secondSpaceIndex + 1)
        const leftTextTrimmed = _.trim(leftText)
        const rightTextTrimmed = _.trim(rightText)
        if (!leftTextTrimmed?.length || !rightTextTrimmed?.length) {
          return
        }

        // mk cache dir
        const cacheDir = join(__dirname, '.cache')
        if (!existsSync(cacheDir)) {
          mkdirSync(cacheDir)
        }

        // render
        logger.info(
          `ExBA: start render with leftText(${leftTextTrimmed.slice(
            0,
            10,
          )}) and rightText(${rightTextTrimmed.slice(0, 10)})...`,
        )
        try {
          const { userId, groupId } = useful
          const output = join(cacheDir, `${userId}.jpg`)
          await draw({
            text: {
              left: leftTextTrimmed,
              right: rightTextTrimmed,
            },
            output,
          })
          logger.info(`ExBA: render done, output: ${output}`)
          if (existsSync(output)) {
            // send
            logger.info(
              `ExBA: send image to group(${groupId}), user(${userId})`,
            )
            await mahiro.sendGroupMessage({
              groupId,
              fastImage: output,
            })

            // delete in 10s later
            setTimeout(() => {
              if (existsSync(output)) {
                logger.info(`ExBA: delete image cache, user(${userId})`)
                mahiro.utils.fsExtra.removeSync(output)
              }
            }, 10 * 1000)
          } else {
            logger.error(
              `ExBA: render not cause error, but not found output (${output})`,
            )
          }
        } catch (e) {
          logger.error(`ExBA: render error: ${e}`)
        }
      }
    })
  }
  return use
}
