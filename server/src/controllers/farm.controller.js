import { supabase, memoryStore } from '../config/supabase.js';
import crypto from 'crypto';

export async function listFarms(req, res) {
  try {
    if (supabase) {
      let query = supabase.from('farms').select('*, soil_tests(*)').order('created_at', { ascending: false });
      if (req.user.role !== 'admin') {
        query = query.eq('user_id', req.user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Farms retrieved', data, error: null });
    }

    const farms = req.user.role === 'admin'
      ? memoryStore.farms
      : memoryStore.farms.filter(f => f.user_id === req.user.id);

    res.status(200).json({ success: true, message: 'Farms retrieved', data: farms, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list farms', data: null, error: { code: 'FARMS_LIST_ERROR', details: [err.message] } });
  }
}

export async function createFarm(req, res) {
  try {
    const farmPayload = {
      ...req.body,
      user_id: req.user.id,
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .insert(farmPayload)
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Farm registered successfully', data, error: null });
    }

    const newFarm = {
      id: crypto.randomUUID(),
      ...farmPayload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.farms.unshift(newFarm);

    res.status(201).json({ success: true, message: 'Farm registered successfully', data: newFarm, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create farm', data: null, error: { code: 'FARM_CREATE_ERROR', details: [err.message] } });
  }
}

export async function getFarm(req, res) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .select('*, soil_tests(*), crops(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ success: false, message: 'Farm not found', data: null, error: { code: 'FARM_NOT_FOUND', details: ['No farm matching ID.'] } });
      }

      if (req.user.role !== 'admin' && data.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this farm', data: null, error: { code: 'FORBIDDEN', details: ['Not your farm.'] } });
      }

      return res.status(200).json({ success: true, message: 'Farm details retrieved', data, error: null });
    }

    const farm = memoryStore.farms.find(f => f.id === id);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found', data: null, error: { code: 'FARM_NOT_FOUND', details: ['Farm not found.'] } });
    }

    if (req.user.role !== 'admin' && farm.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden', data: null, error: { code: 'FORBIDDEN', details: ['Not your farm.'] } });
    }

    const soilTests = memoryStore.soil_tests.filter(s => s.farm_id === id);
    const crops = memoryStore.crops.filter(c => c.farm_id === id);

    res.status(200).json({ success: true, message: 'Farm details retrieved', data: { ...farm, soil_tests: soilTests, crops }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve farm', data: null, error: { code: 'FARM_FETCH_ERROR', details: [err.message] } });
  }
}

export async function updateFarm(req, res) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .update(req.body)
        .eq('id', id)
        .eq(req.user.role === 'admin' ? 'id' : 'user_id', req.user.role === 'admin' ? id : req.user.id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Farm updated successfully', data, error: null });
    }

    const farm = memoryStore.farms.find(f => f.id === id);
    if (!farm || (req.user.role !== 'admin' && farm.user_id !== req.user.id)) {
      return res.status(404).json({ success: false, message: 'Farm not found or unauthorized', data: null, error: { code: 'NOT_FOUND', details: ['Cannot update farm.'] } });
    }

    Object.assign(farm, req.body, { updated_at: new Date().toISOString() });
    res.status(200).json({ success: true, message: 'Farm updated successfully', data: farm, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update farm', data: null, error: { code: 'FARM_UPDATE_ERROR', details: [err.message] } });
  }
}

export async function deleteFarm(req, res) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', id)
        .eq(req.user.role === 'admin' ? 'id' : 'user_id', req.user.role === 'admin' ? id : req.user.id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Farm removed successfully', data: { id }, error: null });
    }

    const index = memoryStore.farms.findIndex(f => f.id === id && (req.user.role === 'admin' || f.user_id === req.user.id));
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Farm not found', data: null, error: { code: 'NOT_FOUND', details: ['Cannot delete farm.'] } });
    }

    memoryStore.farms.splice(index, 1);
    res.status(200).json({ success: true, message: 'Farm removed successfully', data: { id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete farm', data: null, error: { code: 'FARM_DELETE_ERROR', details: [err.message] } });
  }
}
