#!/usr/bin/env node
const { Worker } = require('worker_threads')
const os = require('os')
const fs = require('fs').promises
const path = require('path')
const merge = require('lodash.merge')

const cpuCount = os.cpus().length

const workerScript = path.join(__dirname, './workers/hasher.js')

const hashImagesWithWorker = (images, bits) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerScript, { workerData: [images, bits] })
    worker.on('message', resolve)
    worker.on('error', reject)
  })
}

const distributeLoadAcrossWorkers = async (workers, images, bits) => {
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
      return hashImagesWithWorker(imagesToHash, bits)
    })
  const segmentResults = await Promise.all(promises)
  return segmentResults.reduce((acc, res) => {
    merge(acc, res)
    return acc
  }, {})
}

const argv = require('yargs')
  .scriptName('find-duplicates')
  .usage('Usage: $0 -d [search dir] -b [bits] -o [output file]')
  .help('h')
  .alias('h', 'help')
  .alias('o', 'output')
  .describe('o', 'Output file. If not specified, prints result to console.')
  .alias('d', 'dir')
  .nargs('d', 1)
  .nargs('b', 1)
  .nargs('o', 1)
  .describe('d', 'Directory to search')
  .alias('b', 'bits')
  .describe('b', 'Bits per row for hashing image')
  .default('b', 16)
  .boolean('r')
  .alias('r', 'remove')
  .describe('r', 'Delete found duplicates')
  .conflicts('r', 'o')
  .demandOption('d', 'Search directory is required').argv

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
  try {
    const images = await getImages(argv.dir)
    console.log('Hashing images...')
    const hashes = await distributeLoadAcrossWorkers(
      cpuCount,
      images,
      argv.bits
    )
    const duplicates = Object.values(hashes).filter(
      (images) => images.length > 1
    )
    if (argv.output) {
      const fd = await fs.open(argv.output, 'a')
      for (let dupes of duplicates) {
        for (let i = 0; i < dupes.length; i++) {
          await fd.appendFile(`${dupes[i]}\n`)
        }
        await fd.appendFile('\n')
      }
      await fd.close()
    } else if (argv.remove) {
      console.log('Deleting duplicates...')
      for (let dupes of duplicates) {
        for (let i = 0; i < dupes.length; i++) {
          if (i === 0) {
            continue
          } else {
            await fs.unlink(dupes[i])
          }
        }
      }
    } else {
      console.log('Duplicate images: ')
      duplicates.forEach((dupes) => {
        dupes.forEach((dupe) => console.log(dupe))
      })
    }

    console.log('Done')
  } catch (error) {
    console.error(error.message)
    process.exit()
  }
}

run()
