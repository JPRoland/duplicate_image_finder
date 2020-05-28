const { Worker } = require('worker_threads')
const os = require('os')
const fs = require('fs').promises
const path = require('path')
const merge = require('lodash.merge')

const cpuCount = os.cpus().length

const workerScript = path.join(__dirname, './workers/hasher.js')

const hashImagesWithWorker = (images) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerScript, { workerData: images })
    worker.on('message', resolve)
    worker.on('error', reject)
  })
}

const distributeLoadAcrossWorkers = async (workers, images) => {
  const segments = Math.round(images.length / workers)
  const promises = Array(workers)
    .fill()
    .map((_, index) => {
      let imagesToHash
      if (index === 0) {
        imagesToHash = images.slice(0, segments)
      } else if (index === workers - 1) {
        imagesToHash = images.slice(segments * index)
      } else {
        imagesToHash = images.slice(segments * index, segments * (index + 1))
      }
      return hashImagesWithWorker(imagesToHash)
    })
  const segmentResults = await Promise.all(promises)
  return segmentResults.reduce((acc, res) => {
    merge(acc, res)
    return acc
  }, {})
}

const argv = require('yargs')
  .usage('Usage: $0 -d [dir] -b [bits]')
  .alias('d', 'dir')
  .alias('b', 'bits')
  .default('b', 16)
  .demandOption(['d', 'b']).argv

const getImages = async (dir) => {
  try {
    const files = await fs.readdir(dir)
    return files
      .filter((file) => {
        if (file.lastIndexOf('.') > 0) {
          const ext = file.split('.').pop().toLowerCase()
          return ext === 'png' || ext === 'jpg' || ext === 'jpeg'
        }
        return false
      })
      .map((file) => path.join(dir, file))
  } catch (error) {
    console.error(error.message)
    process.exit()
  }
}

const run = async () => {
  const images = await getImages(argv.dir)
  console.log('Hashing images...')
  const hashes = await distributeLoadAcrossWorkers(cpuCount, images)
  const duplicates = Object.values(hashes).filter((images) => images.length > 1)
  console.log('Duplicate images: ')
  duplicates.forEach((dupes) => {
    dupes.forEach((dupe) => console.log(dupe))
  })
}

run()
