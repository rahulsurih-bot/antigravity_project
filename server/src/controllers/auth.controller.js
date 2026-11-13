import { supabase, memoryStore } from '../config/supabase.js';

export async function getMe(req, res) {
  try {
    let profile = req.user;

    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (!error && data) {
        profile = { ...req.user, ...data };
      }
    } else {
      const matched = memoryStore.users.find(u => u.id === req.user.id);
      if (matched) profile = matched;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      data: null,
      error: { code: 'PROFILE_FETCH_ERROR', details: [err.message] }
    });
  }
}

export async function updateProfile(req, res) {
  try {
    const updateData = req.body;
    // Disallow role changes via client update
    delete updateData.role;

    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data,
        error: null
      });
    }

    // Memory Store Fallback
    const user = memoryStore.users.find(u => u.id === req.user.id);
    if (user) {
      Object.assign(user, updateData, { updated_at: new Date().toISOString() });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user || req.user,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      data: null,
      error: { code: 'PROFILE_UPDATE_ERROR', details: [err.message] }
    });
  }
}
