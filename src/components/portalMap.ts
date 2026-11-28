import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './portalMap.css'

export const MAP_ICONS = {
  hotel: '🏨',
  court: '🎾',
  food: '🍜',
  parking: '🅿️',
  charger: '⚡',
  medical: '🏥',
  rehab: '🩺',
  scenic: '🏞️',
  restroom: '🚻',
  serviceDesk: 'ℹ️',
  restArea: '🪑',
  equipment: '🎒',
  atm: '🏧',
  nursery: '👶',
  restriction: '🚦',
  shop: '🛍️',
  cinema: '🎬',
  location: '📍',
} as const

export const JINGSHAN_MAP_CENTER: [number, number] = [31.0218, 113.1195]
export type MapBasemap = 'vector' | 'satellite'

type PopupAction = {
  label: string
  secondary?: boolean
} & ({ href: string } | { run: () => void })

interface MapPopupContent {
  title: string
  icon: string
  photo?: string
  description?: string
  highlight?: string
  actions?: PopupAction[]
}

export function createPortalMap(element: HTMLElement, center: L.LatLngExpression, zoom: number) {
  const map = L.map(element, { center, zoom, scrollWheelZoom: true, zoomControl: false })
  L.control.zoom({ position: 'bottomright', zoomInTitle: '放大', zoomOutTitle: '缩小' }).addTo(map)
  L.control.scale({ imperial: false }).addTo(map)
  return map
}

export function setPortalMapTiles(
  layers: L.LayerGroup,
  kind: MapBasemap,
  updateUnavailable: (unavailable: boolean) => void,
) {
  layers.clearLayers()
  updateUnavailable(false)
  const options = { subdomains: ['1', '2', '3', '4'], maxZoom: 18 }
  const tiles = kind === 'vector'
    ? L.tileLayer(
        'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        { ...options, attribution: '高德地图' },
      )
    : L.tileLayer(
        'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        { ...options, attribution: '高德影像' },
      )
  let hasLoadedTile = false
  tiles.on('tileload', () => {
    hasLoadedTile = true
    updateUnavailable(false)
  })
  tiles.on('load', () => updateUnavailable(!hasLoadedTile))
  tiles.addTo(layers)
  if (kind === 'satellite') {
    L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', options).addTo(layers)
  }
}

function createMapIcon(icon: string) {
  const symbol = document.createElement('span')
  symbol.className = 'portal-map-icon'
  symbol.setAttribute('aria-hidden', 'true')
  symbol.textContent = icon
  return symbol
}

function createPopupCard(content: MapPopupContent) {
  const card = document.createElement('article')
  card.className = 'portal-map-popup'
  if (content.photo) {
    const photo = document.createElement('img')
    photo.className = 'portal-map-popup-cover'
    photo.src = content.photo
    photo.alt = ''
    card.append(photo)
  } else {
    const header = document.createElement('div')
    header.className = 'portal-map-popup-cover portal-map-popup-symbol'
    header.append(createMapIcon(content.icon))
    card.append(header)
  }

  const body = document.createElement('div')
  body.className = 'portal-map-popup-body'
  const title = document.createElement('strong')
  title.className = 'portal-map-popup-title'
  title.textContent = content.title
  body.append(title)
  if (content.description) {
    const description = document.createElement('p')
    description.textContent = content.description
    body.append(description)
  }

  if (content.highlight || content.actions?.length) {
    const footer = document.createElement('div')
    footer.className = 'portal-map-popup-actions'
    if (content.highlight) {
      const highlight = document.createElement('span')
      highlight.className = 'portal-map-popup-highlight'
      highlight.textContent = content.highlight
      footer.append(highlight)
    }
    for (const action of content.actions ?? []) {
      const className = action.secondary ? 'btn-ghost' : 'btn-primary'
      if ('href' in action) {
        const link = document.createElement('a')
        link.className = className
        link.href = action.href
        link.target = '_blank'
        link.rel = 'noopener'
        link.textContent = action.label
        footer.append(link)
      } else {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = className
        button.textContent = action.label
        button.addEventListener('click', action.run)
        footer.append(button)
      }
    }
    body.append(footer)
  }
  card.append(body)
  return card
}

export function bindPortalMapPopup(layer: L.Marker | L.Polyline, content: MapPopupContent) {
  layer.bindPopup(createPopupCard(content), {
    className: 'portal-map-popup-frame',
    minWidth: 250,
    maxWidth: 280,
    autoPanPadding: [24, 24],
  })
}

export function addPortalMapMarker(
  layers: L.LayerGroup,
  position: L.LatLngExpression,
  content: MapPopupContent & { label: string; compact?: boolean },
  zIndexOffset = 0,
) {
  const pin = document.createElement('span')
  pin.className = 'portal-map-pin'
  if (content.compact) pin.classList.add('is-compact')
  const label = document.createElement('span')
  label.className = 'portal-map-pin-text'
  label.textContent = content.label
  pin.append(createMapIcon(content.icon), label)

  const name = content.title === content.label ? content.title : `${content.title}，${content.label}`
  const marker = L.marker(position, {
    icon: L.divIcon({
      className: 'portal-map-marker',
      html: pin,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      popupAnchor: [0, -34],
    }),
    title: name,
    riseOnHover: true,
    zIndexOffset,
  })
  marker.on('add', () => marker.getElement()?.setAttribute('aria-label', name))
  bindPortalMapPopup(marker, content)
  marker.on('popupopen', () => {
    marker.getElement()?.classList.add('is-selected')
    marker.setZIndexOffset(zIndexOffset + 1000)
  })
  marker.on('popupclose', () => {
    marker.getElement()?.classList.remove('is-selected')
    marker.setZIndexOffset(zIndexOffset)
  })
  return marker.addTo(layers)
}

export function mapNavigationActions(title: string, description: string, lat: number, lng: number): PopupAction[] {
  return [
    { label: '高德导航', href: `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(title)}` },
    { label: '百度导航', secondary: true, href: `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(description)}&output=html` },
  ]
}
