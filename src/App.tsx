import './index.css'
import { Map, type MapRef } from '@vis.gl/react-maplibre'
import Nav from './Nav'
import Stack from '@mui/material/Stack'
import 'maplibre-gl/dist/maplibre-gl.css'; 
import AddLayer from './components/addLayer'
import { useState } from 'react'
import sampleData from './components/observationData.json'

export default function App() {
  const [, setCurrentMap] = useState<MapRef|null>(null)

  const handleComponentALoaded = (currentMap:MapRef) => {
    setCurrentMap(currentMap)
  };

  return (
    <Stack gap={10}>
      <Nav/>
        <div className="map">
          <Map 
            initialViewState={{
              latitude: parseFloat(sampleData["latitude"]) ,
              longitude: parseFloat(sampleData["longitude"]),
              zoom: 12
            }}
            mapStyle="https://tiles.openfreemap.org/styles/liberty"
          >
            <AddLayer 
            onLoad={handleComponentALoaded} 
            />
          </Map>
        </div>
    </Stack>
  )
}
