import { supabase, memoryStore } from '../config/supabase.js';
import crypto from 'crypto';

export async function listSoilTests(req, res) {
  try {
    const { id: farmId } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('soil_tests')
        .select('*')
        .eq('farm_id', farmId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Soil tests retrieved', data, error: null });
    }

    const tests = memoryStore.soil_tests.filter(s => s.farm_id === farmId);
    res.status(200).json({ success: true, message: 'Soil tests retrieved', data: tests, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve soil tests', data: null, error: { code: 'SOIL_TEST_FETCH_ERROR', details: [err.message] } });
  }
}

export async function addSoilTest(req, res) {
  try {
    const { id: farmId } = req.params;
    const testPayload = {
      ...req.body,
      farm_id: farmId,
      user_id: req.user.id
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('soil_tests')
        .insert(testPayload)
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Soil test recorded successfully', data, error: null });
    }

    const newTest = {
      id: crypto.randomUUID(),
      ...testPayload,
      created_at: new Date().toISOString()
    };
    memoryStore.soil_tests.unshift(newTest);

    res.status(201).json({ success: true, message: 'Soil test recorded successfully', data: newTest, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record soil test', data: null, error: { code: 'SOIL_TEST_CREATE_ERROR', details: [err.message] } });
  }
}

export async function getSoilTest(req, res) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('soil_tests')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ success: false, message: 'Soil test not found', data: null, error: { code: 'NOT_FOUND', details: ['Record does not exist.'] } });
      }
      return res.status(200).json({ success: true, message: 'Soil test retrieved', data, error: null });
    }

    const test = memoryStore.soil_tests.find(s => s.id === id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Soil test not found', data: null, error: { code: 'NOT_FOUND', details: ['Record does not exist.'] } });
    }

    res.status(200).json({ success: true, message: 'Soil test retrieved', data: test, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve soil test', data: null, error: { code: 'SOIL_TEST_FETCH_ERROR', details: [err.message] } });
  }
}

export async function deleteSoilTest(req, res) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase
        .from('soil_tests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Soil test deleted', data: { id }, error: null });
    }

    const idx = memoryStore.soil_tests.findIndex(s => s.id === id);
    if (idx !== -1) memoryStore.soil_tests.splice(idx, 1);

    res.status(200).json({ success: true, message: 'Soil test deleted', data: { id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete soil test', data: null, error: { code: 'SOIL_TEST_DELETE_ERROR', details: [err.message] } });
  }
}
