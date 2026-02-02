import { useState, useEffect } from 'react'
import type { School, PlanningBlock, GeoJSONData, GeoJSONFeature, RedistrictingOption } from '@/types'
import { SCHOOL_COLORS } from '@/utils/calculations'

export interface GeoDataState {
  schools: School[]
  planningBlocks: PlanningBlock[]
  rawPlanningBlocks: GeoJSONFeature[]
  schoolColors: Record<string, string>
  planningBlocksGeoJSON: GeoJSONData | null
  schoolsGeoJSON: GeoJSONData | null
  options: {
    current: RedistrictingOption
    option1: RedistrictingOption
    option2: RedistrictingOption
    option3: RedistrictingOption
    optionA: RedistrictingOption
    optionB: RedistrictingOption
    optionC: RedistrictingOption
    optionD: RedistrictingOption
    optionE: RedistrictingOption
  }
  loading: boolean
}

export function useGeoData() {
  const [data, setData] = useState<GeoDataState>({
    schools: [],
    planningBlocks: [],
    rawPlanningBlocks: [],
    schoolColors: {},
    planningBlocksGeoJSON: null,
    schoolsGeoJSON: null,
    options: {
      current: {},
      option1: {},
      option2: {},
      option3: {},
      optionA: {},
      optionB: {},
      optionC: {},
      optionD: {},
      optionE: {}
    },
    loading: true
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load planning blocks
        const planningBlocksRes = await fetch('/assets/planningBlocks.geo.json')
        const planningBlocksData: GeoJSONData = await planningBlocksRes.json()
        
        const blocks: PlanningBlock[] = planningBlocksData.features.map(f => f.properties)
        const rawBlocks = planningBlocksData.features

        // Load schools
        const schoolsRes = await fetch('/assets/schoolLocations.geo.json')
        const schoolsData: GeoJSONData = await schoolsRes.json()

        // Filter elementary schools in the southwest area
        const filteredFeatures = schoolsData.features.filter(feature => {
          return (
            feature.properties.TYPE === 'ES' &&
            parseFloat(feature.geometry.coordinates[1]) < 39.313 &&
            parseFloat(feature.geometry.coordinates[0]) < -76.6565 &&
            feature.properties.NAME !== 'NewCatonsville ES'
          )
        })

        // Process schools and assign colors
        let colorIndex = 0
        const colors: Record<string, string> = {}
        
        const schools: School[] = filteredFeatures.map(feature => {
          let name = feature.properties.NAME
          
          // Name corrections
          if (name === 'Edmonson Heights ES') name = 'Edmondson Heights ES'
          if (name === 'Old Catonsville ES') name = 'Catonsville ES'

          // Assign color
          colors[name] = SCHOOL_COLORS[colorIndex]
          colorIndex = (colorIndex + 1) % SCHOOL_COLORS.length

          // Set capacity overrides
          let SRC2016 = feature.properties.SRC2016
          let SRC2017 = feature.properties.SRC2017

          switch (name) {
            case 'Catonsville ES':
              SRC2016 = 715
              break
            case 'Relay ES':
              SRC2017 = 689
              break
            case 'Westchester ES':
              SRC2016 = 699
              break
            case 'Westowne ES':
              SRC2016 = 650
              break
          }

          return {
            NAME: name,
            TYPE: feature.properties.TYPE,
            OBJECTID: feature.properties.OBJECTID,
            X: feature.properties.X,
            Y: feature.properties.Y,
            SRC: feature.properties.SRC,
            SRC2016,
            SRC2017,
            students: 0,
            planningBlocks: []
          }
        })

        // Update GeoJSON with corrected names
        const updatedSchoolsGeoJSON: GeoJSONData = {
          ...schoolsData,
          features: filteredFeatures.map(f => {
            let name = f.properties.NAME
            if (name === 'Edmonson Heights ES') name = 'Edmondson Heights ES'
            if (name === 'Old Catonsville ES') name = 'Catonsville ES'
            return {
              ...f,
              properties: { ...f.properties, NAME: name }
            }
          })
        }

        // Load redistricting options
        const optionsData = await loadOptions()

        setData({
          schools,
          planningBlocks: blocks,
          rawPlanningBlocks: rawBlocks,
          schoolColors: colors,
          planningBlocksGeoJSON: planningBlocksData,
          schoolsGeoJSON: updatedSchoolsGeoJSON,
          options: optionsData,
          loading: false
        })
      } catch (error) {
        console.error('Error loading geo data:', error)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    loadData()
  }, [])

  return data
}

async function loadOptions() {
  const options = {
    current: {},
    option1: {},
    option2: {},
    option3: {},
    optionA: {},
    optionB: {},
    optionC: {},
    optionD: {},
    optionE: {}
  }

  try {
    // Load 11/18/2015 options (current and options 1-4)
    const data1118 = await fetch('/assets/151118.geo.json').then(r => r.json())
    options.current = buildOption(data1118, 'ES1516')

    // Load 9/30/2015 options
    const data0930 = await fetch('/assets/150930.geo.json').then(r => r.json())
    options.option1 = buildOption(data0930, 'Opt1')
    options.option2 = buildOption(data0930, 'Opt2')
    options.option3 = buildOption(data0930, 'Opt3')

    // Load 10/14/2015 options
    const data1014 = await fetch('/assets/151014.geo.json').then(r => r.json())
    options.optionA = buildOption(data1014, 'OptA')
    options.optionB = buildOption(data1014, 'OptB')
    options.optionC = buildOption(data1014, 'OptC')
    options.optionD = buildOption(data1014, 'OptD')
    options.optionE = buildOption(data1014, 'OptE')
  } catch (error) {
    console.error('Error loading options:', error)
  }

  return options
}

function buildOption(geoData: GeoJSONData, field: string): RedistrictingOption {
  const option: RedistrictingOption = {}
  
  geoData.features.forEach(feature => {
    const schoolName = feature.properties[field]
    if (schoolName) {
      if (!option[schoolName]) {
        option[schoolName] = []
      }
      option[schoolName].push(feature.properties.PBID)
    }
  })

  return option
}
