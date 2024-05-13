const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment'); // Make sure the path is correct
const Favorite = require('../models/Favorite'); // Make sure the path is correct
const Tags = require('../models/Tags'); // Make sure the path is correct


/**
 * GET /
 * HOME
*/
router.get('', async (req, res) => {
  try {
    const locals = {
      title: "CMS",
      description: "Blog "
    }

    let perPage = 10;
    let page = req.query.page || 1;

    const data = await Post.aggregate([ { $sort: { createdAt: -1 } } ])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec();

    // Aggregation pipeline to find the top 3 most commented posts
    const topCommentedPosts = await Post.aggregate([
      {
        $lookup: {
          from: 'comments', // Assumes the collection is named 'comments'
          localField: '_id', // Field in Post collection
          foreignField: 'postId', // Field in Comment collection that references Post
          as: 'comments' // Array field where the matched comments will be placed
        }
      },
      {
        $addFields: {
          commentCount: { $size: '$comments' } // Count the number of comments
        }
      },
      {
        $sort: { commentCount: -1 } // Sort posts by comment count in descending order
      },
      {
        $limit: 3 // Limit to top 3
      }
    ]);

    // Count is deprecated - please use countDocuments
    // const count = await Post.count();
    const count = await Post.countDocuments({});
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render('index', { 
      locals,
      data,
      topCommentedPosts,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: '/'
    });

  } catch (error) {
    console.log(error);
  }

});

// router.get('', async (req, res) => {
//   const locals = {
//     title: "NodeJs Blog",
//     description: "Simple Blog created with NodeJs, Express & MongoDb."
//   }

//   try {
//     const data = await Post.find();
//     res.render('index', { locals, data });
//   } catch (error) {
//     console.log(error);
//   }

// });


/**
 * GET /
 * Post :id
*/
router.get('/post/:id', async (req, res) => {
  try {
    let postId = req.params.id;

    // Fetch the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    // Fetch comments related to the post
    const comments = await Comment.find({ postId: postId }).populate('userId');

    // Fetch tags related to the post
    const tags = await Tags.find({ postId: postId });

    const locals = {
      title: post.title,
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };

    res.render('post', {
      locals,
      post,
      comments,
      tags,
      currentRoute: `/post/${postId}`,
      user: req.user // Assuming you have user data from session or similar
    });
  } catch (error) {
    console.error('Error fetching post, comments, and tags:', error);
    res.status(500).send('Error loading the post');
  }
});

// OG
// router.get('/post/:id', async (req, res) => {
//   try {
//     let postId = req.params.id;

//     const post = await Post.findById(postId);
//     const comments = await Comment.find({ postId: postId }).populate('userId');

//     const locals = {
//       title: post.title,
//       description: "Simple Blog created with NodeJs, Express & MongoDb.",
//     }

//     res.render('post', {
//       locals,
//       post,
//       comments,
//       currentRoute: `/post/${postId}`,
//       user: req.user // Assuming you have user data from session or similar
//     });
//   } catch (error) {
//     console.error('Error fetching post and comments:', error);
//     res.status(500).send('Error loading the post');
//   }
// });

// Post a comment
router.post('/api/post/:id/comments', async (req, res) => {
  const { text } = req.body;
  

  // get user id from post
  const newComment = new Comment({
      postId: req.params.id,
      userId: "6622cf61041e709b6273d604",
      text: text
  });

  try {
    await newComment.save();
    res.redirect(`/post/${req.params.id}`);
} catch (error) {
    // show full error message
    res.status(400).send(error.message);
}
});

// Favorite a post
router.post('/api/post/:id/favorite', async (req, res) => {
  // Here, we assume user ID is either passed in some way or retrieved from session or auth token
  // Hardcoded user ID for demonstration; replace it with actual user identification logic
  const userId = "6622cf61041e709b6273d604"; 

  // Check if the user has already favorited the post
  const existingFavorite = await Favorite.findOne({
      postId: req.params.id,
      userId: userId
  });

  if (existingFavorite) {
      return res.status(400).send('You have already favorited this post.');
  }

  // Create a new favorite record
  const newFavorite = new Favorite({
      postId: req.params.id,
      userId: userId
  });

  try {
      await newFavorite.save();
      res.redirect(`/post/${req.params.id}`);
  } catch (error) {
      // show full error message
      res.status(400).send(error.message);
  }
});

