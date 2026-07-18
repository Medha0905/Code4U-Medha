const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { ApiError, ok, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');

function buildTokens(user) {
  const payload = { sub: user.id, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

/** Student self-registration. */
const registerStudent = asyncHandler(async (req, res) => {
  const { email, password, fullName, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'STUDENT',
      student: { create: { fullName, phone } },
    },
    include: { student: true },
  });

  const tokens = buildTokens(user);
  return created(res, { user: sanitizeUser(user), ...tokens }, 'Student account created');
});

/** Vendor self-registration (shop is registered separately after this). */
const registerVendor = asyncHandler(async (req, res) => {
  const { email, password, fullName, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'VENDOR',
      vendor: { create: { fullName, phone } },
    },
    include: { vendor: true },
  });

  const tokens = buildTokens(user);
  return created(res, { user: sanitizeUser(user), ...tokens }, 'Vendor account created');
});

/** Unified login for all roles. */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { student: true, vendor: { include: { shop: true } }, admin: true },
  });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new ApiError(401, 'Invalid email or password');

  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');

  const tokens = buildTokens(user);
  return ok(res, { user: sanitizeUser(user), ...tokens }, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'Refresh token required');

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid session');

  const tokens = buildTokens(user);
  return ok(res, tokens, 'Token refreshed');
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { student: true, vendor: { include: { shop: true } }, admin: true },
  });
  return ok(res, sanitizeUser(user));
});

module.exports = { registerStudent, registerVendor, login, refresh, me };
