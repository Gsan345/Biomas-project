import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayerGroup, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createColoredIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const AGR_COLOR   = '#22c55e';
const IND_COLOR   = '#f59e0b';
const MSW_COLOR   = '#ef4444';
const CP_COLOR    = '#60a5fa';
const FAC_COLOR   = '#a78bfa';

interface MapData {
  agricultural: Record<string, unknown>[];
  industrial: Record<string, unknown>[];
  municipal: Record<string, unknown>[];
  collectionPoints: Record<string, unknown>[];
  facilities: Record<string, unknown>[];
}

export default function MapPage() {
  const navigate = useNavigate();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/map/sources').then(r => setMapData(r.data.data)).finally(() => setLoading(false));
  }, []);

  const ASSAM_CENTER: [number, number] = [26.2006, 92.9376];

  const Legend = () => (
    <div style={{ position: 'absolute', bottom: '2rem', left: '1rem', zIndex: 1000, background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', minWidth: 180 }}>
      <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Map Legend</div>
      {[
        { color: AGR_COLOR,  label: 'Agricultural Sources' },
        { color: IND_COLOR,  label: 'Industrial Sources' },
        { color: MSW_COLOR,  label: 'Municipal Waste Sites' },
        { color: CP_COLOR,   label: 'Collection Points' },
        { color: FAC_COLOR,  label: 'Processing Facilities' },
      ].map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, border: '2px solid white', flexShrink: 0 }} />
          {item.label}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 100 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>🗺️ BioChain Interactive Map</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sonitpur & Kamrup districts, Assam — All biomass sources, collection points and facilities</p>
        </div>
        {mapData && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
            <span className="badge badge-green">{mapData.agricultural.length} Agricultural</span>
            <span className="badge badge-amber">{mapData.industrial.length} Industrial</span>
            <span className="badge badge-red">{mapData.municipal.length} Municipal</span>
            <span className="badge badge-blue">{mapData.collectionPoints.length} Collection Points</span>
            <span className="badge badge-purple">{mapData.facilities.length} Facilities</span>
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-secondary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--green-500)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading map data…</p>
            </div>
          </div>
        ) : (
          <>
            <MapContainer center={ASSAM_CENTER} zoom={9} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LayersControl position="topright">
                <LayersControl.Overlay checked name="🌾 Agricultural Sources">
                  <LayerGroup>
                    {mapData?.agricultural.map((s: Record<string, unknown>) => (
                      <Marker key={s.id as string} position={[s.latitude as number, s.longitude as number]} icon={createColoredIcon(AGR_COLOR)}>
                        <Popup>
                          <div style={{ minWidth: 180 }}>
                            <strong>{s.name as string}</strong><br />
                            <span style={{ color: '#666', fontSize: 12 }}>{s.code as string}</span><br />
                            <span>🌿 {s.biomassType as string}</span><br />
                            <span>📍 {(s.district as string)?.replace(/_/g, ' ')}</span><br />
                            <span>🚦 {s.collectionFeasibility as string}</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="🏭 Industrial Sources">
                  <LayerGroup>
                    {mapData?.industrial.map((s: Record<string, unknown>) => (
                      <Marker key={s.id as string} position={[s.latitude as number, s.longitude as number]} icon={createColoredIcon(IND_COLOR)}>
                        <Popup>
                          <div style={{ minWidth: 180 }}>
                            <strong>{s.industryName as string}</strong><br />
                            <span style={{ color: '#666', fontSize: 12 }}>{s.code as string}</span><br />
                            <span>🌿 {s.biomassType as string}</span><br />
                            <span>📍 {(s.district as string)?.replace(/_/g, ' ')}</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="🏙️ Municipal Waste Sites">
                  <LayerGroup>
                    {mapData?.municipal.map((s: Record<string, unknown>) => (
                      <Marker key={s.id as string} position={[s.latitude as number, s.longitude as number]} icon={createColoredIcon(MSW_COLOR)}>
                        <Popup>
                          <div style={{ minWidth: 180 }}>
                            <strong>{s.city as string}</strong><br />
                            <span style={{ color: '#666', fontSize: 12 }}>{s.code as string}</span><br />
                            <span>🗑️ {s.dailyWasteKg as number} kg/day</span><br />
                            <span>📍 {(s.district as string)?.replace(/_/g, ' ')}</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="📦 Collection Points">
                  <LayerGroup>
                    {mapData?.collectionPoints.map((cp: Record<string, unknown>) => (
                      <Marker key={cp.id as string} position={[cp.latitude as number, cp.longitude as number]} icon={createColoredIcon(CP_COLOR)}>
                        <Popup>
                          <div style={{ minWidth: 180 }}>
                            <strong>{cp.name as string}</strong><br />
                            <span style={{ color: '#666', fontSize: 12 }}>{cp.code as string}</span><br />
                            <span>⚖️ Capacity: {cp.storageCapacityTons as number} T</span><br />
                            <span>📍 {(cp.district as string)?.replace(/_/g, ' ')}</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="🏭 Processing Facilities">
                  <LayerGroup>
                    {mapData?.facilities.map((f: Record<string, unknown>) => (
                      <Marker key={f.id as string} position={[f.latitude as number, f.longitude as number]} icon={createColoredIcon(FAC_COLOR)}>
                        <Popup>
                          <div style={{ minWidth: 180 }}>
                            <strong>{f.name as string}</strong><br />
                            <span style={{ color: '#666', fontSize: 12 }}>{f.code as string} · {f.facilityType as string}</span><br />
                            <span>⚡ {f.installedCapacityTPD as number} TPD</span><br />
                            <span>📍 {(f.district as string)?.replace(/_/g, ' ')}</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </LayerGroup>
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>
            <Legend />
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
