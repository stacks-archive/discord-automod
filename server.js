require('dotenv').config()
const express = require('express'),
  app = express(),
  server = require('http').Server(app),
  router = express.Router(),
  bodyParser = require('body-parser'),
  ejwt = require('express-jwt'),
  passport = require('passport'),
  cors = require('cors'),
  port = process.env.PORT || 8000,
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash')

require('./index')

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For'],
  credentials: true
}))

app.use(bodyParser.urlencoded({
  limit: '500mb',
  extended: true,
  type: 'application/x-www-form-urlencoded'
}))

app.use(bodyParser.json({
  limit: '500mb',
  type: 'application/*'
}))

// app.use(ejwt({
//   secret: process.env.TOKEN_SECRET || 'supersecret'
// }).unless({
//   path: [
//     {
//       url: /\/auth*/,
//       methods: ['POST']
//     },
//     {
//       url: /\/cron*/,
//       methods: ['GET']
//     },

//   ]
// }))

app.use(passport.initialize())

app.use(function (req, res, next) {

  if (req.query.related) {
    req.query.related = `[${req.query.related}]`
  }

  next()
})

function parseQueryString(req, res, next) {
  if (req.query && req.query.hasOwnProperty('filter')) {
    req.query.filter = _.mapValues(req.query.filter, function (value, key) {
      if (value === 'false')
        return false
      else if (value === 'true')
        return true
      else
        return value
    });
  }
  if (req.query && req.query.hasOwnProperty('filterRelated')) {
    req.query.filterRelated = _.mapValues(req.query.filterRelated, function (value, key) {
      if (value === 'false')
        return false
      else if (value === 'true')
        return true
      else
        return value
    });
  }
  next()
}

fs.readdirSync('./app/routes').forEach((file) => {
  router.use(`/${path.parse(file).name}`, parseQueryString, require(`./app/routes/${file}`)(
    express.Router()
  ))
})

app.use(router)

// if (process.env.NODE_ENV == 'development' || process.env.NODE_ENV === undefined) {
server.listen(port, () => {
  console.log(`Server active at http://localhost:${port} on ID: ${process.pid}`)
})

// } else {
//     exports.server = server
// }
