'use strict'

// eslint-disable-next-line import/no-unresolved
const express = require('express')
var AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
const app = express()
const port = 8000

// aws configs
AWS.config.update({
  region: 'us-east-1',
  // endpoint: 'http://localhost:8000',
})

// constants
var docClient = new AWS.DynamoDB.DocumentClient()
const TABLE = 'aws-dynamodb-starter'
// Routes
app.get('/', (req, res) => {
  res.send({ message: `Request received: ${req.method} - ${req.path}` })
})

app.post('/user/addUser', async (req, res) => {
  var params = {
    TableName: TABLE,
    Item: {
      ID: uuidv4(),
      email: 'testemail@mail.com',
      info: {
        ImageURL: '#',
        description: 'testing',
      },
    },
  }
  docClient.put(params, (err, data) => {
    if (err) {
      res.send(err)
    } else {
      console.log('Added item:', JSON.stringify(data, null, 2))
      res.send({ data: data, parameters: params })
    }
  })
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
