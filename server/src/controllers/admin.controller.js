import { supabase, memoryStore } from '../config/supabase.js';

export async function getPlatformStats(req, res) {
  try {
    let stats = {
      total_farmers: 0,
      total_farms: 0,
      total_crops: 0,
      total_advisories: 0,
      total_disease_scans: 0
    };

    if (supabase) {
      const [u, f, c, a, d] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('farms').select('id', { count: 'exact', head: true }),
        supabase.from('crops').select('id', { count: 'exact', head: true }),
        supabase.from('advisory_reports').select('id', { count: 'exact', head: true }),
        supabase.from('disease_analyses').select('id', { count: 'exact', head: true })
      ]);

      stats = {
        total_farmers: u.count || 0,
        total_farms: f.count || 0,
        total_crops: c.count || 0,
        total_advisories: a.count || 0,
        total_disease_scans: d.count || 0
      };
    } else {
      stats = {
        total_farmers: memoryStore.users.length,
        total_farms: memoryStore.farms.length,
        total_crops: memoryStore.crops.length,
        total_advisories: memoryStore.advisory_reports.length,
        total_disease_scans: memoryStore.disease_analyses.length
      };
    }

    res.status(200).json({
      success: true,
      message: 'Platform administrative metrics retrieved',
      data: stats,
      error: null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve stats', data: null, error: { code: 'STATS_ERROR', details: [err.message] } });
  }
}

export async function listAllUsers(req, res) {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Users retrieved', data, error: null });
    }

    res.status(200).json({ success: true, message: 'Users retrieved', data: memoryStore.users, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list users', data: null, error: { code: 'USERS_FETCH_ERROR', details: [err.message] } });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['farmer', 'expert', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role assignment', data: null, error: { code: 'INVALID_ROLE', details: ['Role must be farmer, expert, or admin.'] } });
    }

    if (supabase) {
      const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'User role updated by administrator', data, error: null });
    }

    const user = memoryStore.users.find(u => u.id === id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found', data: null, error: { code: 'NOT_FOUND', details: ['User does not exist.'] } });

    user.role = role;
    res.status(200).json({ success: true, message: 'User role updated by administrator', data: user, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update role', data: null, error: { code: 'ROLE_UPDATE_ERROR', details: [err.message] } });
  }
}
