import type { FeatureCollection, Point } from "geojson";
import { type CircleLayerSpecification } from "maplibre-gl";
import { Source, Layer, type MapRef, useMap, Popup, type PopupProps} from "@vis.gl/react-maplibre";
import { getObservationData } from '../lib/api'
import { useEffect, useState } from "react";
import sampleData from './observationData.json'
import { Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Typography } from "@mui/material";
import { preload } from "react-dom";


type AddLayerProps = {
  onLoad: (mapCurrent:MapRef) => void;
};

function shuffleArray(array:Array<any>) {
  let currentIndex = array.length;

  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}


 export default function AddLayer(props:AddLayerProps) {
    const mapTiles = "https://api.maptiler.com/tiles/contours/tiles.json?key=ZDDbImwebSw8CysloxvF"
    
    const [popupProperties, setPopupProperties] = useState<PopupProps|null>(null)
    const [hoverPopupProperties, setHoverPopupProperties] = useState<PopupProps|null>(null)
    const [taxonNames, setTaxonNames] = useState<any[]>(["[Placeholder1]", "[Placeholder2]", "[Placeholder3]", "[Placeholder4]"]);
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
    const [currentImageArray, setCurrentImageArray] = useState<any[]>([]);
    const [currentObservation, setCurrentObservation] = useState<any>();
    const [message, setMessage] = useState<string>("");
    const [value, setValue] = useState('');
    
    const handleSubmit = (event: any) => {
        if (currentObservation == null) return
        event.preventDefault(); 
       
        if (value === currentObservation.formattedTaxonName) {
            setMessage("Correct! Well done.");
        } else {
            setMessage(`Incorrect. The correct answer was: ${currentObservation.formattedTaxonName}`);
        }
        
    };

     const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue((event.target as HTMLInputElement).value);
    };

    const layerStyle: CircleLayerSpecification = {
        id: 'point',
        type: 'circle',
        paint: {
            'circle-radius': 10, // Radius in pixels
            'circle-color': '#FF0000', // Red fill
            'circle-opacity': 0.8,
            'circle-stroke-width': 2, // Outline width
            'circle-stroke-color': '#FFFFFF' // White outline
        },
        source: mapTiles
    };

     const map = useMap()

    const defaultGeojson:FeatureCollection= {
        type: 'FeatureCollection',
        features: [
            {
            type: 'Feature', geometry: { type: 'Point', coordinates: [parseFloat(sampleData["longitude"]),parseFloat(sampleData["latitude"])] },
            properties: null
            }
        ]
    }

    const [loadedGeoJSON, setLoadedGeoJSON] = useState<FeatureCollection>(defaultGeojson)

    useEffect(() => {
        const fetchData = async () => {
            const data = await getObservationData();
            console.log("Fetched GeoJSON data:", data);

            if (!data) return;

            setLoadedGeoJSON(data);
            if (map.current) props.onLoad(map.current);
        };
        fetchData();
    }, []); 

    if (map.current)
    {
        map.current.on('click', 'point', (e) => {
            
            if (e.features)
                {
                const randomTaxonNames = JSON.parse(e.features[0].properties?.randomTaxons)
                randomTaxonNames.push(e.features[0].properties?.formattedTaxonName)

                shuffleArray(randomTaxonNames)
                setTaxonNames(randomTaxonNames)
                setCurrentObservation(e.features[0].properties)
                setCurrentImageArray(JSON.parse(e.features[0].properties["photos"]))
                setCurrentImageIndex(0)
                setMessage("")

                preload(e.features[0].properties["previewImage"], { as: "image" });
                const photoArray = JSON.parse(e.features[0].properties["photos"])

                for (const photo of photoArray) {
                    preload(photo["small_url"], { as: "image" });
                }

                const geom = e.features[0].geometry as Point
                const coordinates = geom.coordinates;
      
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                setPopupProperties({
                    longitude: coordinates[0],
                    latitude: coordinates[1],
                    maxWidth: "500px",
                    closeButton: false,
                    onClose: () => setPopupProperties(null)
                })
            }
        });

        map.current.on('mouseover', 'point', (e) => {
            if (e.features)
                {
                const geom = e.features[0].geometry as Point
                const coordinates = geom.coordinates;
                const previewImageUrl = e.features[0]["properties"]["previewImage"];

                setHoverPopupProperties({
                    longitude: coordinates[0],
                    latitude: coordinates[1],
                    closeButton: false,
                    onClose: () => setHoverPopupProperties(null),
                    children: 
                        <img src={previewImageUrl} alt="Observation" style={{ width: '100%', height: 'auto' }} />
                  
                })
            }
        });

        map.current.on('mouseleave', 'point', () => {
            setHoverPopupProperties(null)
        });
    }

    return(
        <Source id="my-data" type="geojson" data={loadedGeoJSON}>
            <Layer {...layerStyle}>
            </Layer>
            
            {popupProperties && currentObservation && (<Popup {...popupProperties} key={currentObservation.id}>
                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
                    <div style={{flex: '1', textAlign: 'center'}}>
                        <img
                        src={currentImageArray[currentImageIndex]["small_url"]}
                        alt={currentImageArray[currentImageIndex]["created_at"]}
                        style={{ width: '100%', height: 'auto' }}
                        />
                        <Button
                        onClick={(ev) => {
                            ev.stopPropagation();
                            setCurrentImageIndex((i) => (i + 1) % currentImageArray.length);
                        }}
                        >
                        Next Image
                        </Button    >
                    </div>

                    <div style={{flex: '1', textAlign: 'left'}}>
                        <form onSubmit={handleSubmit}>
                            <FormControl>
                                <FormLabel id="demo-radio-buttons-group-label">Guess the fungi</FormLabel>
                                <RadioGroup
                                    aria-labelledby="demo-radio-buttons-group-label"
                                    defaultValue={taxonNames[0]}
                                    name="radio-buttons-group"
                                    value={value}
                                    onChange={handleRadioChange}
                                >
                                    <FormControlLabel value={taxonNames[0]} control={<Radio />} label={taxonNames[0]}/>
                                    <FormControlLabel value={taxonNames[1]} control={<Radio />} label={taxonNames[1]}/>
                                    <FormControlLabel value={taxonNames[2]} control={<Radio />} label={taxonNames[2]}/>
                                    <FormControlLabel value={taxonNames[3]} control={<Radio />} label={taxonNames[3]}/>
                                </RadioGroup>
                                <Button sx={{ mt: 1, mr: 1 }} type="submit" variant="outlined">
                                    Check Answer
                                </Button>
                            </FormControl>
                        </form> 
                        {message && <Typography>{message}</Typography>}
                    </div>
                </div>
                </Popup>)}
            {hoverPopupProperties && <Popup {...hoverPopupProperties}></Popup>}
        </Source>
    )
}
