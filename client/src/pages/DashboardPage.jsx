import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Sparkles,
  Camera,
  TestTube,
  Droplets,
  CloudSun,
  MapPin,
  Wheat,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Download
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [advisories, setAdvisories] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [farmsRes, cropsRes, advisoriesRes] = await Promise.all([
          api.get('/farms').catch(() => ({ data: [] })),
          api.get('/crops').catch(() => ({ data: [] })),
          api.get('/advisories').catch(() => ({ data: [] }))
        ]);

        const farmList = farmsRes.data || [];
        setFarms(farmList);
        setCrops(cropsRes.data || []);
        setAdvisories(advisoriesRes.data || []);

        if (farmList.length > 0) {
          const weatherRes = await api.get(`/weather/${farmList[0].id}/current`).catch(() => null);
          if (weatherRes?.data) setWeather(weatherRes.data);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const quickActions = [
    {
      title: t.dashboard.start_recommendation,
      desc: 'AI suitability score & rotation planning',
      icon: Sparkles,
      color: 'bg-emerald-500',
      link: '/crops/recommend'
    },
    {
      title: t.dashboard.scan_disease,
      desc: 'Upload leaf photo for pathology diagnosis',
      icon: Camera,
      color: 'bg-amber-500',
      link: '/disease-detection'
    },
    {
      title: t.dashboard.calc_fertilizer,
      desc: 'Precision NPK commercial bag dosimeter',
      icon: TestTube,
      color: 'bg-blue-500',
      link: '/fertilizer-advisory'
    },
    {
      title: t.dashboard.plan_irrigation,
      desc: 'Evapotranspiration-based watering schedule',
      icon: Droplets,
      color: 'bg-cyan-500',
      link: '/irrigation-advisory'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-emerald-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-700/60 text-emerald-100 border border-emerald-500/30 mb-2">
              🌾 Digital Agronomic Intelligence Active
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {t.dashboard.welcome}, {user.full_name}!
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Location: {user.village || 'Mandya'}, {user.district || 'Karnataka'} | Farm Units: {farms.length} Registered Parcels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/crops/recommend">
              <Button variant="secondary" size="md" className="font-semibold shadow-sm">
                <Sparkles className="w-4 h-4 mr-2 text-primary-700" />
                {t.dashboard.start_recommendation}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center space-x-4 border-slate-200/80">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t.dashboard.registered_farms}</p>
            <p className="text-2xl font-bold text-slate-900">{farms.length}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-slate-200/80">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <Wheat className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t.dashboard.active_crops}</p>
            <p className="text-2xl font-bold text-slate-900">{crops.length}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-slate-200/80">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t.dashboard.recent_advisories}</p>
            <p className="text-2xl font-bold text-slate-900">{advisories.length}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-slate-200/80">
          <div className="p-3 bg-cyan-100 text-cyan-800 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active System Health</p>
            <p className="text-2xl font-bold text-emerald-700">100%</p>
          </div>
        </Card>
      </div>

      {/* Weather Widget */}
      {weather && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-sm">
                <CloudSun className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-slate-900 text-base">
                    Live Agricultural Weather Telemetry
                  </h3>
                  <Badge variant="info" size="xs">Live Feed</Badge>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Observed for {weather.farm_name} ({weather.location})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-white/80 rounded-xl p-2.5 border border-blue-100">
                <span className="text-[11px] font-medium text-slate-500 block">Temperature</span>
                <span className="text-base font-bold text-slate-800">{weather.temperature}°C</span>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5 border border-blue-100">
                <span className="text-[11px] font-medium text-slate-500 block">Humidity</span>
                <span className="text-base font-bold text-slate-800">{weather.humidity}%</span>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5 border border-blue-100">
                <span className="text-[11px] font-medium text-slate-500 block">Rainfall</span>
                <span className="text-base font-bold text-slate-800">{weather.rainfall} mm</span>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5 border border-blue-100">
                <span className="text-[11px] font-medium text-slate-500 block">Condition</span>
                <span className="text-xs font-semibold text-blue-900 truncate block mt-0.5">{weather.weather_condition}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">{t.dashboard.quick_actions}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} to={action.link}>
                <Card hover className="h-full flex flex-col justify-between">
                  <div>
                    <div className={`w-10 h-10 rounded-xl ${action.color} text-white flex items-center justify-center mb-3 shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">{action.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{action.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-primary-700">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Advisories Table */}
      <Card>
        <CardHeader
          title={t.dashboard.recent_advisories}
          subtitle="Review previous AI agronomic reports and download PDF summaries"
          action={
            <Link to="/history">
              <Button variant="outline" size="sm">View All History</Button>
            </Link>
          }
        />

        {advisories.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No Advisories Generated Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by requesting an AI crop suitability recommendation or scanning a plant leaf for disease.
            </p>
            <Link to="/crops/recommend" className="mt-4 inline-block">
              <Button size="sm">Generate First Advisory</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Advisory Type</th>
                  <th className="py-2.5 px-3">Farm / Crop</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advisories.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800 capitalize">
                      {item.advisory_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3">
                      {item.farms?.farm_name || 'Mandya Farm'}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={item.confidence_level === 'high' ? 'success' : 'warning'} size="xs">
                        {item.confidence_level || 'Medium'} Confidence
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <Link to={`/reports/${item.id}`} className="text-primary-700 hover:text-primary-800 font-semibold">
                        View
                      </Link>
                      <a
                        href={`/api/v1/advisories/${item.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-slate-700"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5 inline ml-1" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
