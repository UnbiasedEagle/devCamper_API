const Course = require('../models/Course');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Bootcamp = require('../models/Bootcamp');

//@route    GET /api/v1/courses
//@route    GET /api/v1/bootcamps/:bootcampId/courses
//@desc     Get Courses
//@access   PUBLIC
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

//@route    GET /api/v1/courses/:id
//@desc     Get Single Course
//@access   PUBLIC
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate(
    'bootcamp',
    'name description'
  );

  if (!course) {
    return next(
      new ErrorResponse(`No course with id of ${req.params.id}`, 400)
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

//@route    POST /api/v1/bootcamps/:bootcampId/courses
//@desc     Add Course
//@access   PRIVATE
exports.addCourse = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`No bootcamp with id of ${req.params.id}`, 400)
    );
  }

  req.body.bootcamp = req.params.bootcampId;

  req.body.user = req.user._id;

  if (bootcamp.user.toString() !== req.user._id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user._id} is not authorized to add the course to bootcamp ${bootcamp._id}`,
        400
      )
    );
  }

  const course = await Course.create(req.body);

  res.status(201).json({
    success: true,
    data: course,
  });
});

//@route    PUT /api/v1/courses/:id
//@desc     Update Course
//@access   PRIVATE
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with id of ${req.params.id}`, 400)
    );
  }

  if (course.user.toString() !== req.user._id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user._id} is not authorized to upade the course`,
        400
      )
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: course,
  });
});

//@route    DELETE /api/v1/courses/:id
//@desc     Delete Course
//@access   PRIVATE
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with id of ${req.params.id}`, 400)
    );
  }

  if (course.user.toString() !== req.user._id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user._id} is not authorized to delete the course`,
        400
      )
    );
  }

  await course.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
