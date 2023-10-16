import { fabric } from 'fabric'
import type { TextOptions } from 'fabric/fabric-impl'
import { createWriteStream, existsSync, readFileSync, writeFileSync } from 'fs'
import { trimEnd, trimStart } from 'lodash'
import { join, parse } from 'path'
import { replaceEnterChars } from './utils'

export enum EFormat {
  jpg = 'jpg',
  png = 'png',
}

export interface IExBaOptions {
  /**
   * render text
   * @example { left: 'Blue', right: 'Archive' }
   */
  text: {
    left: string
    right: string
  }
  /**
   * output path
   * @example join('/some/path/to/output.png')
   * @example join('/some/path/to/output.jpg')
   * only support `jpg` and `png` format
   */
  output: string
  /**
   * generate stream
   * @default false
   */
  stream?: boolean
}

const assetsRoot = join(__dirname, './assets')
const fontNameForMain = 'Ro GSan Serif Std'
const fontNameForFallback = 'Glow Sans SC'
const fontFamily = `"${fontNameForMain}","${fontNameForFallback}"`
const loadFonts = () => {
  const fontPathForFallback = join(
    assetsRoot,
    './fonts/GlowSansSC-Normal-Heavy.otf',
  )
  const fontPathForMainSource = join(assetsRoot, './fonts/R.base64')
  const fontPathForMain = join('/tmp', 'R.otf')
  function initFont() {
    if (existsSync(fontPathForMain)) {
      return
    }
    const base64 = readFileSync(fontPathForMainSource, 'utf-8')
    writeFileSync(fontPathForMain, base64, 'base64')
  }
  initFont()
  // @ts-ignore
  fabric.nodeCanvas.registerFont(fontPathForMain, {
    family: fontNameForMain,
  })
  // @ts-ignore
  fabric.nodeCanvas.registerFont(fontPathForFallback, {
    family: fontNameForFallback,
  })
}

type Matrix = [number, number, number, number, number, number]

const isGenLogo = process.env.DEBUG_LOGO

const configs = {
  initialFontSize: 100,
  fontColor: {
    left: '#128AFA',
    right: '#2B2B2B',
  },
  padding: isGenLogo
    ? {
        top: 185,
        bottom: 140,
        x: 170,
        leftTrim: 30,
      }
    : {
        top: 100,
        bottom: 55,
        x: 85,
        leftTrim: 5,
      },
  scale: 2,
  strokeWidth: 10,
  transformMatrix: [1, 0, -0.4, 1, 0, 0],
  ring: {
    bottomOffset: 30,
  },
  cross: {
    bottomOffset: 10,
    leftOffset: 17,
    whiteStroke: {
      topLeftX(centerX: number, scale: number = 1) {
        return centerX - 13 * scale
      },
      topRightX(centerX: number, scale: number = 1) {
        return centerX + 14 * scale
      },
      bottom(bottomX: number, bottomY: number, scale: number = 1) {
        return {
          x: bottomX - 135 * scale,
          y: bottomY + 110 * scale,
        }
      },
    },
  },
  improve: {
    // strategy 1
    // rightLengthMax: 300,
  },
  safe: {
    maxCanvasWidth: 2500,
  },
} as const

const NAME = `ExBA`

