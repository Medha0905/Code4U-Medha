const { verifyAccessToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiResponse');
const prisma = require('../config/db');

/**
 * Verifies the JWT access token and attaches { id, role, studentId/vendorId/adminId }
 * to req.user. Does NOT hit the DB on every request for the base user,
 * but resolves the role-specific profile id since almost every route needs it.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication token missing');

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { student: true, vendor: true, admin: true },
    });

    if (!user || !user.isActive) throw new ApiError(401, 'Invalid or inactive user');

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      profileId:
        user.role === 'STUDENT' ? user.student?.id :
        user.role === 'VENDOR' ? user.vendor?.id :
        user.admin?.id,
      raw: user,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Session expired, please log in again'));
    }
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
