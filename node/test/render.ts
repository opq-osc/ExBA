import { join } from 'path'
import { draw } from '../src/draw'
import 'zx/globals'
import { replaceEnterChars } from '../src/utils'

const run = async () => {
  const fixtures = join(__dirname, './fixtures')
  if (fs.existsSync(fixtures)) {
    // remove dir
    fs.removeSync(fixtures)
  }
  fs.mkdirSync(fixtures)
  const task = async (left: string, right: string) => {
    const leftTrim = replaceEnterChars(left)
    const rightTrim = replaceEnterChars(right)
    await draw({
      output: join(fixtures, `./${leftTrim}_${rightTrim}.jpg`),
      text: {
        left,
        right,
      },
    })
  }

  // for generate logo
  if (process.env.DEBUG_LOGO) {
    await task('Ex Blue ', 'アーカイブ')
    return
  }

  // normal case
  await task('Blue', 'Archive')
  await task('碧蓝', '档案')
  await task('ブルー', 'アーカイブ')

  await task('我要玩', '碧蓝档案')
  await task('我要玩', '蔚蓝档案')
  await task('我要玩', 'Blue Archive')
  await task('我要玩', '原神')
  await task('你不许玩', '原神')

  await task('手机里有一款', '扮演老师的游戏')

  await task('电脑里有一款', '只有商城在更新的游戏')
  await task('电脑里有一款', '四字二刺螈游戏')

  await task('ac', '12')
  await task('ac', '123')
  await task('ac', 'abc')
  await task('abcおはよ', 'さようなら')

  // edge case
  // short right text
  await task('ac', '|||')
  // empty text
  try {
    await task('', '')
  } catch {
    console.log('empty text')
  }
  try {
    await task('1', '')
  } catch {
    console.log('empty text')
  }
  // \n in text
  await task('abc\n', 'ab\nc')
  // too long text
  try {
    await task('超标了', '超标了超标了超标了超标了超标了,超标了超标了超标了超标了')
  } catch {
    console.log('too long text')
  }
}

run()
