# Duplicate Image Finder

Detects duplicate images in a given directory using the Block Mean Value Based Image Perceptual Hashing algorithm by Bian Yang, Fan Gu and Xiamu Niu and the [block-hash](https://github.com/commonsmachinery/blockhash-js) implementation of said algorithm.

## Getting Started

### Installation

```shell
$ npm install img-dedupe
```

## Usage

```shell
$ image-dedupe /path/to/images -b 16 -o /output/file/path -r
```

### Options

| Flag | Description                                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| -b   | Set bitwidth for hashing (Defaults to 16 if not provided)                                                                                        |
| -o   | Specify output file to save results. File will be created automatically if it does not exist. If not provided results will be written to console |
| -r   | Delete duplicate images                                                                                                                          |
| -h   | Display help message                                                                                                                             |
