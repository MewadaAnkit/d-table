import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Compass,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Navigation,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  Info
} from 'lucide-react';
import { useGetGeofenceConfigQuery, useUpdateGeofenceConfigMutation } from '../../services/api';
import { Button } from '../common/Button';

interface GeofenceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeofenceSettingsModal: React.FC<GeofenceSettingsModalProps> = ({ isOpen, onClose }) => {
  const { data: configData, isLoading: isLoadingConfig, refetch } = useGetGeofenceConfigQuery();
  const [updateGeofence, { isLoading: isUpdating }] = useUpdateGeofenceConfigMutation();

  const [officeName, setOfficeName] = useState('Headquarters (Main Office)');
  const [officeLat, setOfficeLat] = useState<number>(37.774929);
  const [officeLng, setOfficeLng] = useState<number>(-122.419416);
  const [radiusMeters, setRadiusMeters] = useState<number>(1000);
  const [enforceGeofence, setEnforceGeofence] = useState<boolean>(false);

  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (configData?.data) {
      setOfficeName(configData.data.officeName || 'Headquarters (Main Office)');
      setOfficeLat(configData.data.officeLat ?? 37.774929);
      setOfficeLng(configData.data.officeLng ?? -122.419416);
      setRadiusMeters(configData.data.radiusMeters ?? 1000);
      setEnforceGeofence(configData.data.enforceGeofence ?? false);
    }
  }, [configData]);

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOfficeLat(parseFloat(position.coords.latitude.toFixed(6)));
        setOfficeLng(parseFloat(position.coords.longitude.toFixed(6)));
        setGpsAccuracy(Math.round(position.coords.accuracy));
        setIsDetectingGps(false);
      },
      (error) => {
        setIsDetectingGps(false);
        setGpsError(`Unable to retrieve GPS: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const res = await updateGeofence({
        officeName: officeName.trim() || 'Headquarters',
        officeLat: Number(officeLat),
        officeLng: Number(officeLng),
        radiusMeters: Number(radiusMeters),
        enforceGeofence: Boolean(enforceGeofence),
      }).unwrap();

      setSaveSuccessMsg(res.message || 'Geofence perimeter successfully updated & broadcasted!');
      refetch();
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 4000);
    } catch (err: any) {
      setSaveErrorMsg(err?.data?.message || 'Failed to update geofence configuration.');
    }
  };

  const radiusPresets = [100, 250, 500, 1000, 2000, 5000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Office Geofence & Perimeter Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure GPS coordinates, allowed punch radius, and attendance boundary policies.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoadingConfig ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <p className="text-xs">Loading active geofence configuration...</p>
            </div>
          ) : (
            <>
              {saveSuccessMsg && (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-medium animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {saveErrorMsg && (
                <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{saveErrorMsg}</span>
                </div>
              )}

              {/* Office Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Office / Branch Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={officeName}
                    onChange={(e) => setOfficeName(e.target.value)}
                    placeholder="e.g. Corporate Headquarters, Downtown Hub"
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Coordinates Section with GPS Detector */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Center Coordinates (GPS Anchor)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetectingGps}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all disabled:opacity-60"
                  >
                    {isDetectingGps ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    )}
                    <span>{isDetectingGps ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
                  </button>
                </div>

                {gpsAccuracy !== null && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>GPS locked with ±{gpsAccuracy}m precision</span>
                  </div>
                )}

                {gpsError && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{gpsError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Latitude (°N / °S)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={officeLat}
                      onChange={(e) => setOfficeLat(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Longitude (°E / °W)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={officeLng}
                      onChange={(e) => setOfficeLng(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Radius Configuration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Geofence Radius Limit
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                      {radiusMeters}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      meters ({radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters}m`})
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 mr-1">Quick Presets:</span>
                  {radiusPresets.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadiusMeters(r)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                        radiusMeters === r
                          ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {r >= 1000 ? `${r / 1000} km` : `${r}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Policy Enforcement Option */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        enforceGeofence
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {enforceGeofence ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {enforceGeofence ? 'Strict Enforcement Active' : 'Audit & Verification Mode'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {enforceGeofence
                          ? 'Punches outside the perimeter radius are strictly rejected and forbidden. Employees cannot clock in without being physically on-site.'
                          : 'Flexible Mode: Employees outside the perimeter can punch in/out, but the shift will be marked as "Out of Perimeter" and sent to Manager Verification queue.'}
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={enforceGeofence}
                      onChange={(e) => setEnforceGeofence(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>
              </div>

              {/* Real-time Broadcast Notice */}
              <div className="flex items-start gap-2.5 p-3 bg-brand-50/60 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/40 rounded-xl text-slate-600 dark:text-slate-400 text-[11px]">
                <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Instant WebSocket Sync:</strong> When saved, these coordinates & radius settings are broadcast live to all connected employee punch terminals without needing page reload.
                </span>
              </div>
            </>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isUpdating || isLoadingConfig}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving Changes...
                </>
              ) : (
                'Save Perimeter Settings'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
