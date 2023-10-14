import { test, expect } from 'vitest'
import { replaceEnterChars } from '../src/utils'

test('replace enter chars', () => {
  expect(replaceEnterChars('a\r\nbc\n')).toEqual('abc')
  expect(replaceEnterChars('a\nbc\r')).toEqual('abc')
  expect(replaceEnterChars('a\rbc\r\n')).toEqual('abc')
  expect(replaceEnterChars('a\nbc\n\r')).toEqual('abc')
  expect(replaceEnterChars('a\nbc\n\r\n')).toEqual('abc')
})
