const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

//@route    GET /api/v1/users
//@desc     Get all users
//@access   PRIVATE/ADMIN
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

//@route    GET /api/v1/users/:id
//@desc     Get single user
//@access   PRIVATE/ADMIN
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User with ID ${req.params.id} not found`, 400)
    );
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@route    POST /api/v1/users
//@desc     Create User
//@access   PRIVATE/ADMIN
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

//@route    PUT /api/v1/users/:id
//@desc     Update User
//@access   PRIVATE/ADMIN
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@route    DELETE /api/v1/users/:id
//@desc     Delete User
//@access   PRIVATE/ADMIN
exports.deleteUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