export const draw = async (opts: IExBaOptions) => {
  const {
    text: { left, right },
    output,
    stream = false
  } = opts

  const ext = parse(output).ext?.slice(1) as EFormat | undefined
  if (!ext?.length) {
    throw new Error(
      `${NAME}: output file path missing extension, e.g. /some/path/to/output.png`,
    )
  }
  if (![EFormat.jpg, EFormat.png].includes(ext)) {
    throw new Error(
      `${NAME}: output file path extension should be 'jpg' or 'png', e.g. /some/path/to/output.png`,
    )
  }

  const format = ext as EFormat

  if (!left?.length || !right?.length) {
    throw new Error(`${NAME}: text missing`)
  }
  const leftText = trimStart(replaceEnterChars(left))
  const rightText = trimEnd(replaceEnterChars(right))
  if (!leftText?.length || !rightText?.length) {
    throw new Error(`${NAME}: text missing`)
  }
  const isPng = format === EFormat.png
  const needTransparentBg = isPng && process.env.DEBUG_EXBA

  // load fonts
  loadFonts()

  // config
  const {
    scale,
    padding,
    strokeWidth,
    fontColor,
    initialFontSize,
    transformMatrix,
    ring,
    cross,
    // improve,
    safe,
  } = configs
  const matrix = transformMatrix as Matrix

  // measure text length
  const createText = (
    opts: {
      text: string
      color: TextOptions['fill']
      fontSize: number
    } & TextOptions,
  ) => {
    const { text, color, fontSize, ...rest } = opts
    return new fabric.Text(text, {
      originX: 'left',
      originY: 'top',
      stroke: '#fff',
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      paintFirst: 'stroke',
      // font
      fontFamily,
      textAlign: 'center',
      fill: color,
      fontSize,
      // lock
      lockRotation: true,
      lockScalingY: true,
      lockScalingFlip: true,
      ...rest,
    })
  }

  // manual skew
  const performTransform = (obj: fabric.Text, toMatrix: Matrix) => {
    const currentT = obj.calcTransformMatrix()
    const mT = fabric.util.multiplyTransformMatrices(currentT, toMatrix)
    const options = fabric.util.qrDecompose(mT)
    const newCenter = { x: options.translateX, y: options.translateY }
    obj.set(options)
    obj.setPositionByOrigin(
      new fabric.Point(newCenter.x, newCenter.y),
      'center',
      'center',
    )
  }

  const fontSize = initialFontSize * scale

  // left font
  const leftTextIns = createText({
    text: leftText,
    color: fontColor.left,
    fontSize,
    // pos
    left: padding.x * scale,
    top: padding.top * scale,
    // stroke
    strokeWidth: strokeWidth * scale,
  })
  const leftTextInfo = {
    rightEdge: leftTextIns.width! + padding.x * scale,
    height: leftTextIns.height!,
  }

  // right font
  const rightTextIns = createText({
    text: rightText,
    color: fontColor.right,
    fontSize,
    // pos
    left: leftTextInfo.rightEdge,
    top: padding.top * scale,
    // stroke
    strokeWidth: strokeWidth * scale,
  })

  if (isGenLogo) {
    // [TEST] gradient logo
    leftTextIns.set({
      fill: new fabric.Gradient({
        colorStops: [
          { offset: 0, color: '#005bea' },
          { offset: 0.3, color: fontColor.left },
          { offset: 1, color: '#21d4fd' },
        ],
        // →
        coords: {
          x1: 0,
          y1: 0,
          x2: leftTextIns.width,
          y2: leftTextIns.height,
        },
      }),
    })
    rightTextIns.set({
      fill: new fabric.Gradient({
        colorStops: [
          { offset: 0, color: fontColor.right },
          { offset: 0.9, color: fontColor.right },
          { offset: 1, color: '#fff' },
        ],
        // →
        coords: {
          x1: 0,
          y1: 0,
          x2: rightTextIns.width,
          y2: rightTextIns.height,
        },
      }),
    })
    // [TEST] shadow
    rightTextIns.shadow = new fabric.Shadow({
      color: '#000',
      blur: 2,
      offsetX: 0,
      offsetY: 0,
    })
    leftTextIns.shadow = new fabric.Shadow({
      color: '#000',
      blur: 2,
      offsetX: 0,
      offsetY: 0,
    })
  }
  const rightTextInfo = {
    rightEdge: rightTextIns.width! + rightTextIns.left!,
    topEdge: rightTextIns.top!,
    leftEdge: rightTextIns.left!,
    width: rightTextIns.width!,
    bottomEdge: rightTextIns.top! + rightTextIns.height!,
  }

  // create canvas
  const canvasWidth = rightTextInfo.rightEdge + padding.x * scale
  const canvasHeight =
    leftTextInfo.height + (padding.top + padding.bottom) * scale

  // safe check: max canvas width
  const isVeryWide = canvasWidth >= safe.maxCanvasWidth * scale
  if (!isGenLogo && isVeryWide) {
    console.warn(
      `${NAME}: canvas width max ${safe.maxCanvasWidth}, but got ${canvasWidth}, ignore it`,
    )
    throw new Error(`Too long text`)
  }
  const canvas = new fabric.Canvas(null, {
    width: canvasWidth,
    height: canvasHeight,
    ...(needTransparentBg ? {} : { backgroundColor: '#fff' }),
  })

  const loadImage = (p: string) => {
    const fileUrl = `file://${p}`
    return new Promise<fabric.Image>((resolve, reject) => {
      fabric.Image.fromURL(fileUrl, (img) => {
        resolve(img)
      })
    })
  }

  // ring
  const ringFilePath = join(assetsRoot, './image/ring.png')
  const ringImg = await loadImage(ringFilePath)
  const ringShouldHeight = fontSize

  // ===============================
  // center improve
  const centerPosBase = rightTextInfo.leftEdge
  const maybeRingHalfWidth = ringShouldHeight * 0.85
  let centerPos = centerPosBase + maybeRingHalfWidth
  // strategy 1. if right text vert long, try move center pos to right
  // debug('rightTextInfo.width: ', rightTextInfo.width);
  // const isRightTextVertLong = rightTextInfo.width > improve.rightLengthMax
  // if (isRightTextVertLong) {
  //   debug('isRightTextVertLong');
  //   // move to right text length 20%
  //   centerPos = centerPosBase + rightTextInfo.width * 0.3
  // }
  // strategy 2. keep center pos in first glyph edge
  const isOverLayout = () => {
    const ringRightEdge = centerPos + ringImg.width! / 2
    const isOver = ringRightEdge >= rightTextInfo.rightEdge
    return isOver
  }
  const charLength = rightTextIns._text?.length
  if (charLength > 2 && rightTextIns._text?.[0]?.length) {
    // try create a new text with only first glyph
    const firstGlyphText = rightTextIns._text[0]
    // debug('firstGlyphText: ', firstGlyphText)
    const tmpTextIns = createText({
      text: firstGlyphText,
      color: fontColor.right,
      fontSize,
      // pos
      left: rightTextIns.left,
      top: padding.top * scale,
      // stroke
      strokeWidth: strokeWidth * scale,
    })
    const rightEdge = tmpTextIns.width! + tmpTextIns.left!
    const newCenterPos = rightEdge + ringShouldHeight * 0.55

    // check ring right edge over canvas
    if (!isOverLayout()) {
      centerPos = newCenterPos
    } else {
      debug(`ring right edge > right text right edge`)
    }
  }
  // ===============================

  // safe check: over layout
  if (isOverLayout()) {
    // move ring center pos to right text left edge
    centerPos = rightTextInfo.leftEdge + ringShouldHeight * 0.5
    debug(`Oops! short text`)
  }

  const ringInfo = {
    bottomEdge: rightTextInfo.topEdge + ring.bottomOffset * scale,
    shouldCenter: centerPos,
    shouldScale: ringShouldHeight / ringImg.height!,
  }
  ringImg.originX = 'center'
  ringImg.originY = 'bottom'
  ringImg.scale(ringInfo.shouldScale)
  ringImg.set({
    left: ringInfo.shouldCenter,
    top: ringInfo.bottomEdge,
  })

  // cross
  const crossFilePath = join(assetsRoot, './image/cross.png')
  const crossImg = await loadImage(crossFilePath)
  const crossShouldHeight = ringShouldHeight * 2.1
  const crossInfo = {
    bottomEdge: rightTextInfo.bottomEdge + cross.bottomOffset * scale,
    shouldCenter: ringInfo.shouldCenter - cross.leftOffset * scale,
    shouldScale: crossShouldHeight / crossImg.height!,
  }
  crossImg.originX = 'center'
  crossImg.originY = 'bottom'
  crossImg.scale(crossInfo.shouldScale)
  crossImg.set({
    left: crossInfo.shouldCenter,
    top: crossInfo.bottomEdge,
  })

  // white stroke
  const whiteStrokePoint = {
    point1: {
      x: cross.whiteStroke.topLeftX(crossInfo.shouldCenter, scale),
      y: rightTextInfo.topEdge,
    },
    point2: {
      x: cross.whiteStroke.topRightX(crossInfo.shouldCenter, scale),
      y: rightTextInfo.topEdge,
    },
    point3: cross.whiteStroke.bottom(
      crossInfo.shouldCenter,
      crossInfo.bottomEdge,
      scale,
    ),
  }
  const whiteStrokeShape = new fabric.Polygon(
    [
      new fabric.Point(whiteStrokePoint.point1.x, whiteStrokePoint.point1.y),
      new fabric.Point(whiteStrokePoint.point2.x, whiteStrokePoint.point2.y),
      new fabric.Point(whiteStrokePoint.point3.x, whiteStrokePoint.point3.y),
    ],
    {
      fill: '#fff',
    },
  )

  // transform
  performTransform(leftTextIns, matrix)
  performTransform(rightTextIns, matrix)
  // 1. add ring
  canvas.add(ringImg)
  // 2. add left text
  canvas.add(leftTextIns)
  // 3. add right text
  canvas.add(rightTextIns)
  // 4. add white stroke
  canvas.add(whiteStrokeShape)
  // 5. add cross
  canvas.add(crossImg)
  // left trim, translate x
  canvas.setViewportTransform([1, 0, 0, 1, -1 * (padding.leftTrim * scale), 0])
  // render
  canvas.renderAll()

  if (stream) {
    // @ts-expect-error
    return canvas.createJPEGStream()
  }

  // write
  let resolve: () => void
  let reject: (v: unknown) => void
  const promise = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  const writeStream = createWriteStream(output)
  if (isPng) {
    // @ts-ignore
    canvas.createPNGStream().pipe(writeStream)
  } else {
    // @ts-ignore
    canvas.createJPEGStream().pipe(writeStream)
  }
  writeStream.on('finish', () => {
    console.log(`${NAME}: draw write to ${output}`)
    // check file exists
    if (!existsSync(output)) {
      reject(new Error(`${NAME}: draw write error ${output} not exists`))
      return
    }
    resolve()
  })
  // error
  writeStream.on('error', (err) => {
    console.error(`${NAME}: draw write error ${err}`)
    reject(err)
  })

  return promise
}

function debug(...t: any[]) {
  if (process.env.DEBUG_EXBA) {
    console.log(`Debug: `, ...t)
  }
}
