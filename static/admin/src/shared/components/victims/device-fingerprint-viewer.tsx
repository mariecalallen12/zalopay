// Device Fingerprint Viewer Component
// Displays device fingerprinting data in a readable format

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Monitor, 
  Globe, 
  Palette, 
  Headphones, 
  Plug, 
  Type, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react';

interface DeviceFingerprint {
  screen_resolution?: string;
  color_depth?: number;
  pixel_ratio?: number;
  timezone?: string;
  language?: string;
  languages?: string[];
  platform?: string;
  user_agent?: string;
  hardware_concurrency?: number;
  device_memory?: number;
  canvas_signature?: string;
  webgl_vendor?: string;
  webgl_renderer?: string;
  webgl_version?: string;
  audio_fingerprint?: string;
  plugins?: string[];
  fonts?: string[];
  cookie_enabled?: boolean;
  do_not_track?: string;
  max_touch_points?: number;
  fingerprint_timestamp?: string;
  fingerprint_id?: string;
  validation_score?: number;
  is_valid?: boolean;
  anomalies?: string[];
}

interface DeviceFingerprintViewerProps {
  fingerprint: DeviceFingerprint | null | undefined;
  className?: string;
}

export function DeviceFingerprintViewer({ fingerprint, className }: DeviceFingerprintViewerProps) {
  if (!fingerprint) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Device Fingerprint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No fingerprint data available</p>
        </CardContent>
      </Card>
    );
  }

  const validationStatus = fingerprint.is_valid !== false && 
    (fingerprint.validation_score === undefined || fingerprint.validation_score >= 70);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Device Fingerprint
          </CardTitle>
          {fingerprint.validation_score !== undefined && (
            <Badge variant={validationStatus ? "default" : "destructive"}>
              Score: {fingerprint.validation_score}/100
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Status */}
        {fingerprint.validation_score !== undefined && (
          <div className="flex items-center gap-2 pb-3 border-b">
            {validationStatus ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {validationStatus ? 'Valid Fingerprint' : 'Invalid or Suspicious Fingerprint'}
            </span>
          </div>
        )}

        {/* Anomalies */}
        {fingerprint.anomalies && fingerprint.anomalies.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">Anomalies Detected</span>
            </div>
            <ul className="list-disc list-inside text-xs text-yellow-800 space-y-1">
              {fingerprint.anomalies.map((anomaly, index) => (
                <li key={index}>{anomaly.replace(/_/g, ' ')}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Basic Information */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Monitor className="h-3 w-3" />
            Screen & Display
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {fingerprint.screen_resolution && (
              <div>
                <span className="text-gray-600">Resolution:</span>
                <span className="ml-1 font-mono">{fingerprint.screen_resolution}</span>
              </div>
            )}
            {fingerprint.color_depth && (
              <div>
                <span className="text-gray-600">Color Depth:</span>
                <span className="ml-1 font-mono">{fingerprint.color_depth} bit</span>
              </div>
            )}
            {fingerprint.pixel_ratio && (
              <div>
                <span className="text-gray-600">Pixel Ratio:</span>
                <span className="ml-1 font-mono">{fingerprint.pixel_ratio}x</span>
              </div>
            )}
          </div>
        </div>

        {/* Location & Language */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Globe className="h-3 w-3" />
            Location & Language
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {fingerprint.timezone && (
              <div>
                <span className="text-gray-600">Timezone:</span>
                <span className="ml-1 font-mono">{fingerprint.timezone}</span>
              </div>
            )}
            {fingerprint.language && (
              <div>
                <span className="text-gray-600">Language:</span>
                <span className="ml-1">{fingerprint.language}</span>
              </div>
            )}
            {fingerprint.languages && fingerprint.languages.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-600">Languages:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {fingerprint.languages.map((lang, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Platform & Browser */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Globe className="h-3 w-3" />
            Platform & Browser
          </h4>
          <div className="space-y-1 text-xs">
            {fingerprint.platform && (
              <div>
                <span className="text-gray-600">Platform:</span>
                <span className="ml-1">{fingerprint.platform}</span>
              </div>
            )}
            {fingerprint.user_agent && (
              <div className="mt-2">
                <span className="text-gray-600">User Agent:</span>
                <div className="mt-1 p-2 bg-gray-50 rounded font-mono text-xs break-all">
                  {fingerprint.user_agent}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hardware */}
        {(fingerprint.hardware_concurrency || fingerprint.device_memory) && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Hardware</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {fingerprint.hardware_concurrency && (
                <div>
                  <span className="text-gray-600">CPU Cores:</span>
                  <span className="ml-1 font-mono">{fingerprint.hardware_concurrency}</span>
                </div>
              )}
              {fingerprint.device_memory && (
                <div>
                  <span className="text-gray-600">Memory:</span>
                  <span className="ml-1 font-mono">{fingerprint.device_memory} GB</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Canvas Fingerprint */}
        {fingerprint.canvas_signature && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Palette className="h-3 w-3" />
              Canvas Fingerprint
            </h4>
            <div className="p-2 bg-gray-50 rounded font-mono text-xs break-all">
              {fingerprint.canvas_signature.substring(0, 100)}...
            </div>
          </div>
        )}

        {/* WebGL Fingerprint */}
        {(fingerprint.webgl_vendor || fingerprint.webgl_renderer) && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Palette className="h-3 w-3" />
              WebGL
            </h4>
            <div className="space-y-1 text-xs">
              {fingerprint.webgl_vendor && (
                <div>
                  <span className="text-gray-600">Vendor:</span>
                  <span className="ml-1 font-mono">{fingerprint.webgl_vendor}</span>
                </div>
              )}
              {fingerprint.webgl_renderer && (
                <div>
                  <span className="text-gray-600">Renderer:</span>
                  <span className="ml-1 font-mono">{fingerprint.webgl_renderer}</span>
                </div>
              )}
              {fingerprint.webgl_version && (
                <div>
                  <span className="text-gray-600">Version:</span>
                  <span className="ml-1 font-mono">{fingerprint.webgl_version}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio Fingerprint */}
        {fingerprint.audio_fingerprint && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Headphones className="h-3 w-3" />
              Audio Fingerprint
            </h4>
            <div className="p-2 bg-gray-50 rounded font-mono text-xs break-all">
              {fingerprint.audio_fingerprint}
            </div>
          </div>
        )}

        {/* Plugins */}
        {fingerprint.plugins && fingerprint.plugins.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Plug className="h-3 w-3" />
              Plugins ({fingerprint.plugins.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {fingerprint.plugins.slice(0, 5).map((plugin, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {plugin}
                </Badge>
              ))}
              {fingerprint.plugins.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{fingerprint.plugins.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Fonts */}
        {fingerprint.fonts && fingerprint.fonts.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Type className="h-3 w-3" />
              Fonts ({fingerprint.fonts.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {fingerprint.fonts.slice(0, 10).map((font, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {font}
                </Badge>
              ))}
              {fingerprint.fonts.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{fingerprint.fonts.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Other Properties */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Other Properties</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {fingerprint.cookie_enabled !== undefined && (
              <div>
                <span className="text-gray-600">Cookies:</span>
                <span className="ml-1">{fingerprint.cookie_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            )}
            {fingerprint.do_not_track && (
              <div>
                <span className="text-gray-600">Do Not Track:</span>
                <span className="ml-1">{fingerprint.do_not_track}</span>
              </div>
            )}
            {fingerprint.max_touch_points !== undefined && (
              <div>
                <span className="text-gray-600">Touch Points:</span>
                <span className="ml-1">{fingerprint.max_touch_points}</span>
              </div>
            )}
          </div>
        </div>

        {/* Fingerprint ID */}
        {fingerprint.fingerprint_id && (
          <div className="pt-2 border-t">
            <div className="text-xs">
              <span className="text-gray-600">Fingerprint ID:</span>
              <div className="mt-1 p-2 bg-gray-50 rounded font-mono break-all">
                {fingerprint.fingerprint_id}
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        {fingerprint.fingerprint_timestamp && (
          <div className="text-xs text-gray-500">
            Captured: {new Date(fingerprint.fingerprint_timestamp).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

