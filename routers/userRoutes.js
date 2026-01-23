const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
router.get('/all', authMiddleware, roleMiddleware(['admin']), userController.getAllUsers);
router.get('/pros', authMiddleware, roleMiddleware(['admin']), userController.getAllPros);
router.get('/clients', authMiddleware, roleMiddleware(['admin']), userController.getAllClients);
router.get('/me', authMiddleware, userController.getInfos);
router.get('/:id', authMiddleware, roleMiddleware(['admin']), userController.getUserById);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), userController.deleteUser);
router.put('/update-me', authMiddleware, userController.updateMe);
router.get('/specialite/:specialite', authMiddleware, userController.getProByspecialite);
router.put('/change-password', authMiddleware, userController.chnagerMotDePasse);
module.exports = router;
    