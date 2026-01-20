import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import taxonNames from './taxonNames2024.json'
import sampleData from '../components/observationData.json'


function formatTaxonName(taxon:any): string {
    if (taxon == null) {
        return "Unknown";
    }

    return taxon.name + (taxon.common_name ? ` (${taxon.common_name.name})` : "");
}

export async function getObservationData() : Promise<FeatureCollection<Geometry, GeoJsonProperties>>{
  let featureCollection = {
     type: 'FeatureCollection',
        features: [
            {
            type: 'Feature', geometry: { type: 'Point', coordinates: [parseFloat(sampleData["longitude"]),parseFloat(sampleData["latitude"])] },
            properties: null
        }
      ]
  }

  try {
    await fetch("https://inaturalist.nz/observations/kylie21571.json")
    .then(response => response.json())
    .then(data => {
      const features = data.map((obs:any) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [obs.longitude, obs.latitude]
        },
        properties: {
          formattedTaxonName: formatTaxonName(obs.taxon),
          randomTaxons: [
            formatTaxonName(taxonNames[Math.floor(Math.random()*taxonNames.length)]),
            formatTaxonName(taxonNames[Math.floor(Math.random()*taxonNames.length)]),
            formatTaxonName(taxonNames[Math.floor(Math.random()*taxonNames.length)])
          ],  
          previewImage: obs.photos.length > 0 ? obs.photos[0].square_url : null,
          ...obs
        }
      }));
      console.log("Generated features:", features);
      featureCollection = {
        type: "FeatureCollection",
        features: features
      };
      return featureCollection as FeatureCollection<Geometry, GeoJsonProperties>;
    });
  } catch (error) {
    console.error("Error fetching observation data:", error);
    throw error;
  }
  return featureCollection as FeatureCollection<Geometry, GeoJsonProperties>;
}