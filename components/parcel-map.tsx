'use client';
import {useEffect,useRef,useState} from 'react';
import * as maplibregl from 'maplibre-gl';
import {bbox,feature,featureCollection} from '@turf/turf';
import {Layers,LocateFixed} from 'lucide-react';
import type {ParcelFacts} from '@/lib/schemas';
import 'maplibre-gl/dist/maplibre-gl.css';
export default function ParcelMap({parcel}:{parcel:ParcelFacts}){
 const container=useRef<HTMLDivElement>(null),map=useRef<maplibregl.Map|null>(null);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 const [visible,setVisible]=useState<Record<string,boolean>>({parcel:true,zoning:false,slope:true,landslide:true});
 useEffect(()=>{
 if(!container.current)return;
 let instance:maplibregl.Map;
 try{maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');instance=new maplibregl.Map({container:container.current,style:process.env.NEXT_PUBLIC_MAP_STYLE_URL||{version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxzoom:19}},layers:[{id:'basemap',type:'raster',source:'osm',paint:{'raster-saturation':-0.85,'raster-opacity':0.7}}]},center:[-79.93,40.47],zoom:16});map.current=instance;instance.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');instance.on('load',()=>setReady(true));instance.on('error',e=>console.warn('Map resource unavailable',e.error?.message));}catch{queueMicrotask(()=>setFailed(true));return;}
 return()=>{instance.remove();map.current=null;};
 },[]);
 useEffect(()=>{
 const m=map.current;if(!ready||!m)return;
 const data=[{id:'zoning',color:'#9aa8cf',geometry:parcel.zoningDistricts[0]?.geometry},{id:'slope',color:'#df9f42',geometry:parcel.layers.find(l=>l.id==='slope')?.geometry},{id:'landslide',color:'#bf756c',geometry:parcel.layers.find(l=>l.id==='landslide')?.geometry},{id:'parcel',color:'#176b66',geometry:parcel.geometry}];
 for(const l of data){for(const suffix of ['-outline','-fill'])if(m.getLayer(l.id+suffix))m.removeLayer(l.id+suffix);if(m.getSource(l.id))m.removeSource(l.id);if(!l.geometry)continue;m.addSource(l.id,{type:'geojson',data:l.id==='zoning'?featureCollection(parcel.zoningDistricts.map(d=>feature(d.geometry))):feature(l.geometry)});m.addLayer({id:l.id+'-fill',type:'fill',source:l.id,paint:{'fill-color':l.color,'fill-opacity':l.id==='parcel'?0.23:0.42},layout:{visibility:visible[l.id]?'visible':'none'}});m.addLayer({id:l.id+'-outline',type:'line',source:l.id,paint:{'line-color':l.color,'line-width':l.id==='parcel'?3:1},layout:{visibility:visible[l.id]?'visible':'none'}});}
 m.fitBounds(bbox(parcel.geometry) as [number,number,number,number],{padding:100,maxZoom:18,duration:700});
 // Layer visibility is handled separately to preserve the current viewport.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[parcel,ready]);
 useEffect(()=>{const m=map.current;if(!m||!ready)return;for(const [id,on] of Object.entries(visible))for(const suffix of ['-fill','-outline'])if(m.getLayer(id+suffix))m.setLayoutProperty(id+suffix,'visibility',on?'visible':'none');},[visible,ready]);
 const b=bbox(parcel.geometry),rings=parcel.geometry.type==='Polygon'?parcel.geometry.coordinates:parcel.geometry.coordinates.flat();
 return <section className="map-section" id="parcel-map" aria-label="Parcel map"><div ref={container} className="map-canvas"/>{(failed||!ready)&&<div className="map-fallback"><svg viewBox="0 0 400 400" aria-label="Actual parcel boundary"><path d={rings.map(r=>r.map((p,i)=>`${i?'L':'M'}${40+(p[0]-b[0])/(b[2]-b[0])*320},${360-(p[1]-b[1])/(b[3]-b[1])*320}`).join(' ')+' Z').join(' ')} fill="#176b6633" stroke="#176b66" strokeWidth="3" fillRule="evenodd"/></svg><span>{failed?'Boundary view · interactive map unavailable':'Loading basemap · actual parcel boundary'}</span></div>}
 <div className="map-top-label"><span className="tiny-label">CITY OF PITTSBURGH</span><strong>One parcel. A clearer starting point.</strong></div>
 <button className="map-center icon-button" aria-label="Center on parcel" onClick={()=>map.current?.fitBounds(bbox(parcel.geometry) as [number,number,number,number],{padding:100,maxZoom:18})}><LocateFixed size={20}/></button>
 <div className="map-layers"><div className="layer-heading"><Layers size={16}/><strong>Map layers</strong><span>Parcel-level exposure</span></div>{[['parcel','Selected parcel'],['zoning','Base zoning'],['slope','25%+ slope'],['landslide','Landslide-prone']] .map(([id,label])=>{const available=id==='parcel'||id==='zoning'?id==='parcel'||parcel.zoningAvailable:parcel.layers.some(l=>l.id===id&&l.available);return <label key={id}><input type="checkbox" checked={visible[id]} disabled={!available} onChange={e=>setVisible({...visible,[id]:e.target.checked})}/><span className={`swatch ${id}`}/>{label}{!available&&<small>Unavailable</small>}</label>;})}<p>Building footprint location is not specified.</p></div>
 </section>;
}
