export interface OfficeLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
}

export const OFFICE_LOCATIONS: OfficeLocation[] = [
  {
    id: "1",
    name: "SD NEGERI 18 PAREPARE",
    latitude: -4.01329,
    longitude: 119.62596,
    radius: 100,
  },
  {
    id: "2",
    name: "BERINGIN",
    latitude: -4.03630,
    longitude: 119.63229,
    radius: 100,
  },
]
