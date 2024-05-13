const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Favorite = require('../models/Favorite'); // Make sure the path is correct
const Tags = require('../models/Tags'); 

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = "MySecretBlog";


/**
 * 
 * Check Login
*/
const authMiddleware = (req, res, next ) => {
  const token = req.cookies.token;

  if(!token) {
    return res.status(401).json( { message: 'Unauthorized'} );
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch(error) {
    res.status(401).json( { message: 'Unauthorized'} );
  }
}


/**
 * GET /
 * Admin - Login Page
*/
router.get('/admin', async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    }

    res.render('admin/index', { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});


/**
 * POST /
 * Admin - Check Login
*/
router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne( { username } );

    if(!user) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }

    const token = jwt.sign({ userId: user._id}, jwtSecret );
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');

  } catch (error) {
    console.log(error);
  }
});


/**
 * GET /
 * Admin Dashboard
*/
// router.get('/dashboard', async (req, res) => {
//   try {
//     const locals = {
//       title: 'Dashboard',
//       description: 'Simple Blog created with NodeJs, Express & MongoDb.'
//     }

//     // Fetching posts data
//     const posts = await Post.find();

//     // Fetching users data
//     const users = await User.find();  // Assuming you have a User model similar to the Post model

//     res.render('admin/dashboard', {
//       locals,
//       posts,  // Changed 'data' to 'posts' for clarity
//       users,  // Added users data
//       layout: adminLayout  // Assuming 'adminLayout' is a string identifier for your layout file
//     });

//   } catch (error) {
//     console.log(error);
//     res.status(500).send('An error occurred');  // Send an HTTP error response if something goes wrong
//   }
// });

router.get('/dashboard', async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    };

    // Assuming 'currentUser' is the id of the logged-in user obtained from session or auth
    const currentUser = "6622cf61041e709b6273d604";  // Modify according to your user session or authentication mechanism

    // Fetching all posts
    const allPosts = await Post.find().lean();

    // Fetching posts favorited by the current user
    const favoritedPosts = await Favorite.find({ userId: currentUser }).populate('postId').lean();

    // Extracting the post details from the favoritedPosts
    const userFavorites = favoritedPosts.map(fav => fav.postId);

    // Removing favorited posts from the allPosts array
    const nonFavoritedPosts = allPosts.filter(post => !userFavorites.some(fav => fav._id.toString() === post._id.toString()));

    // Fetching users data, if needed
    const users = await User.find(); // Assuming you have a User model similar to the Post model

    res.render('admin/dashboard', {
      locals,
      posts: nonFavoritedPosts, // Posts not favorited by the current user
      favoritedPosts: userFavorites, // Only posts favorited by the current user
      users, // Added users data
      layout: adminLayout // Assuming 'adminLayout' is a string identifier for your layout file
    });

  } catch (error) {
    console.log(error);
    res.status(500).send('An error occurred');  // Send an HTTP error response if something goes wrong
  }
});


router.post('/unfavorite-post/:id', async (req, res) => {
  // Assuming 'currentUser' is the id of the logged-in user obtained from session or auth
  // Make sure your authentication middleware sets `req.user`

  const postId = req.params.id;
  const userId =  "6622cf61041e709b6273d604";

  try {
      // Find and remove the favorite entry
      const result = await Favorite.findOneAndDelete({
          postId: postId,
          userId: userId
      });

      if (!result) {
          return res.status(404).send('Favorite not found');
      }

      // Redirect back to the dashboard or send a success message
      res.redirect('/dashboard'); // You can adjust the redirection based on your app flow
      // Alternatively, if you're handling this with AJAX:
      // res.status(200).json({ message: 'Post has been unfavorited' });
  } catch (error) {
      console.log(error);
      res.status(500).send('An error occurred while unfavoriting the post');
  }
});


router.post('/delete-user/:id/DELETE', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');  // Redirect to the dashboard or any other appropriate page
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).send('Error deleting user');
  }
});




/**
 * GET /
 * Admin - Create New Post
*/
router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Post',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const data = await Post.find();
    res.render('admin/add-post', {
      locals,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * POST /
 * Admin - Create New Post
*/


const axios = require('axios');

router.post('/add-post', authMiddleware, async (req, res) => {
  try {
    if (!req.body.title && req.body.body) {

      const apiUrl = 'https://api-inference.huggingface.co/models/fabiochiu/t5-base-medium-title-generation';


      const headers = {
        'Authorization': `Bearer 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`
      };


      const data = {
        inputs: `Generate an appropriate title based on the following content: ${req.body.body}`,
        parameters: { max_length: 200},

        options: { use_cache: false, wait_for_model: true }
      };

      const response = await axios.post(apiUrl, data, { headers: headers });
      console.log('Generated title:', response.data);
  
      
      req.body.title = response.data[0].generated_text;
      
    }

    const newPost = new Post({
      title: req.body.title,
      body: req.body.body
    });

    await newPost.save();
    res.status(201).send({ message: 'Post added successfully!', post: newPost });
  } catch (error) {
    console.error('Failed to add post:', error);
    res.status(500).send({ message: 'Failed to add post' });
  }
});



/**
 * GET /
 * Admin - Create New Post
*/
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {

    const locals = {
      title: "Edit Post",
      description: "Free NodeJs User Management System",
    };

    const data = await Post.findOne({ _id: req.params.id });

    res.render('admin/edit-post', {
      locals,
      data,
      layout: adminLayout
    })

  } catch (error) {
    console.log(error);
  }

});


/**
 * PUT /
 * Admin - Create New Post
*/
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {

    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now()
    });

    res.redirect(`/edit-post/${req.params.id}`);

  } catch (error) {
    console.log(error);
  }

});


router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if(req.body.username === 'admin' && req.body.password === 'password') {
      res.send('You are logged in.')
    } else {
      res.send('Wrong username or password');
    }

  } catch (error) {
    console.log(error);
  }
});


/**
 * POST /
 * Admin - Register
*/
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password)
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ username, password: hashedPassword });
    
    res.status(201).json({ message: 'User Created', user });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      // Duplicate key error
      res.status(409).json({ message: 'Username already in use' });
    } else {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
});



/**
 * DELETE /
 * Admin - Delete Post
*/
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {

  try {
    await Post.deleteOne( { _id: req.params.id } );
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * ALL Posts
 */

router.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find({}).sort('createdAt'); // Sort posts by creation date
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
});

/**
 * GET /
 * Posts Visualization
 */
router.get('/visualization', (req, res) => {
  const locals = {
    title: 'Add Post',
    description: 'Simple Blog created with NodeJs, Express & MongoDb.'
  }
  res.render('admin/visualization', {locals, layout: adminLayout});
});


/**
 * GET /
 * Admin Logout
*/
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  //res.json({ message: 'Logout successful.'});
  res.redirect('/');
});


module.exports = router;