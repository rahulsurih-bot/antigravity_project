import { supabase, memoryStore } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or malformed Bearer token.',
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          details: ['Please login to access this agricultural advisory service.']
        }
      });
    }

    const token = authHeader.split(' ')[1];

    // If Supabase is connected, verify JWT with Supabase Auth
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired authentication session.',
          data: null,
          error: {
            code: 'SESSION_EXPIRED',
            details: [error?.message || 'Token verification failed.']
          }
        });
      }

      // Fetch profile to attach verified role and metadata
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      req.user = {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || 'Farmer',
        role: profile?.role || 'farmer',
        preferred_language: profile?.preferred_language || 'en'
      };

      return next();
    }

    // Local in-memory development fallback
    const matchedUser = memoryStore.users.find(u => u.id === token || u.email === token) || memoryStore.users[0];
    req.user = {
      id: matchedUser.id,
      email: matchedUser.email,
      full_name: matchedUser.full_name,
      role: matchedUser.role,
      preferred_language: matchedUser.preferred_language
    };

    return next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Authentication verification encountered an unexpected error.',
      data: null,
      error: {
        code: 'AUTH_INTERNAL_ERROR',
        details: [err.message]
      }
    });
  }
}
