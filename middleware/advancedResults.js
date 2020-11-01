const advancedResult = (model, populate) => async (req, res, next) => {
  let query;

  //Copy req.query
  const reqQuery = { ...req.query };

  //Removed Fields
  const removedFields = ['select', 'sort', 'limit', 'page'];

  for (let key of removedFields) {
    delete reqQuery[key];
  }

  //Creating queryStrings
  let queryStr = JSON.stringify(reqQuery);

  //Creating $gt $lt $gte $lte $in operator
  queryStr = queryStr.replace(
    /\b(gt|lt|gte|lte|in)\b/g,
    (match) => '$' + match
  );

  query = model.find(JSON.parse(queryStr));

  if (req.query.select) {
    const select = req.query.select.split(',').join(' ');

    query = query.select(select);
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  //Pagintion
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 25;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const totalBootcamps = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  const pagination = {};

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit: limit,
    };
  }
  if (endIndex < totalBootcamps) {
    pagination.next = {
      page: page + 1,
      limit: limit,
    };
  }

  const results = await query;

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResult;
