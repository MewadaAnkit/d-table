import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Loader2, AlertCircle } from 'lucide-react';

interface SelfiePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceId: string;
  type: 'in' | 'out';
  title?: string;
}

export const SelfiePreviewModal: React.FC<SelfiePreviewModalProps> = ({
  isOpen,
  onClose,
  attendanceId,
  type,
  title,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !attendanceId) {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
      }
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const token = localStorage.getItem('attendly_token');

    fetch(`${baseUrl}/attendance/${attendanceId}/selfie/${type}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to load selfie image');
        }
        return res.blob();
      })
      .then((blob) => {
        if (isMounted) {
          const objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Could not load selfie');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [isOpen, attendanceId, type]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || `Punch-${type === 'in' ? 'In' : 'Out'} Selfie Evidence`}
      maxWidth="md"
    >
      <div className="flex flex-col items-center justify-center p-2 min-h-[260px]">
        {isLoading && (
          <div className="flex flex-col items-center gap-2 text-slate-500 py-10">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <p className="text-xs">Loading secure image stream...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-2 text-rose-600 py-8 text-center">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && imageUrl && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-inner">
            <img
              src={imageUrl}
              alt={`Punch ${type} selfie`}
              className="max-h-[380px] w-auto object-contain rounded-lg"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
