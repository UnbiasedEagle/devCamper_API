const bcrypt = require('bcryptjs');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

//@route    POST /api/v1/auth/register
//@desc     Register User
//@access   PUBLIC
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({ name, email, password, role });

  sendTokenResponse(user, 201, res);
});

//@route    POST /api/v1/auth/login
//@desc     Login User
//@access   PUBLIC
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid Credientials', 401));
  }

  const isPasswordMatch = await user.matchPassword(password);

  if (!isPasswordMatch) {
    return next(new ErrorResponse('Invalid Credientials', 401));
  }

  sendTokenResponse(user, 200, res);
});

//@route    GET /api/v1/auth/logout
//@desc     Logout user/ clear cookie
//@access   PRIVATE
exports.logout = asyncHandler(async (req, res, next) => {
  res.clearCookie('token');

  return res.status(200).json({
    success: true,
    data: {},
  });
});

//@route    GET /api/v1/auth/me
//@desc     Get current logged in user
//@access   PRIVATE
exports.getMe = asyncHandler(async (req, res, next) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
});

//@route    POST /api/v1/auth/forgotpassword
//@desc     Forgot Password
//@access   PUBLIC
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  //Get reset token
  const token = user.getResetToken();

  await user.save({ validateBeforeSave: false });

  //Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${token}`;

  const message = `You are receiving this email because you (or someone else) has requested to reset the password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      message,
      subject: 'Password reset token',
    });

    res.status(200).json({
      success: true,
      message: 'Email sent',
    });
  } catch (err) {
    console.log(err);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

//@route    PUT /api/v1/auth/resetpassword/:resetToken
//@desc     Reset Password
//@access   Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHmac('sha256', process.env.CRYPTO_SECRET)
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid Token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

//@route    PUT /api/v1/auth/updateDetails
//@desc     Update current logged in user
//@access   PRIVATE
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const updateObj = {};
  if (req.body.email) {
    updateObj.email = req.body.email;
  }

  if (req.body.name) {
    updateObj.name = req.body.name;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateObj, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@route    PUT /api/v1/auth/updatepassword
//@desc     Update password
//@access   PRIVATE
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendTokenResponse(user, 200, res);
});

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getAuthToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 1000 * 60 * 60 * 24
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.cookie('token', token, options);
  res.status(statusCode).json({
    success: true,
    token,
  });
};
