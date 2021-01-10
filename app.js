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

const secure = (req, res, next) => {
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
var rekognition = new AWS.Rekognition({
  apiVersion: '2016-06-27',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1',
})
// http codes
const HTTP_OK_200 = 200
const SUCCESS = 'success'
const TABLE = 'aws-dynamodb-starter'
// Routes
app.get('/', secure, (req, res) => {
  res.send({
    message: `Request received: ${req.method} - ${req.path}`,
    status: HTTP_OK_200,
    success: SUCCESS,
  })
})

// USER ENDPOINTS
app.post('/user/add', secure, (req, res) => {
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

app.get('/user', secure, (req, res) => {
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

app.get('/user/images', secure, (req, res) => {
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

app.get('/user/get-image-url', secure, async (req, res) => {
  try {
    const raw = await axios.get(
      'https://7kdqv9hdsd.execute-api.us-east-1.amazonaws.com/default/getPresignedURL',
    )
    res.send(raw.data)
  } catch (err) {
    res.send(err)
  }
})

app.post('/user/retrieve-image-text', secure, async (req, res) => {
  const { Key, Bucket } = req.body
  const params = { Image: { S3Object: { Bucket: Bucket, Name: Key } } }
  const result = await new Promise((resolve, reject) => {
    rekognition.detectText(params, (err, data) => (err == null ? resolve(data) : reject(err)))
  })
  if (result.err) {
    res.status(500).send('Unable to Detect Text')
  } else {
    const foundText = result.TextDetections.length > 0
    if (foundText) {
      res.status(200).send(result)
    } else {
      res.status(200).send('No Text Detected')
    }
  }
})

// Error handler
app.use((err, req, res) => {
  console.error(err)
  res.status(500).send('Internal Serverless Error')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

module.exports = app
