import { fetchFarmWeather } from '../services/weather/weather.service.js';
import { supabase, memoryStore } from '../config/supabase.js';

export async function getCurrentWeather(req, res) {
  try {
    const { farmId } = req.params;
    let farm = null;

    if (supabase) {
      const { data } = await supabase.from('farms').select('*').eq('id', farmId).single();
      farm = data;
    } else {
      farm = memoryStore.farms.find(f => f.id === farmId);
    }

    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found', data: null, error: { code: 'NOT_FOUND', details: ['Farm does not exist.'] } });
    }

    const weather = await fetchFarmWeather(farm.latitude, farm.longitude);

    res.status(200).json({
      success: true,
      message: 'Current weather telemetry retrieved',
      data: {
        farm_id: farm.id,
        farm_name: farm.farm_name,
        location: `${farm.village || farm.district}, ${farm.state}`,
        ...weather.current
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve current weather', data: null, error: { code: 'WEATHER_FETCH_ERROR', details: [err.message] } });
  }
}

export async function getForecast(req, res) {
  try {
    const { farmId } = req.params;
    let farm = null;

    if (supabase) {
      const { data } = await supabase.from('farms').select('*').eq('id', farmId).single();
      farm = data;
    } else {
      farm = memoryStore.farms.find(f => f.id === farmId);
    }

    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found', data: null, error: { code: 'NOT_FOUND', details: ['Farm does not exist.'] } });
    }

    const weather = await fetchFarmWeather(farm.latitude, farm.longitude);

    res.status(200).json({
      success: true,
      message: '7-day agricultural forecast retrieved',
      data: {
        farm_id: farm.id,
        farm_name: farm.farm_name,
        forecast: weather.forecast
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve weather forecast', data: null, error: { code: 'FORECAST_FETCH_ERROR', details: [err.message] } });
  }
}
