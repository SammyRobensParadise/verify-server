'use strict'
const express = require('express')
var AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
const bodyParser = require('body-parser')
const { default: axios } = require('axios')
require('dotenv').config()
const env = require('./env')
// express
const app = express()
const port = 8000

app.use(bodyParser.json({ limit: '50mb' })) // support json encoded bodies
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })) // support encoded bodies
app.use(express.json())

AWS.config.update({
    region: 'us-east-1',
})

const secure = (req, res, next) => {
    const bearerHeader = req.headers['authorization']
    if (bearerHeader) {
        const bearer = bearerHeader.split(' ')
        const bearerToken = bearer[1]
        if (bearerToken === env.SECURE_KEY) {
            next()
        } else {
            res.sendStatus(403)
        }
    } else {
        res.sendStatus(403)
    }
}

var docClient = new AWS.DynamoDB.DocumentClient()
var rekognition = new AWS.Rekognition({
    apiVersion: '2016-06-27',
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
})
var comprehend = new AWS.Comprehend({
    apiVersion: '2017-11-27',
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
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
            res.send({
                data: data,
                parameters: params,
                status: HTTP_OK_200,
                success: SUCCESS,
            })
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
            res.send({
                data: data.Item.info.images,
                status: HTTP_OK_200,
                success: SUCCESS,
            })
        }
    })
})

app.get('/user/get-image-url', secure, async (req, res) => {
    try {
        const raw = await axios.get(
            'https://7kdqv9hdsd.execute-api.us-east-1.amazonaws.com/default/getPresignedURL'
        )
        res.send(raw.data)
    } catch (err) {
        res.send(err)
    }
})

app.post('/user/retrieve-image-text', secure, async (req, res) => {
    const { Key, Bucket } = req.body
    const params = { Image: { S3Object: { Bucket: Bucket, Name: Key } } }
    rekognition.detectText(params, (err, data) => {
        if (err) {
            res.status(500).send(`AWS Error ${err}`)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/user/retrieve-text-data', secure, async (req, res) => {
    const MAX_QUERY_LENGTH = 1500
    const { TextDetections } = req.body.data
    const filteredTextDetections = TextDetections.filter(
        (data) => data.Confidence > 97
    )
    const filteredText = filteredTextDetections.map((data) => {
        return data.DetectedText
    })
    const paramStringToMLSearch = filteredText.join(' ')
    const params = {
        LanguageCode: 'en', // start by only verifying english posts
        Text: paramStringToMLSearch,
    }
    comprehend.detectKeyPhrases(params, async (err, data) => {
        if (err) {
            res.status(500).send(`AWS ML Error ${err}`)
        } else {
            console.log(data)
            const dataText = data.KeyPhrases.map((phrase) => {
                return phrase.Text
            })
            const query = dataText.join(' ')
            const URI = encodeURIComponent(query)
            if (URI.length > MAX_QUERY_LENGTH) {
                res.status(414).send('Query string too long')
            }
            const config = {
                headers: { 'Ocp-Apim-Subscription-Key': env.AZURE_API_KEY_1 },
            }
            const raw = await axios.get(`${env.BING_ENDPOINT}?q=${URI}`, config)
            if (raw.status !== HTTP_OK_200) {
                res.status(raw.status).send('Search Encountered an Error')
            } else {
                res.status(200).send(raw.data)
            }
        }
    })
})

app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).send('Internal Serverless Error')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

module.exports = app