// Tags route
router.post('/api/post/:id/tags', async (req, res) => {
  try {
      const { tagName } = req.body;
      const postId = req.params.id;

      // Check if the post exists
      const postExists = await Post.findById(postId);
      if (!postExists) {
          return res.status(404).send('Post not found');
      }

      // Find or create the tag with the specified name and postId
      const tag = await Tags.findOneAndUpdate(
          { name: tagName.trim().toLowerCase(), postId: postId }, // Check for tag with the name and postId
          {}, // No update fields here, just used for upserting
          { new: true, upsert: true, setDefaultsOnInsert: true } // Options to upsert and return new document
      );

      // Redirect back to the post page
      res.redirect('/post/' + postId);
  } catch (error) {
      console.error('Server error while adding tag:', error);
      res.status(500).send('Server error while adding tag');
  }
});


// Route to delete a tag from a post
router.post('/api/post/:postId/tags/:tagId/delete', async (req, res) => {
  try {
      const { postId, tagId } = req.params;

      // Find and delete the tag
      const deletedTag = await Tags.findOneAndDelete({ _id: tagId, postId: postId });
      if (!deletedTag) {
          return res.status(404).send('Tag not found or does not belong to this post');
      }

      // Redirect back to the post page or handle with AJAX in real-time updates
      res.redirect(`/post/${postId}`);
  } catch (error) {
      console.error('Server error while deleting tag:', error);
      res.status(500).send('Server error while deleting tag');
  }
});

// Delete a comment
router.post('/api/comments/:commentId/delete', async (req, res) => {
  try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).send("Comment not found");
        }
        
        const postId = comment.postId;
        await Comment.deleteOne({ _id: req.params.commentId, userId: "6622cf61041e709b6273d604" }); // Consider verifying user ID dynamically

        res.redirect(`/post/${postId}`); // Changed from /post/ to /posts/ to match typical RESTful routing
  } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(400).send("Error deleting comment");
  }
});

// PUT route for updating a comment
router.post('/api/comments/:commentId/put', async (req, res) => {
  try {
    const { text } = req.body; // Extract content from the request body
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).send("Comment not found");
    }

    // Updating the comment
    comment.text = text;
    await comment.save(); // Save the updated comment

    res.redirect(`/post/${comment.postId}`); // Redirect back to the post page
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(400).send("Error updating comment");
  }
});


/**
 * POST /
 * Post - searchTerm
*/
// router.post('/search', async (req, res) => {
//   try {
//     const locals = {
//       title: "Search",
//       description: "Simple Blog created with NodeJs, Express & MongoDb."
//     }

//     let searchTerm = req.body.searchTerm;
//     const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "")

//     const data = await Post.find({
//       $or: [
//         { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
//         { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
//       ]
//     });

//     res.render("search", {
//       data,
//       locals,
//       currentRoute: '/'
//     });

//   } catch (error) {
//     console.log(error);
//   }

// });


// router.post('/search', async (req, res) => {
//   try {
//     const locals = {
//       title: "Search",
//       description: "Simple Blog created with NodeJs, Express & MongoDb."
//     };

//     let searchTerm = req.body.searchTerm;
//     const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

//     // Fetch posts based on title, body, or comments
//     const posts = await Post.find({
//       $or: [
//         { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
//         { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
//       ]
//     });

//     // Find comments that match the search term and retrieve associated posts
//     const comments = await Comment.find({
//       text: { $regex: new RegExp(searchNoSpecialChar, 'i') }
//     }).populate('postId');
    
//     const postIdsFromComments = comments.map(comment => {
//       if(comment.postId && comment.postId._id) {
//         return comment.postId._id.toString();
//       }
//     });
    
    
//     // Combine posts found from titles and bodies with posts found from comments
//     const additionalPosts = await Post.find({ '_id': { $in: postIdsFromComments } });

//     // Combine and remove duplicates
//     const combinedPosts = [...posts, ...additionalPosts];
//     const uniquePosts = Array.from(new Set(combinedPosts.map(post => post._id.toString())))
//                              .map(id => combinedPosts.find(post => post._id.toString() === id));

//     res.render("search", {
//       data: uniquePosts,
//       locals,
//       currentRoute: '/'
//     });

//   } catch (error) {
//     console.log(error);
//     res.status(500).send(error.message);
//   }
// });


// Prev code working search
// router.post('/search', async (req, res) => {
//   try {
//     const locals = {
//       title: "Search",
//       description: "Simple Blog created with NodeJs, Express & MongoDb."
//     };

