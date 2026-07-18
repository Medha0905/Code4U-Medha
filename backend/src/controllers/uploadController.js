const { ApiError, ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');

/** Returns a publicly servable URL for the uploaded image (served via /uploads static route). */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file provided');

  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  return ok(res, { url }, 'Image uploaded');
});

module.exports = { uploadImage };
