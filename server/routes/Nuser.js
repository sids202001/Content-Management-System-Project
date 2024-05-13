const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Middleware to ensure only admins can access
const authenticateAdmin = (req, res, next) => {
    if (!req.session.userId || !req.session.isAdmin) {
        return res.status(403).send('Access denied.');
    }
    next();
};

// Display all users
router.get('/users', authenticateAdmin, async (req, res) => {
    const users = await User.find();
    res.render('admin/users', { users }); // Adjust path if your admin views are organized differently
});

// GET route to show form to add a new user
router.get('/users/new', authenticateAdmin, (req, res) => {
    res.render('admin/add-user'); // Adjust path if your admin views are organized differently
});

// POST route to add a new user
router.post('/users', authenticateAdmin, async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ username, password: hashedPassword, email });
    try {
        await newUser.save();
        res.redirect('/admin/users');
    } catch (error) {
        res.status(500).send('Error creating user: ' + error.message);
    }
});

// DELETE route to delete a user
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/admin/users');
    } catch (error) {
        res.status(500).send('Error deleting user: ' + error.message);
    }
});

module.exports = router;
