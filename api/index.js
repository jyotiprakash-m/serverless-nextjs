const app = require('express')();
const { v4 } = require('uuid');
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");
const mongoose = require("mongoose")
const documentInfo = require("../models/documentInfoModel")
require("dotenv").config();
const upload = multer({ dest: "uploads/" });

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

// Middleware 

app.use(helmet());
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);
app.use(cors());
app.use(morgan("combined"));

app.get('/api/documents', async (req, res) => {

    const userDocuments = await documentInfo.find()
    res.send(userDocuments);
});
app.post('/api/storj/upload', upload.single("doc"), async (req, res, next) => {
    try {
        console.log(req.file);
        console.log(req.body);
        const userDocuments = await documentInfo.find({ email: req.body.email })
        if (userDocuments.length < 5) {
            const file = fs.readFileSync(req.file.path);
            const params = {
                Bucket: "demo-bucket",
                Key: req.body.key,
                Body: file,
            };
            const result = await s3
                .upload(params, {
                    partSize: 64 * 1024 * 1024,
                })
                .promise();

            await fs.unlink(req.file.path, (err) => {
                if (err) throw err;
                console.log("successfully deleted");
            });
            const { Bucket, ETag, Key, Location, key } = result;
            const documentData = await new documentInfo({
                Bucket, ETag, Key, Location, key, email: req.body.email, type: req.body.type
            }).save()
            // const uploadedDocument = await documentInfo.findOne({ key: documentData.key })
            // return res.status(200).json({ uploadedDocument, message: "Document Uploaded Successfully" })

            res.send(result);


        } else {
            return res.status(401).json({ error: "You exceeded the upload limit!" })
        }
    } catch (err) {
        console.log("err", err);
        res.send(err);
    }

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