function authenticate(req, res, next) {
    if (req.session && req.session.userId) {
        next(); // If session exists and a userId is set, proceed
    } else {
        res.status(401).json({ message: "You are not authorized to perform this action" });
    }
}

module.exports = authenticate;
