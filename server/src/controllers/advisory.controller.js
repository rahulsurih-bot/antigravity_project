import { supabase, memoryStore } from '../config/supabase.js';
import { generateAdvisoryPdf } from '../services/pdf/pdf.service.js';
import crypto from 'crypto';

export async function listAdvisories(req, res) {
  try {
    const { advisory_type, farm_id } = req.query;

    if (supabase) {
      let query = supabase
        .from('advisory_reports')
        .select('*, farms(farm_name, state, district), crops(crop_name)');

      if (req.user.role !== 'admin' && req.user.role !== 'expert') {
        query = query.eq('user_id', req.user.id);
      }
      if (advisory_type) query = query.eq('advisory_type', advisory_type);
      if (farm_id) query = query.eq('farm_id', farm_id);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Advisory reports retrieved', data, error: null });
    }

    let reports = (req.user.role === 'admin' || req.user.role === 'expert')
      ? memoryStore.advisory_reports
      : memoryStore.advisory_reports.filter(r => r.user_id === req.user.id);

    if (advisory_type) reports = reports.filter(r => r.advisory_type === advisory_type);
    if (farm_id) reports = reports.filter(r => r.farm_id === farm_id);

    res.status(200).json({ success: true, message: 'Advisory reports retrieved', data: reports, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve advisories', data: null, error: { code: 'ADVISORY_LIST_ERROR', details: [err.message] } });
  }
}

export async function getAdvisory(req, res) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('advisory_reports')
        .select('*, farms(*), crops(*), advisory_feedback(*)')
        .eq('id', id)
        .single();

      if (error || !data) return res.status(404).json({ success: false, message: 'Advisory not found', data: null, error: { code: 'NOT_FOUND', details: ['Report not found.'] } });

      if (req.user.role !== 'admin' && req.user.role !== 'expert' && data.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden access', data: null, error: { code: 'FORBIDDEN', details: ['Cannot view another user\'s advisory report.'] } });
      }

      return res.status(200).json({ success: true, message: 'Advisory report retrieved', data, error: null });
    }

    const report = memoryStore.advisory_reports.find(r => r.id === id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found', data: null, error: { code: 'NOT_FOUND', details: ['Report not found.'] } });

    if (req.user.role !== 'admin' && req.user.role !== 'expert' && report.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden', data: null, error: { code: 'FORBIDDEN', details: ['Not authorized.'] } });
    }

    const farm = memoryStore.farms.find(f => f.id === report.farm_id);
    const feedback = memoryStore.advisory_feedback.filter(fb => fb.advisory_id === id);

    res.status(200).json({ success: true, message: 'Advisory report retrieved', data: { ...report, farms: farm, advisory_feedback: feedback }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve advisory', data: null, error: { code: 'ADVISORY_FETCH_ERROR', details: [err.message] } });
  }
}

export async function deleteAdvisory(req, res) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase.from('advisory_reports').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Advisory report deleted', data: { id }, error: null });
    }

    const idx = memoryStore.advisory_reports.findIndex(r => r.id === id);
    if (idx !== -1) memoryStore.advisory_reports.splice(idx, 1);
    res.status(200).json({ success: true, message: 'Advisory report deleted', data: { id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete advisory', data: null, error: { code: 'ADVISORY_DELETE_ERROR', details: [err.message] } });
  }
}

export async function submitFeedback(req, res) {
  try {
    const { id: advisoryId } = req.params;
    const { rating, feedback } = req.body;

    const payload = {
      user_id: req.user.id,
      advisory_id: advisoryId,
      rating,
      feedback: feedback || null
    };

    if (supabase) {
      const { data, error } = await supabase.from('advisory_feedback').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Feedback submitted successfully', data, error: null });
    }

    const newFb = { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() };
    memoryStore.advisory_feedback.push(newFb);
    res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: newFb, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback', data: null, error: { code: 'FEEDBACK_ERROR', details: [err.message] } });
  }
}

export async function downloadPdf(req, res) {
  try {
    const { id } = req.params;
    let advisory = null;
    let farm = null;
    let userProfile = req.user;

    if (supabase) {
      const { data } = await supabase
        .from('advisory_reports')
        .select('*, farms(*)')
        .eq('id', id)
        .single();
      advisory = data;
      farm = data?.farms;
    } else {
      advisory = memoryStore.advisory_reports.find(r => r.id === id);
      if (advisory) {
        farm = memoryStore.farms.find(f => f.id === advisory.farm_id);
      }
    }

    if (!advisory) {
      return res.status(404).json({ success: false, message: 'Advisory report not found', data: null, error: { code: 'NOT_FOUND', details: ['Report not found.'] } });
    }

    const pdfBytes = await generateAdvisoryPdf(advisory, userProfile, farm);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AgriSmart_Advisory_${advisory.advisory_type}_${id.slice(0, 8)}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate PDF document', data: null, error: { code: 'PDF_GENERATION_ERROR', details: [err.message] } });
  }
}
