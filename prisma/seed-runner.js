// Patch __dirname for the generated Prisma client before loading it
const path = require('path')
const clientDir = path.resolve(__dirname, '..', 'app', 'generated', 'prisma')
globalThis['__dirname'] = clientDir

// Now load everything
require('./seed-impl.js')
