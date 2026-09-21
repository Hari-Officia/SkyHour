# SKYHOUR: Frontend / Backend Integration Report

## 1. End-to-End User Journeys
All core frontend routes (`/`, `/flight/:id`, `/airport/:code`, `/route/:origin/:destination`, `/airline/:code`, `/map`, `/india`) are integrated with native fetch API calls to `http://127.0.0.1:8000`.

## 2. UI State Management
- **Loading States**: Skeletons and spinners rendered during fetch.
- **Error States**: Graceful fallback UI with retry buttons when endpoints are unreachable.
- **Leaflet GIS Integration**: ESM import (`import * as L from 'leaflet'`) renders airport circles, flight vectors, plane markers, and map search auto-fly interactions.
