const genreKeywords = {
    Technology: ['technology', 'software', 'hardware', 'AI', 'machine learning', 'internet', 'data'],
    Health: ['health', 'wellness', 'medical', 'hospital', 'doctor', 'nurse', 'medicine', 'healthcare'],
    Environment: ['environment', 'climate', 'pollution', 'sustainability', 'conservation', 'energy', 'renewable'],
    Entertainment: ['movie', 'music', 'game', 'entertainment', 'show', 'concert', 'theater', 'film']
};

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');  // Ensure the path to your Post model is correct

router.get('/api/postsByGenre', async (req, res) => {
  try {
    const posts = await Post.find({});
    const genreCounts = {
        Technology: 0,
        Health: 0,
        Environment: 0,
        Entertainment: 0
    };

    posts.forEach(post => {
      let genreScore = {}; // Scores for each genre

      // Initialize genre scores
      for (let genre in genreKeywords) {
        genreScore[genre] = 0;
        genreKeywords[genre].forEach(keyword => {
          if (post.body.toLowerCase().includes(keyword.toLowerCase())) {
            genreScore[genre]++;
          }
        });
      }

      // Determine the best genre for the post
      let bestGenre = null;
      let maxScore = 0;
      for (let genre in genreScore) {
        if (genreScore[genre] > maxScore) {
          maxScore = genreScore[genre];
          bestGenre = genre;
        }
      }

      // Increment count for the best genre
      if (bestGenre) {
        genreCounts[bestGenre]++;
      }
    });

    res.json(genreCounts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts by genre", error });
  }
});

module.exports = router;
