const app = require('express')();
const { v4 } = require('uuid');
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");
// const multer = require("multer");
const S3 = require("aws-sdk/clients/s3");
// const fs = require("fs");
const mongoose = require("mongoose")
const documentInfo = require("../models/documentInfoModel")
require("dotenv").config();
// const upload = multer({ dest: "uploads/" });

const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const endpoint = process.env.ENDPOINT;

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(res => console.log("DB Connected")).catch(err => console.log(err))

const s3 = new S3({
    accessKeyId,
    secretAccessKey,
    endpoint,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    connectTimeout: 0,
    httpOptions: { timeout: 0 },
});
app.get('/api/documents', async (req, res) => {

    const userDocuments = await documentInfo.find()
    res.send(userDocuments);
});


app.get('/api', (req, res) => {
    const path = `/api/item/${v4()}`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
});

// app.get('/api/item/:slug', (req, res) => {
//     const accessKeyId = process.env.ACCESS_KEY_ID;
//     const secretAccessKey = process.env.SECRET_ACCESS_KEY;
//     const endpoint = process.env.ENDPOINT;
//     const { slug } = req.params;
//     res.end(`Item: ${slug} - ${accessKeyId} - ${secretAccessKey} - ${endpoint} - `);
// });
app.get('/api/storj/:key', (req, res) => {
    const params = {
        Bucket: "demo-bucket",
        Key: req.params.key,
    };
    const url = s3.getSignedUrl("getObject", params);

    res.send(url);
});


// app.get('api/storj/:key', (req, res) => {
//     const params = {
//         Bucket: "demo-bucket",
//         Key: req.params.key,
//     };
//     const url = s3.getSignedUrl("getObject", params);

//     res.send(url);
// });

module.exports = app;