import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { MapPin, Plus, Compass, Droplet, Sprout, ArrowRight } from 'lucide-react';

export function FarmsPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    farm_name: '',
    address: '',
    state: 'Karnataka',
    district: 'Mandya',
    village: '',
    area: '3.5',
    area_unit: 'acre',
    soil_type: 'red_soil',
    water_source: 'Canal & Borewell',
    irrigation_method: 'Drip Irrigation',
    latitude: 12.5234,
    longitude: 76.8967
  });

  const loadFarms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/farms');
      setFarms(res.data || []);
    } catch (err) {
      console.error('Error fetching farms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const handleDetectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6))
          }));
        },
        (err) => alert('Unable to detect location. Using default coordinates.')
      );
    }
  };

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        area: parseFloat(formData.area),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      await api.post('/farms', payload);
      setIsModalOpen(false);
      setFormData({
        farm_name: '',
        address: '',
        state: 'Karnataka',
        district: 'Mandya',
        village: '',
        area: '2.5',
        area_unit: 'acre',
        soil_type: 'red_soil',
        water_source: 'Borewell',
        irrigation_method: 'Drip Irrigation',
        latitude: 12.5234,
        longitude: 76.8967
      });
      loadFarms();
    } catch (err) {
      setError(err.message || 'Failed to register farm parcel.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agricultural Land & Farm Parcels</h1>
          <p className="text-xs text-slate-500 mt-1">
            Register and manage your geographic agricultural plots, soil metrics, and irrigation systems.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Register New Farm Parcel
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-200/60 rounded-xl" />
          ))}
        </div>
      ) : farms.length === 0 ? (
        <Card className="text-center py-12">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Farm Parcels Registered</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add your agricultural land parcel with soil type and irrigation details to enable AI-powered crop advisory.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-4">
            Register First Farm
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {farms.map((farm) => (
            <Card key={farm.id} hover className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-100 text-primary-800 rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{farm.farm_name}</h3>
                      <p className="text-[11px] text-slate-500">{farm.village || farm.district}, {farm.state}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="xs">
                    {farm.area} {farm.area_unit}s
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Soil Type</span>
                    <span className="font-medium text-slate-700 capitalize">{farm.soil_type?.replace('_', ' ') || 'Red Soil'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Irrigation</span>
                    <span className="font-medium text-slate-700">{farm.irrigation_method || 'Drip'}</span>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">GPS Location</span>
                    <span className="font-mono text-[11px] text-slate-600">
                      {farm.latitude?.toFixed(4)}, {farm.longitude?.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link to={`/farms/${farm.id}`} className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center">
                  View Soil Tests & Crops
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
                <Link to={`/weather?farmId=${farm.id}`} className="text-[11px] text-slate-500 hover:text-slate-800">
                  Weather Feed
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Farm Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Agricultural Farm Parcel">
        <form onSubmit={handleCreateFarm} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}

          <Input
            label="Farm Parcel Name"
            placeholder="e.g. Somanahalli Canal Plot 1"
            value={formData.farm_name}
            onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
            <Input
              label="District"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              required
            />
          </div>

          <Input
            label="Village / Landmark"
            placeholder="e.g. Somanahalli village, near lake"
            value={formData.village}
            onChange={(e) => setFormData({ ...formData, village: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Area Size"
              type="number"
              step="0.1"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              required
            />
            <Select
              label="Area Unit"
              value={formData.area_unit}
              onChange={(e) => setFormData({ ...formData, area_unit: e.target.value })}
              options={[
                { value: 'acre', label: 'Acres' },
                { value: 'hectare', label: 'Hectares' },
                { value: 'guntha', label: 'Gunthas' },
                { value: 'bigha', label: 'Bighas' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Soil Classification"
              value={formData.soil_type}
              onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
              options={[
                { value: 'red_soil', label: 'Red / Yellow Soil' },
                { value: 'black_soil', label: 'Black Soil (Regur)' },
                { value: 'alluvial_soil', label: 'Alluvial Soil' },
                { value: 'loamy_soil', label: 'Loamy Soil' },
                { value: 'sandy_soil', label: 'Sandy Loam' },
                { value: 'clay_soil', label: 'Clayey Soil' },
                { value: 'laterite_soil', label: 'Laterite Soil' }
              ]}
            />
            <Select
              label="Irrigation Method"
              value={formData.irrigation_method}
              onChange={(e) => setFormData({ ...formData, irrigation_method: e.target.value })}
              options={[
                { value: 'Drip Irrigation', label: 'Drip Irrigation' },
                { value: 'Sprinkler Irrigation', label: 'Sprinkler Irrigation' },
                { value: 'Surface / Flood', label: 'Surface / Flood' },
                { value: 'Rainfed', label: 'Rainfed Only' }
              ]}
            />
          </div>

          {/* GPS Section */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">GPS Coordinates (Optional)</span>
              <button
                type="button"
                onClick={handleDetectGPS}
                className="text-[11px] text-primary-700 hover:text-primary-800 font-semibold flex items-center"
              >
                <Compass className="w-3.5 h-3.5 mr-1" />
                Detect Current GPS
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Latitude"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
              <Input
                placeholder="Longitude"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Register Parcel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
