export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication session required.',
        data: null,
        error: { code: 'UNAUTHORIZED', details: ['User is not authenticated.'] }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You do not hold the required permissions for this resource.',
        data: null,
        error: {
          code: 'FORBIDDEN',
          details: [`Required roles: ${allowedRoles.join(', ')}. Current role: ${req.user.role}`]
        }
      });
    }

    next();
  };
}
