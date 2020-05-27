const fs = require('fs').promises
const FileType = require('file-type')
const jpeg = require('jpeg-js')
const { PNG } = require('pngjs')
const blockhash = require('./blockhash')

const hashPNG = (data, bits, method) => {
  try {
    const png = PNG.sync.read(data)
    return blockhash(png, bits, method ? 2 : 1)
  } catch (error) {
    console.error(error.message)
    return error
  }
}

const hashJPEG = (data, bits, method) => {
  try {
    const decoded = jpeg.decode(data)
    return blockhash(decoded, bits, method ? 2 : 1)
  } catch (error) {
    console.error(error.message)
    return error
  }
}

const hashImage = async (src, bits, method) => {
  try {
    if (src === undefined) {
      throw new Error('No image source specified')
    }
    const f = await fs.readFile(src)
    const srcType = await FileType.fromFile(src)
    if (!srcType || !srcType.mime) {
      throw new Error('Mime type not found')
    }
    if (src.lastIndexOf('.') > 0) {
      const ext = src.split('.').pop().toLowerCase()
      if (ext === 'png' && srcType.mime === 'image/png') {
        return hashPNG(f, bits, method)
      } else if (
        (ext === 'jpg' || ext === 'jpeg') &&
        srcType.mime === 'image/jpeg'
      ) {
        return hashJPEG(f, bits, method)
      } else {
        throw new Error(
          `Unrecognized file type, mime type, or mismatched types. File extension: ${ext} / mime: ${srcType.mime}`
        )
      }
    } else {
      console.warn('No file extension found, attempting to determine mime type')
      if (srcType.mime === 'image/png') {
        return hashPNG(f, bits, method)
      } else if (srcType.mime === 'image/jpeg') {
        return hashJPEG(f, bits, method)
      } else {
        throw new Error(`Unrecognized mime type: ${srcType.mime}`)
      }
    }
  } catch (error) {
    console.error(error.message)
    return error
  }
}

module.exports = {
  hashImage,
}
