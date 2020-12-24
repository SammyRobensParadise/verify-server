# Verify API ⚡️

### This is not a public API

In order to make calls to any of the following endpoints you need to have a `Authorization Token`. As of right now this is private since the app and API are still in development. \
There may still be plans to make this more public later on.

## Stack 🤖

1. Express.js application running on AWS
2. AWS lambda functions for communication between services.
3. DynamoDB (NoSQL) database(s)

## Usage

### `/`

Test endpoint \
requires:

```js
Authorization: `Bearer ${Token}`
method: GET
body: {
}
```

### `/user`

Gets a unique user object \
requires:

```js
Authorization: `Bearer ${Token}`
method: GET
body: {
    sub: sub,
    email: email
}
```

### `/user/add`

Adds a new user \
requires:

```js
Authorization: `Bearer ${Token}`
method: POST
body: {
    sub: sub,
    email: email
}
```

### `/user/images`

gets an array of a users image info\
requires:

```js
Authorization: `Bearer ${Token}`
method: GET
body: {
    sub: sub,
    email: email
}
```
