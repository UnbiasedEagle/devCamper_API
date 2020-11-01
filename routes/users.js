const router = require('express').Router();
const User = require('../models/User');

const { protect, authorize } = require('../middleware/auth');

const {
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/users');

const advancedResult = require('../middleware/advancedResults');

router
  .route('/')
  .get(protect, authorize('admin'), advancedResult(User), getUsers)
  .post(protect, authorize('admin'), createUser);

router
  .route('/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
