const { parentPort, workerData, isMainThread } = require('worker_threads')
const { hashImage } = require('../lib/async-hasher')

const hashImages = async (images, bits) => {
  try {
    const result = {}
    for (let image of images) {
      const hash = await hashImage(image, bits, 2)
      if (result[hash]) {
        result[hash] = result[hash].concat(image)
      } else {
        result[hash] = [image]
      }
    }

    return result
  } catch (error) {
    console.error(error.message)
    process.exit()
  }
}

if (!isMainThread) {
  if (!Array.isArray(workerData)) {
    throw new Error('workerData must be an array')
  }

  hashImages(workerData, 16)
    .then((data) => {
      //   console.log(data)
      parentPort.postMessage(data)
    })
    .catch((e) => {
      console.error(e.message)
    })

  //   parentPort.postMessage(hashImages(workerData, 16))
}
