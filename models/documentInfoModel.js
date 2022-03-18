const mongoose = require("mongoose")
const documentInfoSchema = new mongoose.Schema({
    Bucket: {
        type: String,
        required: true,
    },
    ETag: {
        type: String,
        required: true,
    },
    Key: {
        type: String,
        required: true,
    },
    Location: {
        type: String,
        required: true,

    },
    key: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },


}, { timestamps: true })

module.exports = mongoose.model("documentInfo", documentInfoSchema)