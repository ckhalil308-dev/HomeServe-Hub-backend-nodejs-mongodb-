const express=require('express')
const router=express.Router();
const AIcontroller = require('../controllers/AIcontroller.js');

router.post('/generate-client-need',AIcontroller.generateClientNeed);
router.post('/update-description',AIcontroller.UpdateDescription);
router.post('/update-need',AIcontroller.UpdateClientNeed);

module.exports = router;