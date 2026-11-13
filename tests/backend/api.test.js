import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/src/app.js';

describe('AgriSmart AI API Endpoints', () => {
  it('GET /api/v1/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('AgriSmart AI');
  });

  it('GET /api/v1/farms without auth token returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/farms');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/farms with Bearer token retrieves user farms', async () => {
    const res = await request(app)
      .get('/api/v1/farms')
      .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/ai/crop-recommendation returns structured recommendation', async () => {
    const res = await request(app)
      .post('/api/v1/ai/crop-recommendation')
      .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000001')
      .send({
        soil_type: 'red_soil',
        soil_ph: 6.8,
        nitrogen: 210,
        phosphorus: 25,
        potassium: 160,
        season: 'Kharif',
        language: 'en'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.advisory_type).toBe('crop_recommendation');
    expect(Array.isArray(res.body.data.recommended_crops)).toBe(true);
    expect(res.body.data.recommended_crops.length).toBeGreaterThan(0);
    expect(res.body.data.recommended_crops[0]).toHaveProperty('crop_name');
    expect(res.body.data.recommended_crops[0]).toHaveProperty('suitability_score');
  });

  it('POST /api/v1/ai/fertilizer-advisory returns nutrient assessment', async () => {
    const res = await request(app)
      .post('/api/v1/ai/fertilizer-advisory')
      .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000001')
      .send({
        crop_name: 'Paddy',
        growth_stage: 'Tillering',
        soil_ph: 6.5,
        nitrogen: 200,
        phosphorus: 18,
        potassium: 140,
        language: 'en'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.advisory_type).toBe('fertilizer');
    expect(Array.isArray(res.body.data.nutrient_assessment)).toBe(true);
  });

  it('POST /api/v1/ai/irrigation-advisory returns water status and guidance', async () => {
    const res = await request(app)
      .post('/api/v1/ai/irrigation-advisory')
      .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000001')
      .send({
        crop_name: 'Maize',
        growth_stage: 'Silking',
        soil_type: 'Loamy',
        soil_moisture: 32,
        language: 'en'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.advisory_type).toBe('irrigation');
    expect(Array.isArray(res.body.data.irrigation_guidance)).toBe(true);
  });
});
