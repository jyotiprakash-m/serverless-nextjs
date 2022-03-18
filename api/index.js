const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 3001
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");
require("dotenv").config();
const mongoose = require("mongoose")
// Monogdb connection
const documentInfo = require("../models/documentInfoModel")
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(res => console.log("DB Connected")).catch(err => console.log(err))


const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const endpoint = process.env.ENDPOINT;


const s3 = new S3({
    accessKeyId,
    secretAccessKey,
    endpoint,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    connectTimeout: 0,
    httpOptions: { timeout: 0 },
});

// defining the Express app
const app = express();

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);

// enabling CORS for all requests
app.use(cors());
// app.use(upload.array());

// adding morgan to log HTTP requests
app.use(morgan("combined"));

app.post(
    "api/storj/upload",
    upload.single("doc"),
    async function (req, res, next) {
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
                const uploadedDocument = await documentInfo.findOne({ key: documentData.key })
                return res.status(200).json({ uploadedDocument, message: "Document Uploaded Successfully" })

                // res.send(result);


            } else {
                return res.status(401).json({ error: "You exceeded the upload limit!" })
            }
        } catch (err) {
            console.log("err", err);
            res.send(err);
        }
    }
);

app.get("api/storj/:key", async (req, res) => {
    const params = {
        Bucket: "demo-bucket",
        Key: req.params.key,
    };
    const url = s3.getSignedUrl("getObject", params);
    console.log("url", url);

    res.send(url);
});

module.exports = app;