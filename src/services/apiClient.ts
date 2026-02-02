/**
 * API Client for BCPS Redistricting Backend
 * Provides typed wrappers for all backend endpoints
 */

import type { GeoJSONData, RedistrictingOption } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

/**
 * Generic fetch wrapper with error handling
 */
async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error)
    throw error
  }
}

/**
 * Schools API
 */
export const schoolsAPI = {
  /**
   * Get all schools as GeoJSON FeatureCollection
   */
  getAll: (): Promise<GeoJSONData> => {
    return fetchJSON<GeoJSONData>('/api/schools')
  },

  /**
   * Get a single school by ID
   */
  getById: (id: number): Promise<any> => {
    return fetchJSON(`/api/schools/${id}`)
  },
}

/**
 * Planning Blocks API
 */
export const planningBlocksAPI = {
  /**
   * Get all planning blocks as GeoJSON FeatureCollection
   */
  getAll: (): Promise<GeoJSONData> => {
    return fetchJSON<GeoJSONData>('/api/planning-blocks')
  },

  /**
   * Get a single planning block by ID
   */
  getById: (id: number): Promise<any> => {
    return fetchJSON(`/api/planning-blocks/${id}`)
  },
}

export interface OptionMetadata {
  id: number
  name: string
  display_name: string
  meeting_date: string | null
  description: string | null
  is_current: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OptionWithAssignments extends OptionMetadata {
  assignments: RedistrictingOption
}

export interface SchoolStats {
  name: string
  students: number
  capacity2015: number
  capacity2016: number | null
  capacity2017: number | null
  utilization2015: number
  utilization2016: number | null
  utilization2017: number | null
}

export interface OptionStats {
  option: {
    id: number
    name: string
    display_name: string
  }
  schools: SchoolStats[]
}

/**
 * Redistricting Options API
 */
export const optionsAPI = {
  /**
   * Get all redistricting options (metadata only)
   */
  getAll: (): Promise<OptionMetadata[]> => {
    return fetchJSON<OptionMetadata[]>('/api/options')
  },

  /**
   * Get a specific option with school assignments
   */
  getById: (id: number): Promise<OptionWithAssignments> => {
    return fetchJSON<OptionWithAssignments>(`/api/options/${id}`)
  },

  /**
   * Get statistics for a specific option
   */
  getStats: (id: number): Promise<OptionStats> => {
    return fetchJSON<OptionStats>(`/api/options/${id}/stats`)
  },

  /**
   * Create a new redistricting option
   */
  create: (data: {
    name: string
    displayName?: string
    description?: string
    assignments: RedistrictingOption
  }): Promise<OptionMetadata> => {
    return fetchJSON<OptionMetadata>('/api/options', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update an existing redistricting option
   */
  update: (
    id: number,
    data: {
      displayName?: string
      description?: string
      assignments?: RedistrictingOption
    }
  ): Promise<OptionMetadata> => {
    return fetchJSON<OptionMetadata>(`/api/options/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete a redistricting option
   */
  delete: (id: number): Promise<{ message: string; name: string }> => {
    return fetchJSON(`/api/options/${id}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Health check
 */
export const healthAPI = {
  check: (): Promise<{
    status: string
    timestamp: string
    uptime: number
    database: string
  }> => {
    return fetchJSON('/health')
  },
}

/**
 * Export all APIs as default
 */
export default {
  schools: schoolsAPI,
  planningBlocks: planningBlocksAPI,
  options: optionsAPI,
  health: healthAPI,
}
