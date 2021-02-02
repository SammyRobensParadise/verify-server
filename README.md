# Verify API ⚡️

![Status](https://img.shields.io/badge/Status-Alpha-brightgreen)

In order to make calls to any of the following endpoints you need to have a `Authorization Token`. As of right now this is private since the app and API are still in development. \
There may still be plans to make this more public later on.

## Stack 🤖

1. Express application running on AWS
2. AWS lambda functions for communication between services.
3. DynamoDB (NoSQL) database(s)

## Usage

### GET `/`

Test endpoint \
requires:

```js
Authorization: `Bearer ${Token}`
method: GET
```

### GET `/user`

Gets a unique user object \
requires:

```js
Authorization: `Bearer ${Token}`
method: GET
body: {
    sub: String,
    email: String
}
```

### GET `/user/add`

Adds a new user \
requires:

```js
Authorization: `Bearer ${Token}`
method: POST
body: {
    sub: String,
    email: String
}
```

### GET `/user/images`

gets an array of a users image info\
requires:

```js
Authorization: `Bearer ${Token}`
method: GET
body: {
    sub: String,
    email: String
}
```

### Image Structure:

```js
images: [{ ID: `##############################`, Date: `ISOdate` }, ...]
```

### GET `/user/get-image_url`

gets a pre-signed S3 upload URL
requires:

```js
Authorization: `Bearer ${Token}`
method: GET
```

### POST `/user/retrieve-image-text`

Gets a JSON blob of text associated with a JPEG image uploaded to S3
requires:

```js
Authorization: `Bearer ${Token}`
method: POST
body: {
    Key: String,
    Bucket: String
}
```

### POST `/user/retrieve-text-data`

Gets a JSON blob of search results associated with a an array of words
requires:

```js
Authorization: `Bearer ${Token}`
method: POST
body: {
    query: Array<string>
}

```

### POST `/user/upload-report-data`

posts a JSON blob of `report` info about an image search

```js
Authorization: `Bearer ${Token}`
method: POST
body: {
    data: Object
}
```
