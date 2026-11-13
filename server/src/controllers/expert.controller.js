import { supabase, memoryStore } from '../config/supabase.js';

export async function listAssignedReviews(req, res) {
  try {
    if (supabase) {
      let query = supabase
        .from('expert_reviews')
        .select('*, advisory_reports(*, profiles(full_name, phone), farms(farm_name, state, district))');

      if (req.user.role !== 'admin') {
        query = query.eq('expert_id', req.user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Assigned reviews retrieved', data, error: null });
    }

    const reviews = req.user.role === 'admin'
      ? memoryStore.expert_reviews
      : memoryStore.expert_reviews.filter(r => r.expert_id === req.user.id);

    res.status(200).json({ success: true, message: 'Assigned reviews retrieved', data: reviews, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve expert reviews', data: null, error: { code: 'REVIEWS_FETCH_ERROR', details: [err.message] } });
  }
}

export async function submitReviewFeedback(req, res) {
  try {
    const { id } = req.params;
    const { review_status, review_notes } = req.body;

    if (supabase) {
      const { data, error } = await supabase
        .from('expert_reviews')
        .update({
          review_status,
          review_notes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Expert verification feedback submitted', data, error: null });
    }

    const review = memoryStore.expert_reviews.find(r => r.id === id);
    if (!review) return res.status(404).json({ success: false, message: 'Review assignment not found', data: null, error: { code: 'NOT_FOUND', details: ['Record not found.'] } });

    review.review_status = review_status;
    review.review_notes = review_notes;
    res.status(200).json({ success: true, message: 'Expert verification feedback submitted', data: review, error: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit review feedback', data: null, error: { code: 'REVIEW_SUBMIT_ERROR', details: [err.message] } });
  }
}
