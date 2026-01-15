const express=require('express');
const router=express.Router();
const demandeController=require('../controllers/demandeController');
const authMiddleware=require('../middleware/authMiddleware');
const roleMiddleware=require('../middleware/roleMiddleware');
router.post('/create',authMiddleware,demandeController.createDemande);
router.get('/pro/demandes',authMiddleware,roleMiddleware(['professionnel']),demandeController.geteDemandeForPro);
    router.put('/pro/demandes/:id/status',authMiddleware,roleMiddleware(['professionnel']),demandeController.updateStatus);

module.exports=router;