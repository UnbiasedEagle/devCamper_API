const Bootcamp = require('../models/Bootcamp');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const geocoder = require('../utils/nodeGeocoder');

//@route    GET /api/v1/bootcamps
//@desc     Get Bootcamps
//@access   PUBLIC
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

//@route    GET /api/v1/bootcamps/:id
//@desc     Get Bootcamp
//@access   PUBLIC
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: bootcamp,
  });
});

//@route    POST /api/v1/bootcamps
//@desc     Create Bootcamp
//@access   PRIVATE
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  //Add user to body
  req.body.user = req.user;

  const hasBootcampPublished = await Bootcamp.findOne({ user: req.user._id });

  if (hasBootcampPublished && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user._id} has already published a bootcamp`,
        400
      )
    );
  }

  bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({
    success: true,
    data: bootcamp,
  });
});

//@route    PUT /api/v1/bootcamps/:id
//@desc     Update Bootcamp
//@access   PRIVATE
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  if (bootcamp.user.toString() !== req.user._id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User with ID ${req.user._id} is not allowed to update the bootcamp`,
        401
      )
    );
  }

  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: bootcamp,
  });
});

//@route    DELETE /api/v1/bootcamps/:id
//@desc     Delete Bootcamp
//@access   PRIVATE
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  if (bootcamp.user.toString() !== req.user._id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User with ID ${req.user._id} is not allowed to delete the bootcamp`,
        401
      )
    );
  }

  await bootcamp.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

//@route    GET /api/v1/bootcamps/radius/:zipcode/:distance
//@desc     Get bootcamps within a radius
//@access   PRIVATE
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);

  const latitude = loc[0].latitude;
  const longitude = loc[0].longitude;

  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  });
  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

//@route    PUT /api/v1/bootcamps/:id/photo
//@desc     Upload photo for bootcamp
//@access   PRIVATE
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload a image file', 400));
  }

  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload a photo less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  file.name = `photo_${req.params.id}.${file.mimetype.slice(6)}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async function (err) {
    if (err) {
      return next(new ErrorResponse('Problem with file upload', 500));
    }

    await Bootcamp.findByIdAndUpdate(
      bootcamp._id,
      { photo: file.name },
      { runValidators: true, new: true }
    );

    return res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});
