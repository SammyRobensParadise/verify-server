'use strict'
// eslint-disable-next-line import/no-unresolved
const express = require('express')
var AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
const bodyParser = require('body-parser')
const { default: axios } = require('axios')
require('dotenv').config()
// express
const app = express()
const port = 8000

app.use(bodyParser.json({ limit: '50mb' })) // support json encoded bodies
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })) // support encoded bodies
app.use(express.json())
// aws configs
AWS.config.update({
  region: 'us-east-1',
})

const verifyAppCall = (req, res, next) => {
  const bearerHeader = req.headers['authorization']
  if (bearerHeader) {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    if (bearerToken === process.env.SECURE_KEY) {
      next()
    } else {
      res.sendStatus(403)
    }
  } else {
    res.sendStatus(403)
  }
}

// constants
var docClient = new AWS.DynamoDB.DocumentClient()
// http codes
const HTTP_OK_200 = 200
const SUCCESS = 'success'
const TABLE = 'aws-dynamodb-starter'
// Routes
app.get('/', verifyAppCall, (req, res) => {
  res.send({
    message: `Request received: ${req.method} - ${req.path}`,
    status: HTTP_OK_200,
    success: SUCCESS,
  })
})

// USER ENDPOINTS
app.post('/user/add', verifyAppCall, (req, res) => {
  let d = new Date()
  const user_email = req.body.email
  const user_id = req.body.sub
  const date = d.toISOString()
  const params = {
    TableName: TABLE,
    Item: {
      ID: user_id,
      email: user_email,
      info: {
        uuid: uuidv4(),
        date_created: date,
        images: [],
      },
    },
  }
  docClient.put(params, (err, data) => {
    if (err) {
      res.send(err)
    } else {
      console.log('Added item:', JSON.stringify(data, null, 2))
      res.send({ data: data, parameters: params, status: HTTP_OK_200, success: SUCCESS })
    }
  })
})

app.get('/user', verifyAppCall, (req, res) => {
  const user_email = req.body.email
  const user_id = req.body.sub
  const params = {
    TableName: TABLE,
    Key: {
      ID: user_id,
      email: user_email,
    },
  }
  docClient.get(params, (err, data) => {
    if (err) {
      res.send(err)
    } else {
      res.send({ data: data, status: HTTP_OK_200, success: SUCCESS })
    }
  })
})

app.get('/user/images', verifyAppCall, (req, res) => {
  const user_email = req.body.email
  const user_id = req.body.sub
  const params = {
    TableName: TABLE,
    Key: {
      ID: user_id,
      email: user_email,
    },
  }
  docClient.get(params, (err, data) => {
    if (err) {
      res.send(err)
    } else {
      res.send({ data: data.Item.info.images, status: HTTP_OK_200, success: SUCCESS })
    }
  })
})

app.get('/user/get-image-url', verifyAppCall, async (req, res) => {
  try {
    const raw = await axios.get(
      'https://7kdqv9hdsd.execute-api.us-east-1.amazonaws.com/default/getPresignedURL',
    )
    res.send(raw.data)
  } catch (err) {
    res.send(err)
  }
})

app.get('/user/retrieve-image-text', verifyAppCall, async (req, res) => {})

// Error handler
app.use((err, req, res) => {
  console.error(err)
  res.status(500).send('Internal Serverless Error')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

module.exports = app
