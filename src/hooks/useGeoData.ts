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
    optionA1021: RedistrictingOption
    optionB1021: RedistrictingOption
    optionC1021: RedistrictingOption
    optionD1021: RedistrictingOption
    optionE1021: RedistrictingOption
    optionF1021: RedistrictingOption
    optionG1021: RedistrictingOption
    optionA1111: RedistrictingOption
    optionB1111: RedistrictingOption
    optionC1111: RedistrictingOption
    optionD1111: RedistrictingOption
    optionE1111: RedistrictingOption
    optionF1111: RedistrictingOption
    optionG1111: RedistrictingOption
    optionH1111: RedistrictingOption
    optionI1111: RedistrictingOption
    optionJ1111: RedistrictingOption
    optionK1111: RedistrictingOption
    optionL1111: RedistrictingOption
    option11118: RedistrictingOption
    option21118: RedistrictingOption
    option31118: RedistrictingOption
    option41118: RedistrictingOption
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
      optionE: {},
      optionA1021: {},
      optionB1021: {},
      optionC1021: {},
      optionD1021: {},
      optionE1021: {},
      optionF1021: {},
      optionG1021: {},
      optionA1111: {},
      optionB1111: {},
      optionC1111: {},
      optionD1111: {},
      optionE1111: {},
      optionF1111: {},
      optionG1111: {},
      optionH1111: {},
      optionI1111: {},
      optionJ1111: {},
      optionK1111: {},
      optionL1111: {},
      option11118: {},
      option21118: {},
      option31118: {},
      option41118: {}
    },
    loading: true
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('useGeoData: Starting to load data...')
        // Load planning blocks
        const planningBlocksRes = await fetch('/assets/planningBlocks.geo.json')
        console.log('useGeoData: Planning blocks response:', planningBlocksRes.status)
        const planningBlocksData: GeoJSONData = await planningBlocksRes.json()
        console.log('useGeoData: Planning blocks loaded, features:', planningBlocksData.features.length)
        
        const blocks: PlanningBlock[] = planningBlocksData.features.map(f => f.properties)
        const rawBlocks = planningBlocksData.features

        // Load schools
        const schoolsRes = await fetch('/assets/schoolLocations.geo.json')
        console.log('useGeoData: Schools response:', schoolsRes.status)
        const schoolsData: GeoJSONData = await schoolsRes.json()
        console.log('useGeoData: Schools loaded, total features:', schoolsData.features.length)

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
        console.log('useGeoData: Loading redistricting options...')
        const optionsData = await loadOptions()
        console.log('useGeoData: Options loaded')

        console.log('useGeoData: Setting data, schools:', schools.length)
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
        console.log('useGeoData: Data loading complete!')
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
  const options: any = {
    current: {},
    option1: {},
    option2: {},
    option3: {},
    optionA: {},
    optionB: {},
    optionC: {},
    optionD: {},
    optionE: {},
    optionA1021: {},
    optionB1021: {},
    optionC1021: {},
    optionD1021: {},
    optionE1021: {},
    optionF1021: {},
    optionG1021: {},
    optionA1111: {},
    optionB1111: {},
    optionC1111: {},
    optionD1111: {},
    optionE1111: {},
    optionF1111: {},
    optionG1111: {},
    optionH1111: {},
    optionI1111: {},
    optionJ1111: {},
    optionK1111: {},
    optionL1111: {},
    option11118: {},
    option21118: {},
    option31118: {},
    option41118: {}
  }

  try {
    // Load 11/18/2015 options (current and options 1-4)
    const data1118 = await fetch('/assets/151118.geo.json').then(r => r.json())
    options.current = buildOption(data1118, 'ES1516')
    options.option11118 = buildOption(data1118, 'NovOpt1')
    options.option21118 = buildOption(data1118, 'NovOpt2')
    options.option31118 = buildOption(data1118, 'NovOpt3')
    options.option41118 = buildOption(data1118, 'NovOpt4')

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

    // Load 10/21/2015 options
    const data1021 = await fetch('/assets/151021.geo.json').then(r => r.json())
    options.optionA1021 = buildOption(data1021, 'OptA')
    options.optionB1021 = buildOption(data1021, 'OptB')
    options.optionC1021 = buildOption(data1021, 'OptC')
    options.optionD1021 = buildOption(data1021, 'OptD')
    options.optionE1021 = buildOption(data1021, 'OptE')
    options.optionF1021 = buildOption(data1021, 'OptF')
    options.optionG1021 = buildOption(data1021, 'OptG')

    // Load 11/11/2015 options
    const data1111 = await fetch('/assets/151111.geo.json').then(r => r.json())
    options.optionA1111 = buildOption(data1111, 'OptA')
    options.optionB1111 = buildOption(data1111, 'OptB')
    options.optionC1111 = buildOption(data1111, 'OptC')
    options.optionD1111 = buildOption(data1111, 'OptD')
    options.optionE1111 = buildOption(data1111, 'OptE')
    options.optionF1111 = buildOption(data1111, 'OptF')
    options.optionG1111 = buildOption(data1111, 'OptG')
    options.optionH1111 = buildOption(data1111, 'OptH')
    options.optionI1111 = buildOption(data1111, 'OptI')
    options.optionJ1111 = buildOption(data1111, 'OptJ')
    options.optionK1111 = buildOption(data1111, 'OptK')
    options.optionL1111 = buildOption(data1111, 'OptL')
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
