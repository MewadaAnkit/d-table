import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetActiveSessionQuery,
  useGetGeofenceConfigQuery,
  usePunchInMutation,
  usePunchOutMutation,
} from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Camera,
  RotateCcw,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  VideoOff,
  ShieldAlert,
  Loader2,
  Radio,
  Navigation,
} from 'lucide-react';

export const PunchPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: activeSessionData, isLoading: isCheckingSession } = useGetActiveSessionQuery();
  const { data: geofenceData } = useGetGeofenceConfigQuery();
  const activeSession = activeSessionData?.data;
  const geofenceConfig = geofenceData?.data;

  const [punchInApi, { isLoading: isPunchingIn }] = usePunchInMutation();
  const [punchOutApi, { isLoading: isPunchingOut }] = usePunchOutMutation();

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Geolocation states
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Geofence calculations
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const officeLat = geofenceConfig?.officeLat ?? 37.774929;
  const officeLng = geofenceConfig?.officeLng ?? -122.419416;
  const radiusLimit = geofenceConfig?.radiusMeters ?? 1000;
  const isStrictEnforce = geofenceConfig?.enforceGeofence ?? false;

  const distanceMeters = coords
    ? calculateDistanceMeters(coords.latitude, coords.longitude, officeLat, officeLng)
    : null;
  const isWithinGeofence = distanceMeters !== null ? distanceMeters <= radiusLimit : true;

  // Submission messages
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Elapsed duration ticker for active session
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (activeSession?.punchInAt) {
      const updateElapsed = () => {
        const start = new Date(activeSession.punchInAt).getTime();
        const now = Date.now();
        const diffMins = Math.max(0, Math.floor((now - start) / (1000 * 60)));
        setElapsedMinutes(diffMins);
      };
      updateElapsed();
      const interval = setInterval(updateElapsed, 30000); // every 30s
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  // Request camera access
  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in browser permissions to proceed.');
      } else {
        setCameraError('Could not start video camera. Please ensure no other application is using the camera.');
      }
    }
  };

  // Stop camera stream tracks
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Request geolocation
  const fetchLocation = () => {
    setIsLocating(true);
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Please enable device location permissions.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('Location information is currently unavailable.');
        } else {
          setGeoError('Location request timed out. Please retry.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-start camera and geolocation on mount
  useEffect(() => {
    startCamera();
    fetchLocation();

    return () => {
      stopCamera();
    };
  }, []);

  // Update video element when stream is set
  useEffect(() => {
    if (videoRef.current && stream && !capturedImage) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, capturedImage]);

  // Capture snapshot from live video element
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror horizontal for selfie perspective
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const isSubmitting = isPunchingIn || isPunchingOut;

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!capturedImage) {
      setSubmitError('Please capture a live photo before confirming.');
      return;
    }

    if (!coords) {
      setSubmitError('Valid GPS coordinates are required. Please acquire location.');
      return;
    }

    if (isStrictEnforce && !isWithinGeofence) {
      setSubmitError(
        `Geofence restriction: You are ${distanceMeters}m from the office perimeter. Punching attendance is restricted to within ${radiusLimit}m.`
      );
      return;
    }

    try {
      if (activeSession) {
        // Punch Out
        const res = await punchOutApi({
          selfie: capturedImage,
          location: coords,
        }).unwrap();
        setSubmitSuccess(res.message || 'Punched out successfully!');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        // Punch In
        const res = await punchInApi({
          selfie: capturedImage,
          location: coords,
        }).unwrap();
        setSubmitSuccess(res.message || 'Punched in successfully!');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err: any) {
      setSubmitError(err.data?.message || 'Failed to submit attendance punch.');
    }
  };

  const formatHrsMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  if (isCheckingSession) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {activeSession ? 'Punch Out & End Shift' : 'Punch In & Begin Shift'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture a live camera snapshot and acquire verified coordinates to confirm attendance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeSession ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-[11px] text-amber-800 font-medium">Session in progress</p>
                <p className="text-xs font-bold text-amber-900">
                  {formatHrsMins(elapsedMinutes)} elapsed
                </p>
              </div>
            </div>
          ) : (
            <Badge status="inactive" label="Shift Not Started" />
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-xs text-rose-700 border border-rose-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-xs text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Main Grid: Camera Preview on Left, Location & Confirmation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Camera Column (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-brand-600" />
              Live Camera Feed
            </span>
            <span className="text-[11px] text-slate-400">Live capture only (No upload)</span>
          </div>

          {/* Viewfinder container */}
          <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner">
            {cameraError ? (
              <div className="flex flex-col items-center text-center p-6 text-rose-400">
                <VideoOff className="w-8 h-8 mb-2" />
                <p className="text-xs font-medium text-rose-300 max-w-xs">{cameraError}</p>
                <Button variant="outline" size="sm" onClick={startCamera} className="mt-4 text-white border-slate-700 hover:bg-slate-800">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </Button>
              </div>
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured selfie"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            )}

            {/* Hidden canvas for capturing bitmap */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Action Buttons */}
          <div className="mt-4 flex items-center justify-center gap-3 w-full">
            {!capturedImage ? (
              <Button
                variant="primary"
                onClick={handleCapture}
                disabled={!!cameraError}
                className="w-full sm:w-auto px-6"
              >
                <Camera className="w-4 h-4" />
                Capture Selfie
              </Button>
            ) : (
              <Button variant="outline" onClick={handleRetake} className="w-full sm:w-auto px-6">
                <RotateCcw className="w-4 h-4" />
                Retake Photo
              </Button>
            )}
          </div>
        </div>

        {/* Location & Summary Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Geolocation Card & Geofence Radar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                GPS Geolocation & Geofence
              </span>
              <button
                onClick={fetchLocation}
                disabled={isLocating}
                className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium disabled:opacity-50"
              >
                {isLocating ? 'Locating...' : 'Refresh GPS'}
              </button>
            </div>

            {isLocating && (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>Acquiring browser coordinates...</span>
              </div>
            )}

            {geoError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{geoError}</span>
              </div>
            )}

            {!isLocating && coords && (
              <>
                <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between py-0.5 border-b border-slate-200/60 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">Latitude:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{coords.latitude}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-200/60 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">Longitude:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{coords.longitude}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500 dark:text-slate-400">Accuracy:</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">±{coords.accuracy} meters</span>
                  </div>
                </div>

                {/* Geofence Radar Widget */}
                <div className={`p-3.5 rounded-lg border text-xs ${
                  isWithinGeofence
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold flex items-center gap-1.5 text-slate-900 dark:text-white">
                      <Radio className={`w-3.5 h-3.5 ${isWithinGeofence ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} animate-pulse`} />
                      Office Geofence Status
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isWithinGeofence
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                    }`}>
                      {isWithinGeofence ? 'Within Perimeter' : 'Outside Perimeter'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {distanceMeters !== null
                      ? `Distance to office: ${distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(2)} km` : `${distanceMeters} m`} (Radius limit: ${radiusLimit} m)`
                      : 'Calculating distance...'}
                  </p>
                  {!isWithinGeofence && (
                    <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      ⚠️ {isStrictEnforce ? 'Punching is restricted while outside perimeter.' : 'Outside office perimeter will be flagged for manager verification.'}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Submission Action Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Shift Confirmation
            </h3>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>Standard Shift:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">8 hours (480 mins)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Action:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {activeSession ? 'Punch Out' : 'Punch In'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Photo Captured:</span>
                <span className={capturedImage ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                  {capturedImage ? 'Ready' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>GPS Acquired:</span>
                <span className={coords ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                  {coords ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Geofence Check:</span>
                <span className={isWithinGeofence ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                  {isWithinGeofence ? 'Authorized' : 'Violation Warning'}
                </span>
              </div>
            </div>

            <Button
              variant={activeSession ? 'danger' : 'primary'}
              size="lg"
              className="w-full"
              disabled={!capturedImage || !coords || (isStrictEnforce && !isWithinGeofence) || isSubmitting}
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              {isStrictEnforce && !isWithinGeofence
                ? 'Punch Blocked (Outside Geofence)'
                : activeSession
                ? 'Confirm Punch Out'
                : 'Confirm Punch In'}
            </Button>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-slate-400 mt-0.5" />
              <span>
                Live camera capture and geolocation coordinates serve as evidence for manager attendance verification.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
