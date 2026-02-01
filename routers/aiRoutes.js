const express=require('express')
const router=express.Router();
const AIcontroller = require('../controllers/AIcontroller.js');

router.post('/generate-client-need',AIcontroller.generateClientNeed);

module.exports = router;