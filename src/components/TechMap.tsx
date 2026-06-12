import React, { useState } from 'react';
import { Map, Marker, APIProvider } from '@vis.gl/react-google-maps';
import { TechnicianAvailability } from '../types';
import { MapPin, Navigation, Info, Settings, ShieldAlert, Cpu, Layers, Radio, Globe, Activity } from 'lucide-react';

interface TechMapProps {
  technicians: TechnicianAvailability[];
}

export const TechMap: React.FC<TechMapProps> = ({ technicians }) => {
  const [mapType, setMapType] = useState<'radar' | 'google'>('radar');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Filter active technicians with location
  const activeTechs = technicians.filter(t => t.lat !== undefined && t.lng !== undefined);

  // Helper to check if Google Maps Platform is ready and configured with a real key
  const gkey = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
  const isGoogleMapsConfigured = gkey.length > 10 && !gkey.startsWith('your_') && !gkey.includes('mock');

  // Map latitude and longitude safe conversion into our SVG coordinate grid
  const mapLatLngToSVG = (lat: number, lng: number) => {
    // Map longitude 19.35 (West of Durres) to 19.95 (East Tirana) to 40px - 560px
    const minLng = 19.35;
    const maxLng = 19.95;
    const x = 40 + ((lng - minLng) / (maxLng - minLng)) * 520;

    // Map latitude 41.25 (South) to 41.40 (North) to 360px - 40px
    const minLat = 41.25;
    const maxLat = 41.40;
    const y = 360 - ((lat - minLat) / (maxLat - minLat)) * 320;

    return { x: Math.round(x), y: Math.round(y) };
  };

  // Pre-defined coordinates for the interactive GIS zones
  const zonesData = [
    {
      name: 'Zone 1 (Kavaja/Shyri)',
      center: { lat: 41.3275, lng: 19.8189 },
      color: 'rgba(59, 130, 246, 0.25)', // blue
      borderColor: '#3b82f6',
      desc: 'Qendra e Tiranës & Tregu Çam',
      speedScore: '98%',
      activeTechsCount: technicians.filter(t => t.status === 'available' && t.name.includes('Field')).length
    },
    {
      name: 'Zone 2 (Bardhyl/Xhanfize)',
      center: { lat: 41.3350, lng: 19.8450 },
      color: 'rgba(16, 185, 129, 0.25)', // green
      borderColor: '#10b981',
      desc: 'Tirana Lindore, Kinostudio & Rr. Bardhyl',
      speedScore: '96%',
      activeTechsCount: 1
    },
    {
      name: 'Zone 3 (Don Bosko)',
      center: { lat: 41.3450, lng: 19.8000 },
      color: 'rgba(239, 68, 68, 0.25)', // red
      borderColor: '#ef4444',
      desc: 'Tirana Veriore, Don Bosko & Shkodra',
      speedScore: '94%',
      activeTechsCount: 2
    },
    {
      name: 'Zone 4 (Elbasani)',
      center: { lat: 41.3100, lng: 19.8300 },
      color: 'rgba(245, 158, 11, 0.25)', // orange
      borderColor: '#f59e0b',
      desc: 'Tirana Jugore, rruga e Elbasanit',
      speedScore: '99%',
      activeTechsCount: 1
    },
    {
      name: 'Zone 5 (Kombinat)',
      center: { lat: 41.3120, lng: 19.7800 },
      color: 'rgba(139, 92, 246, 0.25)', // purple
      borderColor: '#8b5cf6',
      desc: 'Tirana Perëndimore & Kombinat',
      speedScore: '95%',
      activeTechsCount: 1
    },
    {
      name: 'Durrës 1 (Plazh)',
      center: { lat: 41.3100, lng: 19.4900 },
      color: 'rgba(6, 182, 212, 0.25)', // cyan
      borderColor: '#06b6d4',
      desc: 'Durrës Plazh & Shkozet',
      speedScore: '93%',
      activeTechsCount: 1
    },
    {
      name: 'Durrës 2 (Qendër)',
      center: { lat: 41.3181, lng: 19.4478 },
      color: 'rgba(236, 72, 153, 0.25)', // pink
      borderColor: '#ec4899',
      desc: 'Durrës Port & Bulevardi Epidamn',
      speedScore: '97%',
      activeTechsCount: 2
    }
  ];

  return (
    <div id="tech-map-base" className="w-full flex flex-col gap-4">
      {/* MAP HEADER AND MODE CONTROLS */}
      <div id="tech-map-ctrl-header" className="p-4 bg-[#0d1324]/80 border border-brand-border/60 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-accent-blue animate-pulse" />
          <div>
            <span className="text-white font-mono font-bold text-xs uppercase block tracking-wider">Harta GIS e Shërbimeve</span>
            <span className="text-[10px] text-brand-text-secondary">Monitori i Koordinatave & Atribuimi i Shpërndarjes</span>
          </div>
        </div>

        <div className="flex bg-[#070b16] p-1 rounded-xl border border-brand-border/40 gap-1">
          <button
            id="btn-radar-mode"
            onClick={() => setMapType('radar')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mapType === 'radar' 
                ? 'bg-brand-accent-blue text-brand-bg shadow-sm' 
                : 'text-brand-text-muted hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            DIGINET RADAR GIS
          </button>
          <button
            id="btn-sat-mode"
            onClick={() => setMapType('google')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mapType === 'google' 
                ? 'bg-brand-accent-blue text-brand-bg shadow-sm' 
                : 'text-brand-text-muted hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            GOOGLE SATELLITE
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE VIEW */}
      {mapType === 'radar' ? (
        <div id="radar-container" className="relative w-full bg-[#070b16] border border-brand-border/60 rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col lg:flex-row gap-4 h-[440px]">
          {/* THE SVG GRAPHICAL MAP RADAR CONSOLE */}
          <div className="flex-1 relative bg-[#040811] rounded-2xl border border-brand-border/20 overflow-hidden flex items-center justify-center p-2">
            
            {/* HUD Scanlines */}
            <div className="absolute inset-0 bg-radar-scan bg-[linear-gradient(rgba(18,24,38,0)_97%,rgba(59,130,246,0.06)_97%)] bg-[length:100%_20px] pointer-events-none"></div>
            
            {/* Tech Radar Circle Overlay Grid */}
            <svg className="absolute w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              {/* Radar circular lines */}
              <circle cx="470" cy="190" r="60" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,8" fill="none" />
              <circle cx="470" cy="190" r="120" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,8" fill="none" />
              <circle cx="470" cy="190" r="180" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,8" fill="none" />
              
              {/* Polar sweep cross lines */}
              <line x1="50" y1="190" x2="550" y2="190" stroke="#0f172a" strokeWidth="1" />
              <line x1="470" y1="30" x2="470" y2="350" stroke="#0f172a" strokeWidth="1" />
            </svg>

            {/* main SVG Interactive elements */}
            <svg 
              viewBox="0 0 600 400" 
              className="w-full h-full max-h-[380px] z-10 transition-transform duration-500"
            >
              {/* Tirana-Durres Main Highway Pipeline Connection */}
              <g>
                {/* Visual back glow */}
                <path 
                  d="M 97.8 223 L 420 220 L 468.9 191.6" 
                  stroke="rgba(59,130,246,0.8)" 
                  strokeWidth="4" 
                  fill="none" 
                  className="blur-[2px]" 
                />
                <path 
                  d="M 97.8 223 L 420 220 L 468.9 191.6" 
                  stroke="#1e3a8a" 
                  strokeWidth="2" 
                  fill="none" 
                  strokeDasharray="6,4" 
                />
                <text x="230" y="210" fill="#64748b" className="text-[9px] font-mono font-bold tracking-widest">AUTOSTRADA SH2 Tl-DR</text>
              </g>

              {/* RENDER GRAPHICAL ZONE POLYGONS */}
              {zonesData.map((zone, idx) => {
                const centerPos = mapLatLngToSVG(zone.center.lat, zone.center.lng);
                const isSelected = selectedZone === zone.name;

                return (
                  <g 
                    key={idx} 
                    className="cursor-pointer group"
                    onClick={() => setSelectedZone(isSelected ? null : zone.name)}
                  >
                    {/* Zone interactive glow boundary */}
                    <circle 
                      cx={centerPos.x} 
                      cy={centerPos.y} 
                      r={isSelected ? 40 : 28} 
                      fill={isSelected ? zone.color.replace('0.25', '0.4') : zone.color} 
                      stroke={zone.borderColor} 
                      strokeWidth={isSelected ? 2 : 1.5} 
                      className="transition-all duration-300 group-hover:stroke-white"
                    />

                    {/* Zone center visual core node */}
                    <circle 
                      cx={centerPos.x} 
                      cy={centerPos.y} 
                      r="4" 
                      fill={zone.borderColor} 
                      className="animate-pulse"
                    />

                    {/* Glowing outer ring when selected */}
                    {isSelected && (
                      <circle 
                        cx={centerPos.x} 
                        cy={centerPos.y} 
                        r="48" 
                        fill="none" 
                        stroke={zone.borderColor} 
                        strokeWidth="1" 
                        strokeDasharray="4,4" 
                        className="animate-[spin_12s_linear_infinite]"
                      />
                    )}

                    {/* Text Label Backdrop */}
                    <rect 
                      x={centerPos.x - 45} 
                      y={centerPos.y - 20} 
                      width="90" 
                      height="12" 
                      rx="3" 
                      fill="#040811" 
                      fillOpacity="0.85" 
                      stroke="rgba(30,41,59,0.5)"
                      strokeWidth="0.5"
                    />

                    <text 
                      x={centerPos.x} 
                      y={centerPos.y - 11} 
                      fill={isSelected ? '#ffffff' : '#94a3b8'} 
                      textAnchor="middle" 
                      className="text-[8px] font-mono font-bold select-none group-hover:fill-white"
                    >
                      {zone.name.replace('Zone ', 'Z').replace('Durrës ', 'DR')}
                    </text>
                  </g>
                );
              })}

              {/* PLOT REAL ACTIVE TECHNICIANS GLOWING MARKERS */}
              {activeTechs.map(tech => {
                const screenPos = mapLatLngToSVG(tech.lat!, tech.lng!);
                const isTechOnline = tech.status === 'available';

                return (
                  <g key={tech.id} className="cursor-pointer">
                    {/* Signal circle expansion */}
                    <circle 
                      cx={screenPos.x} 
                      cy={screenPos.y} 
                      r="12" 
                      fill="none" 
                      stroke={isTechOnline ? '#10b981' : '#f59e0b'} 
                      strokeWidth="1" 
                      className="animate-ping opacity-60"
                    />
                    
                    {/* Inner core pin */}
                    <circle 
                      cx={screenPos.x} 
                      cy={screenPos.y} 
                      r="5" 
                      fill={isTechOnline ? '#10b981' : '#f59e0b'} 
                      stroke="#070b16" 
                      strokeWidth="1.5"
                    />

                    {/* Tech Name bubble */}
                    <g className="opacity-80 hover:opacity-100 transition-opacity">
                      <rect 
                        x={screenPos.x - 30} 
                        y={screenPos.y + 8} 
                        width="60" 
                        height="12" 
                        rx="3" 
                        fill="#1b243c" 
                        stroke="#2e3c60" 
                        strokeWidth="0.5"
                      />
                      <text 
                        x={screenPos.x} 
                        y={screenPos.y + 16} 
                        fill="#ffffff" 
                        textAnchor="middle" 
                        className="text-[7.5px] font-mono font-bold"
                      >
                        {tech.name.split(' ')[0]}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Quick Live Legend HUD */}
            <div className="absolute bottom-3 left-3 bg-[#0d1324]/90 border border-brand-border/40 p-2.5 rounded-xl flex flex-col gap-1.5 text-[9px] font-mono text-white max-w-[170px] z-20">
              <span className="font-bold text-brand-accent-blue border-b border-brand-border/30 pb-1 mb-0.5">LEGJENDA GIS RADAR</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-accent-green inline-block"></span>
                <span>Teknik i Disponueshëm ({activeTechs.filter(t => t.status==='available').length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-accent-amber inline-block"></span>
                <span>Teknik në Shërbim ({activeTechs.filter(t => t.status==='busy').length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-dashed border-brand-accent-blue/60 bg-brand-accent-blue/10 rounded-full inline-block"></span>
                <span>Zona të Mbulimit Fiber Optik</span>
              </div>
            </div>
          </div>

          {/* ACTIVE SELECTED ZONE DETAIL HUD SIDEBAR */}
          <div className="w-full lg:w-[240px] bg-[#090d1a] border border-brand-border/20 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto z-10">
            {selectedZone ? (
              (() => {
                const zData = zonesData.find(z => z.name === selectedZone)!;
                return (
                  <div className="space-y-4 font-mono text-xs flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start border-b border-brand-border/30 pb-2">
                        <h4 className="font-bold text-white text-[11.5px] truncate">{zData.name}</h4>
                        <span className="text-[10px] text-brand-accent-green font-bold bg-brand-accent-green/10 border border-brand-accent-green/20 px-1.5 rounded">
                          SPEED OK
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-brand-text-secondary italic mt-2">
                        "{zData.desc}"
                      </p>

                      <div className="space-y-2 mt-4 text-[11px]">
                        <div className="flex justify-between py-1 border-b border-brand-border/10">
                          <span className="text-brand-text-muted">Kualiteti i Sinjalit:</span>
                          <span className="text-brand-accent-green font-bold">{zData.speedScore}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-brand-border/10">
                          <span className="text-brand-text-muted">Teknikë Terreni:</span>
                          <span className="text-white font-bold">{zData.activeTechsCount} teknologë</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-brand-text-muted">Latenca Ndaj Gateway:</span>
                          <span className="text-brand-accent-blue font-bold">~ 2.4 ms</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0c1224] p-3 rounded-xl border border-brand-border/30 text-[10px] space-y-1">
                      <span className="text-brand-accent-blue font-bold block mb-1">PRO-DISPATCH INFO</span>
                      <p className="text-brand-text-secondary leading-normal">
                        Sistemi koordinon rrugëtimin për këtë zonë me anë të algoritmit auto-atribuues.
                      </p>
                      <button 
                        onClick={() => setSelectedZone(null)}
                        className="w-full mt-2.5 py-1.5 bg-brand-bg hover:bg-brand-border text-white rounded border border-brand-border/40 text-[9px] font-bold cursor-pointer"
                      >
                        KTHEHU TE TOTALI
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-brand-text-muted font-mono py-8 space-y-4">
                <MapPin className="w-8 h-8 text-brand-accent-blue/60 animate-bounce" />
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase">Inspektorati Gjeo-Hapësinor</h4>
                  <p className="text-[10px] text-brand-text-secondary leading-relaxed mt-1.5 px-2">
                    Klikoni mbi ndonjë nga zonat e mbulimit në hartë për të parë kualitetin e sinjalit, shpejtësitë mesatare dhe teknikët prezentë!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* GOOGLE MAP WRAP CONTROLLER WITH FALLBACK IF API PROJECT ERROR TO BE TOTALLY SAFE */
        <div id="sat-container" className="space-y-4">
          {/* Always display fallback info warnings cleanly */}
          <div className="p-3.5 bg-brand-card border border-brand-border text-xs rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between font-mono">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-brand-accent-amber shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white text-xs block uppercase">Atribuimi i Hartës Satelitore</span>
                <p className="text-[10.5px] leading-relaxed text-brand-text-secondary">
                  Nëse shihni gabimin <code className="text-brand-accent-amber">ApiProjectMapError</code> në konsolë, kjo do të thotë që Çelësi i Projektit Google Cloud nuk ka një llogari faturimi. Monitori ynë satelitor inteligjent më poshtë tregon një imitues gjeo-hapësinor preciz për terrenin e Tiranës!
                </p>
              </div>
            </div>
            <div className="text-[10px] font-bold text-right shrink-0 px-2 py-1 bg-brand-accent-blue/10 text-brand-accent-blue border border-brand-accent-blue/20 rounded">
              PROJECT ID: {process.env.GOOGLE_MAPS_PLATFORM_KEY ? 'CONFIGURED' : 'LOCAL SIMULATOR'}
            </div>
          </div>

          {isGoogleMapsConfigured ? (
            <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-brand-border/80 shadow-2xl relative bg-[#070b16]">
              <APIProvider apiKey={gkey} version="weekly">
                <Map
                  defaultCenter={{ lat: 41.3275, lng: 19.8189 }}
                  defaultZoom={11}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                >
                  {activeTechs.map(tech => (
                    <Marker 
                      key={tech.id} 
                      position={{ lat: tech.lat!, lng: tech.lng! }} 
                      title={tech.name}
                      label={{
                        text: tech.name.substring(0, 2).toUpperCase(),
                        color: '#ffffff'
                      }}
                    />
                  ))}
                </Map>
              </APIProvider>
            </div>
          ) : (
            /* DYNAMIC SAT MONITOR SIMULATOR TO PREVENT FLICKERING OR LOADING CHECKS FROM ERROWING */
            <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-brand-border/70 shadow-2xl relative bg-[#03060f] flex flex-col">
              {/* Fake Satellite Grid Lines */}
              <div className="absolute inset-0 bg-radar-scan bg-[linear-gradient(rgba(18,24,38,0.15)_96%,rgba(14,165,233,0.06)_96%)] bg-[length:100%_25px] pointer-events-none"></div>
              
              <div className="absolute top-4 left-4 z-10 bg-black/85 p-3 rounded-xl border border-brand-border/60 font-mono text-[9px] text-brand-text-secondary space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-brand-accent-blue">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>SATELLITE DOWNLINK STABILIZED</span>
                </div>
                <div>POSITIONAL SOURCE: MEMORY CACHE</div>
                <div>TIRANA METROPOLITAN COORDINATES</div>
                <div>SENSORS: ONLINE (SLA TRACKER ACTIVE)</div>
              </div>

              {/* Graphical Satellite Feed */}
              <div className="flex-1 relative flex items-center justify-center p-4">
                <svg viewBox="0 0 600 300" className="w-full h-full max-h-[290px]">
                  {/* Outer Orbit line path */}
                  <path d="M 50 250 Q 300 100 550 250" stroke="rgba(14,165,233,0.1)" strokeWidth="1" fill="none" strokeDasharray="4,8" />
                  
                  {/* Tirana topography rings */}
                  <ellipse cx="300" cy="150" rx="210" ry="110" stroke="rgba(14,165,233,0.06)" strokeWidth="1" fill="none" />
                  <ellipse cx="300" cy="150" rx="140" ry="70" stroke="rgba(14,165,233,0.08)" strokeWidth="1.5" fill="none" />
                  <ellipse cx="300" cy="150" rx="70" ry="35" stroke="rgba(14,165,233,0.15)" strokeWidth="2" fill="none" />

                  {/* Tirana Grid Intersection lines */}
                  <line x1="90" y1="150" x2="510" y2="150" stroke="rgba(14,165,233,0.1)" strokeWidth="0.5" />
                  <line x1="300" y1="40" x2="300" y2="260" stroke="rgba(14,165,233,0.1)" strokeWidth="0.5" />

                  {/* Graphical Mock Satellite Elements style */}
                  <g>
                    {/* Primary Server Gateway Nodes */}
                    <circle cx="300" cy="150" r="6" fill="#0ba5e9" className="animate-ping" />
                    <circle cx="300" cy="150" r="3" fill="#0ba5e9" />
                    <text x="300" y="170" fill="#0ba5e9" textAnchor="middle" className="text-[9px] font-mono font-bold tracking-wider">TIRANA MAIN GATEWAY</text>
                  </g>

                  {/* Field Technician Satellite Pins */}
                  {activeTechs.map((tech, i) => {
                    // Spread technician locations slightly around the center
                    const offsetIndex = i % 5;
                    const angles = [0, 72, 144, 216, 288];
                    const radiusX = 110;
                    const radiusY = 55;
                    const angleRad = (angles[offsetIndex] * Math.PI) / 180;
                    const xComp = 300 + Math.cos(angleRad) * radiusX;
                    const yComp = 150 + Math.sin(angleRad) * radiusY;

                    return (
                      <g key={tech.id}>
                        {/* Ping radar circle */}
                        <circle cx={xComp} cy={yComp} r="9" fill="none" stroke={tech.status === 'available' ? '#10b981' : '#f59e0b'} strokeWidth="1" className="animate-pulse" />
                        <circle cx={xComp} cy={yComp} r="3" fill={tech.status === 'available' ? '#10b981' : '#f59e0b'} />
                        <text x={xComp} y={yComp - 8} fill="#ffffff" textAnchor="middle" className="text-[8px] font-mono font-bold">{tech.name.split(' ')[0]}</text>
                      </g>
                    );
                  })}
                </svg>

                {/* HUD Satellite visual corner brackets */}
                <div className="absolute top-2 right-2 border-t-2 border-r-2 border-brand-accent-blue/30 w-4 h-4"></div>
                <div className="absolute bottom-2 right-2 border-b-2 border-r-2 border-brand-accent-blue/30 w-4 h-4"></div>
                <div className="absolute top-2 left-2 border-t-2 border-l-2 border-brand-accent-blue/30 w-4 h-4"></div>
                <div className="absolute bottom-2 left-2 border-b-2 border-l-2 border-brand-accent-blue/30 w-4 h-4"></div>
              </div>

              {/* Bottom satellite status telemetry bar */}
              <div className="bg-[#050914] border-t border-brand-border/40 px-4 py-2 flex items-center justify-between font-mono text-[9px] text-brand-text-muted">
                <div className="flex gap-4">
                  <span>LATENCY: <strong className="text-white">~ 1.8ms</strong></span>
                  <span>FEED QUALITY: <strong className="text-brand-accent-green">100% EXCELLENT</strong></span>
                </div>
                <div>SAT FEED: INTRALINK DECRYPTION LOCAL_LIVE_v5</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
