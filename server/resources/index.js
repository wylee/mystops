const express = require('express');

const router = express.Router();

router.get('/', (req, res, next) => {
  res.json({ title: 'MyStops' });
});

module.exports = router;
