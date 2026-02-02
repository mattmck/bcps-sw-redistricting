import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { School, PlanningBlock, RedistrictingOption } from '@/types'
import { useGeoData } from '@/hooks/useGeoData'
import './MainView.css'

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

export const MainView = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const geoData = useGeoData()
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [snapshotUrl, setSnapshotUrl] = useState<string>('')
  const [takingSnapshot, setTakingSnapshot] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const selectedSchoolRef = useRef<string>('')
  const listenersAddedRef = useRef(false)
  const darkModeInitialized = useRef(false)
  const schoolsRef = useRef<School[]>([])

  // Keep refs in sync with state
  useEffect(() => {
    selectedSchoolRef.current = selectedSchool
  }, [selectedSchool])
  
  useEffect(() => {
    schoolsRef.current = schools
  }, [schools])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    console.log('Initializing Mapbox map...')
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-76.730514, 39.271697],
      zoom: 12,
      preserveDrawingBuffer: true
    })

    // Store map instance for dark mode style switching
    mapRef.current = map

    map.on('load', () => {
      console.log('Map style loaded successfully')
    })

    map.on('error', (e) => {
      console.error('Map error:', e)
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    mapRef.current = map

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Set schools state when data loads
  useEffect(() => {
    if (!geoData.loading && geoData.schools.length > 0 && schools.length === 0) {
      console.log('Setting initial schools state:', geoData.schools.length)
      setSchools(geoData.schools)
    }
  }, [geoData.loading, geoData.schools])

  // Add event listeners once
  const addMapListeners = (map: mapboxgl.Map) => {
    if (listenersAddedRef.current) return
    
    console.log('Adding map event listeners')
    
    // Click handler for schools
    map.on('click', 'schools-circle', (e) => {
      if (e.features && e.features.length > 0) {
        const schoolName = e.features[0].properties?.NAME
        if (schoolName) {
          console.log('School clicked:', schoolName)
          setSelectedSchool(schoolName)
        }
      }
    })

    // Change cursor on hover for schools
    map.on('mouseenter', 'schools-circle', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'schools-circle', () => {
      map.getCanvas().style.cursor = ''
    })
    
    // Click handler for planning blocks
    map.on('click', 'planning-blocks-fill', (e) => {
      const currentSelectedSchool = selectedSchoolRef.current
      console.log('Planning block layer clicked, features:', e.features?.length, 'selectedSchool:', currentSelectedSchool)
      if (e.features && e.features.length > 0) {
        const blockId = e.features[0].properties?.PBID
        console.log('Block ID:', blockId, 'Selected school:', currentSelectedSchool)
        if (blockId && currentSelectedSchool) {
          console.log('Calling handleBlockClick for block:', blockId)
          handleBlockClick(blockId)
        } else if (!currentSelectedSchool) {
          console.log('No school selected - please click a school first')
        }
      }
    })

    map.on('mouseenter', 'planning-blocks-fill', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'planning-blocks-fill', () => {
      map.getCanvas().style.cursor = ''
    })
    
    listenersAddedRef.current = true
  }

  // Load GeoJSON layers when data is ready
  useEffect(() => {
    console.log('Layer effect - mapRef.current:', !!mapRef.current, 'loading:', geoData.loading, 'planningBlocks:', !!geoData.planningBlocksGeoJSON, 'schools:', !!geoData.schoolsGeoJSON)
    if (!mapRef.current || geoData.loading || !geoData.planningBlocksGeoJSON || !geoData.schoolsGeoJSON) return

    console.log('All data ready, proceeding with layer initialization')
    const map = mapRef.current

    const initializeLayers = () => {
      console.log('Initializing map layers... map loaded:', map.loaded())
      // Add planning blocks
      if (!map.getSource('planning-blocks')) {
        console.log('Adding planning-blocks source and layers')
        map.addSource('planning-blocks', {
          type: 'geojson',
          data: geoData.planningBlocksGeoJSON as any
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
        console.log('Adding schools source with', geoData.schoolsGeoJSON!.features.length, 'features')
        console.log('School colors:', geoData.schoolColors)
        map.addSource('schools', {
          type: 'geojson',
          data: geoData.schoolsGeoJSON as any
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
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        })
        console.log('Schools layer added successfully')
      }

      // Add event listeners once
      addMapListeners(map)

      // Load current districting after layers are added
      console.log('Layers initialized, loading current option')
      console.log('Current option data:', Object.keys(geoData.options.current).length, 'schools')
      // Use a longer timeout to ensure map is fully ready
      setTimeout(() => {
        console.log('Loading current redistricting option')
        if (Object.keys(geoData.options.current).length > 0) {
          loadOption(geoData.options.current)
        } else {
          console.warn('Current option is empty!')
        }
      }, 500)
    }

    if (map.loaded()) {
      initializeLayers()
    } else {
      map.once('load', initializeLayers)
    }
  }, [geoData.loading, geoData.planningBlocksGeoJSON, geoData.schoolsGeoJSON, geoData.schoolColors, geoData.schools])

  // Handle dark mode toggle
  useEffect(() => {
    if (!mapRef.current || !geoData.planningBlocksGeoJSON || !geoData.schoolsGeoJSON) return
    
    // On first run when data is ready, just mark as initialized
    if (!darkModeInitialized.current) {
      darkModeInitialized.current = true
      document.body.classList.toggle('dark-mode', darkMode)
      return
    }
    
    const map = mapRef.current
    const newStyle = darkMode 
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/streets-v12'
    
    // setStyle removes all sources/layers, so we need to reset listener flag
    listenersAddedRef.current = false
    
    map.setStyle(newStyle)
    
    // Re-add layers and data after style loads
    map.once('style.load', () => {
      // Re-add planning blocks (sources are cleared by setStyle)
      map.addSource('planning-blocks', {
        type: 'geojson',
        data: geoData.planningBlocksGeoJSON as any
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
          'line-color': darkMode ? '#ffffff' : '#000000',
          'line-width': 1
        }
      })
      
      // Re-add schools
      map.addSource('schools', {
        type: 'geojson',
        data: geoData.schoolsGeoJSON as any
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
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })
      
      // Re-add event listeners
      addMapListeners(map)
      
      // Restore current colors if we have schools data
      const currentSchools = schoolsRef.current
      if (currentSchools.length > 0) {
        const colorExpression: any[] = ['match', ['get', 'PBID']]
        let hasBlocks = false
        
        currentSchools.forEach(school => {
          const schoolColor = geoData.schoolColors[school.NAME] || '#888888'
          school.planningBlocks.forEach(bid => {
            colorExpression.push(bid, schoolColor)
            hasBlocks = true
          })
        })
        
        colorExpression.push('#888888') // default
        
        // Only update if we have planning blocks
        if (hasBlocks && colorExpression.length > 3) {
          map.setPaintProperty('planning-blocks-fill', 'fill-color', colorExpression as any)
        }
      } else if (Object.keys(geoData.options.current).length > 0) {
        // Fallback: if no schools data yet, load current option
        console.log('No schools in ref, loading current option as fallback')
        setTimeout(() => {
          loadOption(geoData.options.current)
        }, 100)
      }
    })
    
    // Apply dark mode to page
    document.body.classList.toggle('dark-mode', darkMode)
  }, [darkMode, geoData.planningBlocksGeoJSON, geoData.schoolsGeoJSON, geoData.schoolColors])

  const loadOption = (option: RedistrictingOption) => {
    console.log('loadOption called, option has', Object.keys(option).length, 'schools')
    if (!mapRef.current || !geoData.planningBlocksGeoJSON) {
      console.log('loadOption aborted - map or data not ready')
      return
    }
    
    // Use geoData.schools if local schools state is empty
    const schoolsToUpdate = schools.length > 0 ? schools : geoData.schools
    if (schoolsToUpdate.length === 0) {
      console.log('No schools available yet, skipping option load')
      return
    }
    console.log('Loading option for', schoolsToUpdate.length, 'schools')

    const updatedSchools = schoolsToUpdate.map(school => {
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
      let totalBlocks = 0
      
      Object.entries(option).forEach(([schoolName, blockIds]) => {
        const color = geoData.schoolColors[schoolName] || '#888888'
        totalBlocks += blockIds.length
        blockIds.forEach(blockId => {
          colorExpression.push(blockId, color)
        })
      })
      
      colorExpression.push('#888888') // default
      
      console.log('Updating map colors for', totalBlocks, 'planning blocks')
      map.setPaintProperty('planning-blocks-fill', 'fill-color', colorExpression as any)
      console.log('Map colors updated successfully')
    } catch (error) {
      console.error('Error updating map colors:', error)
    }
  }

  const handleBlockClick = (blockId: string) => {
    const currentSelectedSchool = selectedSchoolRef.current
    if (!currentSelectedSchool) return

    console.log('Assigning block', blockId, 'to', currentSelectedSchool)

    // Use functional update to get current schools state
    setSchools(currentSchools => {
      console.log('Current schools count:', currentSchools.length)
      
      // Update schools - remove block from all schools and add to selected school
      const updatedSchools = currentSchools.map(school => {
        const newBlocks = school.NAME === currentSelectedSchool
          ? [...school.planningBlocks.filter(b => b !== blockId), blockId] // Add to selected school
          : school.planningBlocks.filter(b => b !== blockId) // Remove from other schools
        
        const students = calculateStudents(school, newBlocks, geoData.planningBlocks)
        
        return {
          ...school,
          planningBlocks: newBlocks,
          students
        }
      })

      console.log('Updated schools, block now in:', updatedSchools.find(s => s.planningBlocks.includes(blockId))?.NAME)
      
      // Update map color immediately
      if (mapRef.current && mapRef.current.getLayer('planning-blocks-fill')) {
        const colorExpression: any[] = ['match', ['get', 'PBID']]
        updatedSchools.forEach(school => {
          const schoolColor = geoData.schoolColors[school.NAME] || '#888888'
          school.planningBlocks.forEach(bid => {
            colorExpression.push(bid, schoolColor)
          })
        })
        colorExpression.push('#888888')
        
        mapRef.current.setPaintProperty('planning-blocks-fill', 'fill-color', colorExpression as any)
        console.log('Map colors updated')
      }
      
      return updatedSchools
    })

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

  const takeSnapshot = () => {
    if (!mapRef.current) return
    
    setTakingSnapshot(true)
    const map = mapRef.current
    
    // Wait a bit for any animations to finish
    setTimeout(() => {
      const canvas = map.getCanvas()
      const dataUrl = canvas.toDataURL('image/png')
      setSnapshotUrl(dataUrl)
      setTakingSnapshot(false)
      
      // Scroll to snapshot
      setTimeout(() => {
        document.getElementById('snapshot')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }, 100)
  }

  console.log('MainView render - schools count:', schools.length, 'geoData.schools:', geoData.schools.length, 'loading:', geoData.loading)

  return (
    <div className="main-view">
      <div ref={mapContainerRef} className="map-container"></div>
      
      {geoData.loading && <div className="loading">Loading map data...</div>}
      {!geoData.loading && schools.length === 0 && <div className="loading">Data loaded but no schools found</div>}
      
      {selectedSchool && (
        <div className="selected-school-banner">
          <strong>Selected School:</strong> {selectedSchool}
          <span style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            backgroundColor: geoData.schoolColors[selectedSchool],
            marginLeft: '10px',
            verticalAlign: 'middle',
            border: '2px solid white'
          }} />
          <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#666' }}>
            (Click planning blocks on the map to assign them to this school)
          </span>
        </div>
      )}
      
      <div className="options-panel">
        <h4>Actions</h4>
        <button onClick={takeSnapshot} className="btn" disabled={takingSnapshot}>
          {takingSnapshot ? '📸 Taking Snapshot...' : '📸 Take Snapshot'}
        </button>
        <button onClick={() => loadOption(geoData.options.current)} className="btn">Load Current Districting</button>
        <label className="dark-mode-toggle">
          <span>Dark Mode</span>
          <input 
            type="checkbox" 
            checked={darkMode} 
            onChange={(e) => setDarkMode(e.target.checked)}
            className="dark-mode-checkbox"
          />
          <span className="slider"></span>
        </label>
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

      <div className="options-panel">
        <h4>10/28/2015 Meeting</h4>
        <button onClick={() => loadOption(geoData.options.optionA1021)} className="btn">Option A</button>
        <button onClick={() => loadOption(geoData.options.optionB1021)} className="btn">Option B</button>
        <button onClick={() => loadOption(geoData.options.optionC1021)} className="btn">Option C</button>
        <button onClick={() => loadOption(geoData.options.optionD1021)} className="btn">Option D</button>
        <button onClick={() => loadOption(geoData.options.optionE1021)} className="btn">Option E</button>
        <button onClick={() => loadOption(geoData.options.optionF1021)} className="btn">Option F</button>
        <button onClick={() => loadOption(geoData.options.optionG1021)} className="btn">Option G</button>
      </div>

      <div className="options-panel">
        <h4>11/11/2015 Meeting</h4>
        <button onClick={() => loadOption(geoData.options.optionA1111)} className="btn">Option A</button>
        <button onClick={() => loadOption(geoData.options.optionB1111)} className="btn">Option B</button>
        <button onClick={() => loadOption(geoData.options.optionC1111)} className="btn">Option C</button>
        <button onClick={() => loadOption(geoData.options.optionD1111)} className="btn">Option D</button>
        <button onClick={() => loadOption(geoData.options.optionE1111)} className="btn">Option E</button>
        <button onClick={() => loadOption(geoData.options.optionF1111)} className="btn">Option F</button>
        <button onClick={() => loadOption(geoData.options.optionG1111)} className="btn">Option G</button>
        <button onClick={() => loadOption(geoData.options.optionH1111)} className="btn">Option H</button>
        <button onClick={() => loadOption(geoData.options.optionI1111)} className="btn">Option I</button>
        <button onClick={() => loadOption(geoData.options.optionJ1111)} className="btn">Option J</button>
        <button onClick={() => loadOption(geoData.options.optionK1111)} className="btn">Option K</button>
        <button onClick={() => loadOption(geoData.options.optionL1111)} className="btn">Option L</button>
      </div>

      <div className="options-panel">
        <h4>11/18/2015 Meeting</h4>
        <button onClick={() => loadOption(geoData.options.option11118)} className="btn">Option 1</button>
        <button onClick={() => loadOption(geoData.options.option21118)} className="btn">Option 2</button>
        <button onClick={() => loadOption(geoData.options.option31118)} className="btn">Option 3</button>
        <button onClick={() => loadOption(geoData.options.option41118)} className="btn">Option 4</button>
      </div>

      <div className="school-table">
        {schools.length === 0 ? (
          <div className="loading">No school data loaded yet...</div>
        ) : (
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
        )}
      </div>

      {snapshotUrl && (
        <div id="snapshot" className="snapshot-container">
          <h3>Map Snapshot</h3>
          <img src={snapshotUrl} alt="Map snapshot" style={{ maxWidth: '100%', border: '1px solid #ccc' }} />
          <div style={{ marginTop: '10px' }}>
            <a href={snapshotUrl} download="redistricting-map.png" className="btn">
              Download Image
            </a>
            <button onClick={() => setSnapshotUrl('')} className="btn" style={{ marginLeft: '10px' }}>
              Clear Snapshot
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
