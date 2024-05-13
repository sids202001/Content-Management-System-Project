// const express = require('express');
// const router = express.Router();
// const Comment = require('../models/Comment');

// // Endpoint to fetch comments for a specific post
// router.get('/comments/:postId', async (req, res) => {
//   try {
//     // Replace 'populate('user')' with 'populate('userId')' if your comment schema has 'userId'
//     const comments = await Comment.find({ postId: req.params.postId }).populate('user');
//     res.json(comments);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching comments", error: error.message });
//   }
// });

// // Endpoint to create a new comment
// router.post('/comments', async (req, res) => {
//   const { postId, userId, text } = req.body; // Destructure the needed fields from the body

//   // You should add additional validation here as needed
//   if (!postId || !userId || !text) {
//     return res.status(400).json({ message: "Missing fields" });
//   }

//   try {
//     const newComment = new Comment({ postId, userId, text });
//     const savedComment = await newComment.save();
//     res.status(201).json(savedComment);
//   } catch (error) {
//     res.status(400).json({ message: "Error creating comment", error: error.message });
//   }
// });

// module.exports = router;






const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const authenticate = require('../middleware/authenticate'); // Ensure the path is correct

// Get all comments for a specific post
router.get('/posts/:postId/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId }).populate('userId');
        res.json(comments);
    } catch (error) {
        res.status(500).send("Error fetching comments");
    }
});

// Post a comment
router.post('api/post/:id/comments', async (req, res) => {
    const { text } = req.body;
  
    const newComment = new Comment({
        postId: req.params.id,
        userId: req.session.userId, // assuming userId is stored in session
        text: text
    });
  
    try {
        await newComment.save();
        res.redirect(`/posts/${req.params.postId}`);
    } catch (error) {
        // show full error message
        res.status(400).send(error.message);
    }
  });

// Update a comment
router.put('/comments/:commentId', authenticate, async (req, res) => {
    const { text } = req.body;
    try {
        const comment = await Comment.findOneAndUpdate({ _id: req.params.commentId, userId: req.session.userId }, { text, updatedAt: Date.now() }, { new: true });
        res.json(comment);
    } catch (error) {
        res.status(400).send("Error updating comment");
    }
});

// Delete a comment
router.delete('/comments/:commentId', authenticate, async (req, res) => {
    try {
        await Comment.deleteOne({ _id: req.params.commentId, userId: req.session.userId });
        res.send("Comment deleted");
    } catch (error) {
        res.status(400).send("Error deleting comment");
    }
});

module.exports = router;
