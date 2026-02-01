const express = require('express');
const router = express.Router();
const CommentsController = require('../controllers/CommentsController');
const authMiddleware = require('../middleware/authMiddleware');
router.post('/ajouter', authMiddleware, CommentsController.ajouterCommentaire);
router.get('/service/:serviceId', CommentsController.getCommentairesParService);
module.exports = router;