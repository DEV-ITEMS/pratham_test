import PlaceIcon from '@mui/icons-material/Place';
import { Box, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Viewer } from 'photo-sphere-viewer';
import 'photo-sphere-viewer/dist/photo-sphere-viewer.css';
import { RoomPin, RoomView, YawPitch } from '../../lib/types';
import { fromSphericalPosition, toSphericalPosition } from '../../lib/utils/yawPitch';

export interface PanoramaViewerHandle {
  captureSnapshot: () => HTMLCanvasElement | null;
  resetOrientation: () => void;
  getViewer: () => Viewer | null;
  loadPanorama: (url: string, defaults?: { yaw: number; pitch: number }) => Promise<void>;
}



interface PanoramaViewerProps {
  view: RoomView;
  pins: RoomPin[];
  panoramaUrl: string;
  onPinClick: (pin: RoomPin) => void;
  onPositionChange?: (orientation: YawPitch) => void;
}

type PinOverlay = {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  pin: RoomPin;
};

export const PanoramaViewer = forwardRef<PanoramaViewerHandle, PanoramaViewerProps>(
  ({ view, pins, panoramaUrl, onPinClick, onPositionChange }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<Viewer | null>(null);
    const pinsRef = useRef<RoomPin[]>(pins);
    const initialViewRef = useRef(view);
    const initialPanoramaRef = useRef(panoramaUrl);
    const onPositionChangeRef = useRef(onPositionChange);
    const [ready, setReady] = useState(false);
    const [pinOverlays, setPinOverlays] = useState<PinOverlay[]>([]);

    pinsRef.current = pins;
    onPositionChangeRef.current = onPositionChange;

    const updatePinOverlays = useCallback(() => {
      const viewer = viewerRef.current;
      if (!viewer) {
        return;
      }

      const next: PinOverlay[] = pinsRef.current.map((pin) => {
        const spherical = toSphericalPosition({ yaw: pin.yaw, pitch: pin.pitch });
        const point = viewer.dataHelper.sphericalCoordsToViewerCoords(spherical);
        const isVisible = Number.isFinite(point.x) && Number.isFinite(point.y);
        return {
          id: pin.id,
          x: point.x,
          y: point.y,
          visible: isVisible,
          pin,
        };
      });
      setPinOverlays(next);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        captureSnapshot: () => {
          const viewer = viewerRef.current as unknown as { renderer?: { domElement?: HTMLCanvasElement } } | null;
          const canvas = viewer?.renderer?.domElement ?? null;
          return canvas ?? null;
        },
        resetOrientation: () => {
          const viewer = viewerRef.current;
          if (!viewer) return;
          const spherical = toSphericalPosition({ yaw: view.defaultYaw, pitch: view.defaultPitch });
          viewer.animate({ longitude: spherical.longitude, latitude: spherical.latitude, speed: '5rpm' });
        },
        getViewer: () => viewerRef.current,
        loadPanorama: async (url: string, defaults?: { yaw: number; pitch: number }) => {
          const viewer = viewerRef.current;
          if (!viewer) return;
          const target = defaults ?? { yaw: view.defaultYaw, pitch: view.defaultPitch };
          const spherical = toSphericalPosition(target);
          await viewer.setPanorama(url, {
            longitude: spherical.longitude,
            latitude: spherical.latitude,
            showLoader: true,
          });
          onPositionChangeRef.current?.({ yaw: target.yaw, pitch: target.pitch });
          updatePinOverlays();
          setReady(true);
        },
      }),
      [view.defaultYaw, view.defaultPitch],
    );

    useEffect(() => {
      if (!containerRef.current) {
        return;
      }

      const initialView = initialViewRef.current;
      const initialPanorama = initialPanoramaRef.current;
      const spherical = toSphericalPosition({
        yaw: initialView.defaultYaw,
        pitch: initialView.defaultPitch,
      });
      const viewer = new Viewer({
        container: containerRef.current,
        panorama: initialPanorama,
        navbar: [],
        defaultLat: spherical.latitude,
        defaultLong: spherical.longitude,
        moveSpeed: 1,
        mousewheelCtrlKey: true,
      });

      viewerRef.current = viewer;

      const handleReady = () => {
        setReady(true);
        onPositionChangeRef.current?.({ yaw: initialView.defaultYaw, pitch: initialView.defaultPitch });
        updatePinOverlays();
      };

      const handlePosition = (_: unknown, position: { longitude: number; latitude: number }) => {
        onPositionChangeRef.current?.(fromSphericalPosition(position));
      };

      viewer.once('ready', handleReady);
      viewer.on('position-updated', handlePosition);
      viewer.on('render', updatePinOverlays);
      viewer.on('size-updated', updatePinOverlays);

      return () => {
        viewer.off('position-updated', handlePosition);
        viewer.off('render', updatePinOverlays);
        viewer.off('size-updated', updatePinOverlays);
        viewer.destroy();
        viewerRef.current = null;
      };
    }, [updatePinOverlays]);

    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer) {
        return;
      }
      setReady(false);
      const spherical = toSphericalPosition({ yaw: view.defaultYaw, pitch: view.defaultPitch });
      void viewer
        .setPanorama(panoramaUrl, {
          longitude: spherical.longitude,
          latitude: spherical.latitude,
          showLoader: true,
        })
        .then(() => {
          setReady(true);
          onPositionChangeRef.current?.({ yaw: view.defaultYaw, pitch: view.defaultPitch });
          updatePinOverlays();
        });
    }, [panoramaUrl, view.defaultYaw, view.defaultPitch, updatePinOverlays, view.id]);

    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Box ref={containerRef} sx={{ width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden' }} />
        {!ready && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.6)',
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {ready &&
          pinOverlays.map((overlay) =>
            overlay.visible ? (
              <Tooltip title={overlay.pin.label} key={overlay.id} placement="top">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onPinClick(overlay.pin)}
                  sx={{
                    position: 'absolute',
                    transform: 'translate(-50%, -50%)',
                    left: overlay.x,
                    top: overlay.y,
                    bgcolor: 'rgba(63,81,181,0.9)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(63,81,181,1)' },
                  }}
                >
                  <PlaceIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null,
          )}
      </Box>
    );
  },
);

PanoramaViewer.displayName = 'PanoramaViewer';