//     let searchTerm = req.body.searchTerm;
//     const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

//     // Fetch posts based on title, body, or comments
//     const postsByTitleAndBody = await Post.find({
//       $or: [
//         { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
//         { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
//       ]
//     });

//     // Find comments that match the search term and retrieve associated posts
//     const comments = await Comment.find({
//       text: { $regex: new RegExp(searchNoSpecialChar, 'i') }
//     }).populate('postId');
    
//     const postIdsFromComments = comments.map(comment => comment.postId ? comment.postId._id.toString() : null).filter(id => id);

//     // Fetch posts based on matching tags
//     const tags = await Tags.find({
//       name: { $regex: new RegExp(searchNoSpecialChar, 'i') }
//     });

//     const postIdsFromTags = tags.map(tag => tag.postId.toString());

//     // Combine post IDs from comments and tags, and fetch these posts
//     const additionalPostIds = [...postIdsFromComments, ...postIdsFromTags];
//     const additionalPosts = await Post.find({ '_id': { $in: additionalPostIds } });

//     // Combine posts found from titles, bodies with posts found from comments and tags
//     const combinedPosts = [...postsByTitleAndBody, ...additionalPosts];

//     // Remove duplicate posts
//     const uniquePosts = Array.from(new Set(combinedPosts.map(post => post._id.toString())))
//                              .map(id => combinedPosts.find(post => post._id.toString() === id));

//     res.render("search", {
//       data: uniquePosts,
//       locals,
//       currentRoute: '/'
//     });

//   } catch (error) {
//     console.log(error);
//     res.status(500).send(error.message);
//   }
// });

router.post('/search', async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");
    const regexPattern = new RegExp(searchNoSpecialChar, 'i'); // Case insensitive regex search

    // Aggregation pipeline
    const results = await Post.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: regexPattern } },
            { body: { $regex: regexPattern } }
          ]
        }
      },
      {
        $lookup: {  // Join with comments
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments"
        }
      },
      {
        $lookup: {  // Join with tags
          from: "tags",
          localField: "_id",
          foreignField: "postId",
          as: "tags"
        }
      },
      {
        $addFields: {  // Filter comments and tags that match the search term
          filteredComments: {
            $filter: {
              input: "$comments",
              as: "comment",
              cond: { $regexMatch: { input: "$$comment.text", regex: searchNoSpecialChar, options: "i" } }
            }
          },
          filteredTags: {
            $filter: {
              input: "$tags",
              as: "tag",
              cond: { $regexMatch: { input: "$$tag.name", regex: searchNoSpecialChar, options: "i" } }
            }
          }
        }
      },
      {
        $match: {  // Ensure that we have relevant tags or comments
          $or: [
            { "filteredComments": { $ne: [] } },
            { "filteredTags": { $ne: [] } }
          ]
        }
      }
    ]);

    const locals = {
      title: "Search",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    };

    res.render("search", {
      data: results,
      locals,
      currentRoute: '/'
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});





const genreKeywords = {
  Technology: ['technology', 'software', 'hardware', 'AI', 'machine learning', 'internet', 'data'],
  Health: ['health', 'wellness', 'medical', 'hospital', 'doctor', 'nurse', 'medicine', 'healthcare'],
  Environment: ['environment', 'climate', 'pollution', 'sustainability', 'conservation', 'energy', 'renewable'],
  Entertainment: ['movie', 'music', 'game', 'entertainment', 'show', 'concert', 'theater', 'film']
};



router.get('/api/postsByGenre', async (req, res) => {
try {
  const posts = await Post.find();
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
        if (post.body && post.body.toLowerCase().includes(keyword.toLowerCase())) {
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
  // show full error message
  res.status(500).send(error.message);
}
});


// // Endpoint to get posts data for cumulative posts over time visualization
router.get('/api/postsByDate', async (req, res) => {
    try {
        // Fetch all posts sorted by creation date
        const posts = await Post.find({}).sort('createdAt');
        // Prepare data for the chart: map posts to their creation dates and index
        const data = posts.map((post, index) => ({
            createdAt: post.createdAt,
            cumulativeCount: index + 1
        }));

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts data", error });
    }
});



/**
 * GET /
 * About
*/
router.get('/about', (req, res) => {
  res.render('about', {
    currentRoute: '/about'
  });
});




module.exports = router;
