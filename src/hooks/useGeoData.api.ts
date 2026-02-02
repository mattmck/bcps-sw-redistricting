import { useState, useEffect } from 'react'
import type { School, PlanningBlock, GeoJSONData, GeoJSONFeature } from '@/types'
import { SCHOOL_COLORS } from '@/utils/calculations'
import { schoolsAPI, planningBlocksAPI, optionsAPI, type OptionWithAssignments } from '@/services/apiClient'

export interface GeoDataState {
  schools: School[]
  planningBlocks: PlanningBlock[]
  rawPlanningBlocks: GeoJSONFeature[]
  schoolColors: Record<string, string>
  planningBlocksGeoJSON: GeoJSONData | null
  schoolsGeoJSON: GeoJSONData | null
  options: {
    current: Record<string, string[]>
    [key: string]: Record<string, string[]>
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
      current: {}
    },
    loading: true
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('useGeoData (API): Starting to load data...')
        
        // Load schools from API
        const schoolsData: GeoJSONData = await schoolsAPI.getAll()
        console.log('useGeoData (API): Schools loaded, features:', schoolsData.features.length)
        
        // Process schools and assign colors
        let colorIndex = 0
        const colors: Record<string, string> = {}
        
        const schools: School[] = schoolsData.features.map(feature => {
          const name = feature.properties.NAME
          
          // Assign color
          colors[name] = SCHOOL_COLORS[colorIndex]
          colorIndex = (colorIndex + 1) % SCHOOL_COLORS.length
          
          return {
            NAME: name,
            TYPE: feature.properties.TYPE,
            OBJECTID: feature.properties.OBJECTID,
            X: feature.properties.X,
            Y: feature.properties.Y,
            SRC: feature.properties.SRC,
            SRC2016: feature.properties.SRC2016,
            SRC2017: feature.properties.SRC2017,
            students: 0,
            planningBlocks: []
          }
        })

        // Load planning blocks from API
        const planningBlocksData: GeoJSONData = await planningBlocksAPI.getAll()
        console.log('useGeoData (API): Planning blocks loaded, features:', planningBlocksData.features.length)
        
        const blocks: PlanningBlock[] = planningBlocksData.features.map(f => f.properties)
        const rawBlocks = planningBlocksData.features

        // Load redistricting options from API
        console.log('useGeoData (API): Loading redistricting options...')
        const optionsList = await optionsAPI.getAll()
        console.log('useGeoData (API): Found', optionsList.length, 'options')
        
        // Load the current option and first 4 options with assignments
        const options: any = {}
        
        // Find the current option (is_current = true)
        const currentOption = optionsList.find(opt => opt.is_current)
        if (currentOption) {
          const currentWithAssignments = await optionsAPI.getById(currentOption.id)
          options.current = currentWithAssignments.assignments
          console.log('useGeoData (API): Loaded current option:', currentOption.name)
        }
        
        // Load first 4 options for backward compatibility with UI
        // Map to old option names (option1, option2, etc.)
        const optionMappings = [
          { apiId: 1, key: 'option1' },  // 150930
          { apiId: 2, key: 'option2' },  // 151014
          { apiId: 3, key: 'option3' },  // 151021
          { apiId: 4, key: 'option4' },  // 151111
          { apiId: 5, key: 'option5' },  // 151118
        ]
        
        for (const mapping of optionMappings) {
          try {
            const optWithAssignments = await optionsAPI.getById(mapping.apiId)
            options[mapping.key] = optWithAssignments.assignments
            console.log(`useGeoData (API): Loaded ${mapping.key}:`, optWithAssignments.name)
          } catch (error) {
            console.warn(`useGeoData (API): Could not load option ${mapping.apiId}`)
            options[mapping.key] = {}
          }
        }
        
        console.log('useGeoData (API): Setting data, schools:', schools.length)
        setData({
          schools,
          planningBlocks: blocks,
          rawPlanningBlocks: rawBlocks,
          schoolColors: colors,
          planningBlocksGeoJSON: planningBlocksData,
          schoolsGeoJSON: schoolsData,
          options,
          loading: false
        })
        console.log('useGeoData (API): Data loading complete!')
      } catch (error) {
        console.error('Error loading geo data from API:', error)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    loadData()
  }, [])

  return data
}
