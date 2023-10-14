import 'zx/globals'
import { draw } from '../src'
import { join } from 'path'

const run = async () => {
  const leftArg = argv?.left || argv?.l
  const rightArg = argv?.right || argv?.r
  const outputArg =
    argv?.output || argv?.o || join(process.cwd(), './output.jpg')

  console.log(`Generating ${outputArg}...`)

  const stringify = (s: boolean | number | string) => {
    if (typeof s === 'boolean') {
      throw new Error(`Please provide a string, not a boolean.`)
    }
    return `${s}`
  }

  await draw({
    text: {
      left: stringify(leftArg),
      right: stringify(rightArg),
    },
    output: outputArg,
  })
}

run()
