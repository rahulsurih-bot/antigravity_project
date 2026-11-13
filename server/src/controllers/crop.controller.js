import { supabase, memoryStore } from '../config/supabase.js';
import crypto from 'crypto';

export async function listCrops(req, res) {
  try {
    const { farm_id } = req.query;

    if (supabase) {
      let query = supabase.from('crops').select('*, farms(farm_name)');
      if (req.user.role !== 'admin') query = query.eq('user_id', req.user.id);
      if (farm_id) query = query.eq('farm_id', farm_id);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Crops retrieved', data, error: null });
    }

    let crops = req.user.role === 'admin'
      ? memoryStore.crops
      : memoryStore.crops.filter(c => c.user_id === req.user.id);

    if (farm_id) crops = crops.filter(c => c.farm_id === farm_id);

    res.status(200).json({ success: true, message: 'Crops retrieved', data: crops, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve crops', data: null, error: { code: 'CROPS_FETCH_ERROR', details: [err.message] } });
  }
}

export async function createCrop(req, res) {
  try {
    const cropPayload = {
      ...req.body,
      user_id: req.user.id
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('crops')
        .insert(cropPayload)
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Crop registered successfully', data, error: null });
    }

    const newCrop = {
      id: crypto.randomUUID(),
      ...cropPayload,
      created_at: new Date().toISOString()
    };
    memoryStore.crops.unshift(newCrop);

    res.status(201).json({ success: true, message: 'Crop registered successfully', data: newCrop, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create crop', data: null, error: { code: 'CROP_CREATE_ERROR', details: [err.message] } });
  }
}

export async function getCrop(req, res) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { data, error } = await supabase.from('crops').select('*').eq('id', id).single();
      if (error || !data) return res.status(404).json({ success: false, message: 'Crop not found', data: null, error: { code: 'NOT_FOUND', details: ['Crop not found.'] } });
      return res.status(200).json({ success: true, message: 'Crop retrieved', data, error: null });
    }

    const crop = memoryStore.crops.find(c => c.id === id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found', data: null, error: { code: 'NOT_FOUND', details: ['Crop not found.'] } });

    res.status(200).json({ success: true, message: 'Crop retrieved', data: crop, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve crop', data: null, error: { code: 'CROP_FETCH_ERROR', details: [err.message] } });
  }
}

export async function updateCrop(req, res) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { data, error } = await supabase.from('crops').update(req.body).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Crop updated', data, error: null });
    }

    const crop = memoryStore.crops.find(c => c.id === id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found', data: null, error: { code: 'NOT_FOUND', details: ['Crop not found.'] } });

    Object.assign(crop, req.body);
    res.status(200).json({ success: true, message: 'Crop updated', data: crop, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update crop', data: null, error: { code: 'CROP_UPDATE_ERROR', details: [err.message] } });
  }
}

export async function deleteCrop(req, res) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase.from('crops').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Crop deleted', data: { id }, error: null });
    }

    const idx = memoryStore.crops.findIndex(c => c.id === id);
    if (idx !== -1) memoryStore.crops.splice(idx, 1);
    res.status(200).json({ success: true, message: 'Crop deleted', data: { id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete crop', data: null, error: { code: 'CROP_DELETE_ERROR', details: [err.message] } });
  }
}
