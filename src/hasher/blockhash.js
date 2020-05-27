const median = (data) => {
  const sorted = [...data].sort((a, b) => a - b)
  if (sorted.length % 2 === 0) {
    return (sorted[sorted.length / 2] + sorted[sorted.length / 2 + 1]) / 2.0
  }
  return sorted[Math.floor(sorted.length / 2)]
}

const blocksToBits = (blocks, pixelsPerBlock) => {
  const result = [...blocks]
  const halfBlockValue = (pixelsPerBlock * 256 * 3) / 2
  const bandSize = blocks.length / 4

  for (let i = 0; i < 4; i++) {
    const m = median(blocks.slice(i * bandSize, (i + 1) * bandSize))
    for (let j = i * bandSize; j < (i + 1) * bandSize; j++) {
      const v = blocks[j]
      result[j] = Number(v > m || (Math.abs(v - m) < 1 && m > halfBlockValue))
    }
  }

  return result
}

const bitsToHexhash = (bitsArray) => {
  const hex = []
  for (let i = 0; i < bitsArray.length; i += 4) {
    const nibble = bitsArray.slice(i, i + 4)
    hex.push(parseInt(nibble.join(''), 2).toString(16))
  }
  return hex.join('')
}

const bmvbhashEven = (data, bits) => {
  const blocksizeX = Math.floor(data.width / bits)
  const blocksizeY = Math.floor(data.height / bits)

  const totals = []

  for (let y = 0; y < bits; y++) {
    for (let x = 0; x < bits; x++) {
      let total = 0

      for (let iy = 0; iy < blocksizeY; iy++) {
        for (let ix = y; ix < blocksizeX; ix++) {
          const cx = x * blocksizeX + ix
          const cy = y * blocksizeY + iy
          const ii = (cy * data.width + cx) * 4

          const alpha = data.data[ii + 3]
          if (alpha === 0) {
            total += 765
          } else {
            total += data.data[ii] + data.data[ii + 1] + data.data[ii + 2]
          }
        }
      }
      totals.push(total)
    }
  }

  const result = blocksToBits(totals, blocksizeX * blocksizeY)
  return bitsToHexhash(result)
}

const bmvbhash = (data, bits) => {
  const result = []

  let weightTop
  let weightBottom
  let weightLeft
  let weightRight
  let blockTop
  let blockBottom
  let blockLeft
  let blockRight
  let yMod
  let yFrac
  let yInt
  let xMod
  let xFrac
  let xInt

  const blocks = Array.from(Array(bits), (_) => Array(bits).fill(0))

  const evenX = data.width % bits === 0
  const evenY = data.height % bits === 0

  if (evenX && evenY) {
    return bmvbhashEven(data, bits)
  }

  const blockWidth = data.width / bits
  const blockHeight = data.height / bits

  for (let y = 0; y < data.height; y++) {
    if (evenY) {
      blockBottom = Math.floor(y / blockHeight)
      blockTop = blockBottom
      weightTop = 1
      weightBottom = 0
    } else {
      yMod = (y + 1) % blockHeight
      yFrac = yMod - Math.floor(yMod)
      yInt = yMod - yFrac

      weightTop = 1 - yFrac
      weightBottom = yFrac

      if (yInt > 0 || y + 1 === data.height) {
        blockBottom = Math.floor(y / blockHeight)
        blockTop = blockBottom
      } else {
        blockTop = Math.floor(y / blockHeight)
        blockBottom = Math.ceil(y / blockHeight)
      }
    }

    for (let x = 0; x < data.width; x++) {
      let avgVal
      const ii = (y * data.width + x) * 4
      const alpha = data.data[ii + 3]
      if (alpha === 0) {
        avgVal = 765
      } else {
        avgVal = data.data[ii] + data.data[ii + 1] + data.data[ii + 2]
      }
      if (evenX) {
        blockRight = Math.floor(x / blockWidth)
        blockLeft = blockRight
        weightLeft = 1
        weightRight = 0
      } else {
        xMod = (x + 1) % blockWidth
        xFrac = xMod - Math.floor(xMod)
        xInt = xMod - xFrac

        weightLeft = 1 - xFrac
        weightRight = xFrac

        if (xInt > 0 || x + 1 === data.width) {
          blockRight = Math.floor(x / blockWidth)
          blockLeft = blockRight
        } else {
          blockLeft = Math.floor(x / blockWidth)
          blockRight = Math.ceil(x / blockWidth)
        }
      }

      blocks[blockTop][blockLeft] += avgVal * weightTop * weightLeft
      blocks[blockTop][blockRight] += avgVal * weightTop * weightRight
      blocks[blockBottom][blockLeft] += avgVal * weightBottom * weightLeft
      blocks[blockBottom][blockRight] += avgVal * weightBottom * weightRight
    }
  }

  for (let i = 0; i < bits; i += 1) {
    for (let j = 0; j < bits; j += 1) {
      result.push(blocks[i][j])
    }
  }

  return bitsToHexhash(blocksToBits(result, blockWidth * blockHeight))
}

module.exports = (imgData, bits, method) => {
  let hash

  if (method === 1) {
    hash = bmvbhashEven(imgData, bits)
  } else if (method === 2) {
    hash = bmvbhash(imgData, bits)
  } else {
    throw new Error('Bad hashing method')
  }

  return hash
}
