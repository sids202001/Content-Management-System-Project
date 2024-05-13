// const mongoose = require('mongoose');

// const Schema = mongoose.Schema;
// const PostSchema = new Schema({
//   title: {
//     type: String,
//     required: true
//   },
//   body: {
//     type: String,
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Post', PostSchema);

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: String,
    body: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
