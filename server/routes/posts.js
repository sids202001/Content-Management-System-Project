const express = require('express');
const router = express.Router();
const Post = require('../models/Post');  // Adjust the path as necessary
const Comment = require('../models/Comment'); // Make sure the path is correct


// GET specific post and its comments
router.get('/api/post/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const comments = await Comment.find({ postId: req.params.id }).populate('userId');

        res.render('post', {
            post: post,
            comments: comments,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching post and comments:', error);
        res.status(500).send('Error loading the post');
    }
});

module.exports = router;

