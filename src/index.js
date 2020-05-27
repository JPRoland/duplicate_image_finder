const fs = require('fs').promises
const path = require('path')
const { hashImage } = require('./lib/async-hasher')

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

const run = async () => {
  const images = await getImages(argv.dir)
  console.log('Hashing images...')
  const hashes = await hashImages(images, argv.b)
  const duplicates = Object.values(hashes).filter((images) => images.length > 1)
  console.log('Duplicate images: ')
  duplicates.forEach((dupes) => {
    dupes.forEach((dupe) => console.log(dupe))
  })
}

run()
