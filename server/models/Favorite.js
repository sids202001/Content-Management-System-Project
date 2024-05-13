const mongoose = require('mongoose');
const { Schema } = mongoose;

const favoriteSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post', // Assuming you have a Post model
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
