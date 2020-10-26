let fs = require('fs'),
    path = require('path'),
    models = {},
    name

fs.readdirSync(__dirname).filter((file) => {
    return file !== path.basename(__filename)
}).forEach((file) => {
    name = path.parse(file).name
    models[name] = require(`./${name}`)
})

module.exports = models