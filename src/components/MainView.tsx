import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { School, PlanningBlock, RedistrictingOption } from '@/types'
import { useGeoData } from '@/hooks/useGeoData'
import './MainView.css'

const MAPBOX_ACCESS_TOKEN = '***REMOVED_MAPBOX_PUBLIC_KEY***'

export const MainView = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const geoData = useGeoData()
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const layersRef = useRef<Record<string, any>>({})

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-76.730514, 39.271697],
      zoom: 12
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      mapRef.current?.remove()
    }
  }, [])

  // Load GeoJSON layers when data is ready
  useEffect(() => {
    if (!mapRef.current || geoData.loading || !geoData.planningBlocksGeoJSON || !geoData.schoolsGeoJSON) return

    const map = mapRef.current

    const initializeLayers = () => {
      // Add planning blocks
      if (!map.getSource('planning-blocks')) {
        map.addSource('planning-blocks', {
          type: 'geojson',
          data: geoData.planningBlocksGeoJSON!
        })

        map.addLayer({
          id: 'planning-blocks-fill',
          type: 'fill',
          source: 'planning-blocks',
          paint: {
            'fill-color': '#888888',
            'fill-opacity': 0.5
          }
        })

        map.addLayer({
          id: 'planning-blocks-line',
          type: 'line',
          source: 'planning-blocks',
          paint: {
            'line-color': '#000000',
            'line-width': 1
          }
        })
      }

      // Add schools
      if (!map.getSource('schools')) {
        map.addSource('schools', {
          type: 'geojson',
          data: geoData.schoolsGeoJSON!
        })

        map.addLayer({
          id: 'schools-circle',
          type: 'circle',
          source: 'schools',
          paint: {
            'circle-radius': 10,
            'circle-color': [
              'match',
              ['get', 'NAME'],
              ...Object.entries(geoData.schoolColors).flat(),
              '#000000'
            ],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
          }
        })
      }

      // Load current districting after layers are added
      setSchools(geoData.schools)
      setTimeout(() => {
        loadOption(geoData.options.current)
      }, 100)
    }

    if (map.loaded()) {
      initializeLayers()
    } else {
      map.once('load', initializeLayers)
    }
  }, [geoData.loading, geoData.planningBlocksGeoJSON, geoData.schoolsGeoJSON])

  const loadOption = (option: RedistrictingOption) => {
    if (!mapRef.current || !geoData.planningBlocksGeoJSON) return

    const updatedSchools = schools.map(school => {
      const planningBlocks = option[school.NAME] || []
      const students = calculateStudents(school, planningBlocks, geoData.planningBlocks)
      
      return {
        ...school,
        planningBlocks,
        students
      }
    })

    setSchools(updatedSchools)

    // Update map colors
    const map = mapRef.current
    
    // Check if map is loaded and layer exists
    if (!map.loaded() || !map.getLayer('planning-blocks-fill')) {
      return
    }

    try {
      const colorExpression: any[] = ['match', ['get', 'PBID']]
      
      Object.entries(option).forEach(([schoolName, blockIds]) => {
        const color = geoData.schoolColors[schoolName] || '#888888'
        blockIds.forEach(blockId => {
          colorExpression.push(blockId, color)
        })
      })
      
      colorExpression.push('#888888') // default
      
      map.setPaintProperty('planning-blocks-fill', 'fill-color', colorExpression)
    } catch (error) {
      console.error('Error updating map colors:', error)
    }
  }

  const calculateStudents = (school: School, planningBlocks: string[], allBlocks: PlanningBlock[]): number => {
    let students = planningBlocks.reduce((sum, blockId) => {
      const block = allBlocks.find(b => b.PBID === blockId)
      return sum + (block ? parseInt(block.K5LiveAtt) || 0 : 0)
    }, 0)

    // Add special adjustments
    const adjustments: Record<string, number> = {
      'Arbutus ES': 17 + 11 + 0,
      'Catonsville ES': 29 + 21 + 1,
      'Edmondson Heights ES': 5 + 43 + 27,
      'Halethorpe ES': 37 + 30 + 0,
      'Hillcrest ES': 14 + 0 + 0,
      'Johnnycake ES': 38 + 29 + 13,
      'Lansdowne ES': 12 + 27 + 0,
      'Relay ES': 45 + 0 + 1,
      'Westchester ES': 11 + 11 + 0,
      'Westowne ES': 30 + 39 + 0,
      'Woodbridge ES': 28 + 21 + 1
    }

    return students + (adjustments[school.NAME] || 0)
  }

  return (
    <div className="main-view">
      <div ref={mapContainerRef} className="map-container"></div>
      
      {geoData.loading && <div className="loading">Loading map data...</div>}
      
      <div className="options-panel">
        <h4>Current Districting</h4>
        <button onClick={() => loadOption(geoData.options.current)} className="btn">Current</button>
      </div>

      <div className="options-panel">
        <h4>9/30/2015 Meeting</h4>
        <button onClick={() => loadOption(geoData.options.option1)} className="btn">Option 1</button>
        <button onClick={() => loadOption(geoData.options.option2)} className="btn">Option 2</button>
        <button onClick={() => loadOption(geoData.options.option3)} className="btn">Option 3</button>
      </div>

      <div className="options-panel">
        <h4>10/14/2015 Meeting</h4>
        <button onClick={() => loadOption(geoData.options.optionA)} className="btn">Option A</button>
        <button onClick={() => loadOption(geoData.options.optionB)} className="btn">Option B</button>
        <button onClick={() => loadOption(geoData.options.optionC)} className="btn">Option C</button>
        <button onClick={() => loadOption(geoData.options.optionD)} className="btn">Option D</button>
        <button onClick={() => loadOption(geoData.options.optionE)} className="btn">Option E</button>
      </div>

      <div className="school-table">
        <table>
          <thead>
            <tr>
              <th>Color</th>
              <th>School</th>
              <th>2015 Cap.</th>
              <th>2016 Cap.</th>
              <th>2017 Cap.</th>
              <th>2015 %</th>
              <th>2016 %</th>
              <th>2017 %</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            {schools.map(school => {
              const cap2015 = school.SRC
              const cap2016 = school.SRC2016 || school.SRC
              const cap2017 = school.SRC2017 || school.SRC2016 || school.SRC
              const pct2015 = Math.round((school.students / cap2015) * 100)
              const pct2016 = Math.round((school.students / cap2016) * 100)
              const pct2017 = Math.round((school.students / cap2017) * 100)

              return (
                <tr key={school.NAME} className={selectedSchool === school.NAME ? 'selected' : ''}>
                  <td>
                    <div 
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: geoData.schoolColors[school.NAME]
                      }}
                    />
                  </td>
                  <td>{school.NAME}</td>
                  <td>{cap2015}</td>
                  <td>{cap2016}</td>
                  <td>{cap2017}</td>
                  <td className={pct2015 > 100 ? 'over-capacity' : ''}>{pct2015}%</td>
                  <td className={pct2016 > 100 ? 'over-capacity' : ''}>{pct2016}%</td>
                  <td className={pct2017 > 100 ? 'over-capacity' : ''}>{pct2017}%</td>
                  <td>{school.students}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
