const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authmiddleware = async (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({message:'No token, authorization denied'});
        }
        const token=authHeader.split(' ')[1];
        const decoded=jwt.verify(token, process.env.JWT_SECRET);
        req.user=await User.findById(decoded.id).select('-password');
        next();
    }
    catch(error){ 
        return res.status(401).json({message:'Token is not valid'});

           



    }
    






}
module.exports = authmiddleware;