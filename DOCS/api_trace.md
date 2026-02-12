# Bus Tracking - "Inch by Inch" API Link Trace

This document tracks every link from the authentication layer to the real-time location tracking.

**Base URL:** `https://bus-tracking-master-production.up.railway.app`

## 1. Authentication Layer
These endpoints handle user registration and login for both Clients and Drivers.

| Action | HTTP Method | Endpoint |
| :--- | :--- | :--- |
| **Client Login** | `POST` | `/api/client/login` |
| **Driver Login** | `POST` | `/api/driver/login` |
| **Client Signup** | `POST` | `/api/client/signup` |
| **Driver Signup** | `POST` | `/api/driver/signup` |
| **Reset Password (Client)**| `POST` | `/api/client/reset-password` |
| **Reset Password (Driver)**| `POST` | `/api/driver/reset-password` |

---

## 2. Driver Dashboard (Data Transmission)
Drivers connect via raw WebSockets to transmit location data and manage their profile.

| Step | Type | Endpoint / Destination |
| :--- | :--- | :--- |
| **Connect to Real-time** | `WS` | `/ws/driver` |
| **Start Tracking** | `SEND` | JSON with `"action": "START"` |
| **Continuous Location Send** | `SEND` | JSON with `"action": "UPDATE"` (every 1s) |
| **Stop Tracking** | `SEND` | JSON with `"action": "STOP"` |
| **Update Profile** | `PUT` | `/api/driver/{id}/profile` |
| **Delete Account** | `DELETE`| `/api/driver/{id}` |

### Driver Data Payload (WebSocket)
```json
{
  "busNumber": "MH12AB1234",
  "busName": "Route 12",
  "latitude": 13.0827,
  "longitude": 80.2707,
  "action": "START/UPDATE/STOP",
  "driverName": "Gowtham",
  "driverPhone": "9000000000"
}
```

---

## 3. Client Dashboard (Location Receiving)
Clients receive updates for all active buses.

| Step | Type | Endpoint / Destination |
| :--- | :--- | :--- |
| **Initial Bus Load** | `GET` | `/api/bus/all` |
| **Connect to Real-time** | `WS` | `/ws/user` |
| **Discovery Request** | `SEND` | `{"type": "ALL", "value": ""}` |
| **Listen for Live Buses** | `RECEIVE`| List of `BusData` objects |
| **Update Profile** | `PUT` | `/api/client/profile` |
| **Delete Account** | `DELETE`| `/api/client/{id}` |

---

## 4. Admin Dashboard (Management)
Admins manage system settings and monitor all traffic.

| Action | HTTP Method | Endpoint / Destination |
| :--- | :--- | :--- |
| **Fetch App Settings** | `GET` | `/api/admin/settings` |
| **Toggle Signup Access** | `POST` | `/api/admin/toggle-account-creation` |
| **Clear All Sessions** | `DELETE`| `/api/admin/clear-sessions` |
| **Connect to Monitor** | `WS` | `/ws/admin` |
| **System Updates** | `RECEIVE`| Topic: `REGISTRATION_UPDATE` |

---

## 5. Summary of Real-time Flow
1. **Driver** sends location JSON to `/ws/driver`.
2. **Backend** processes logic in `DriverHandler`, updates `BusSessionStore`, and database.
3. **Backend** triggers `userHandler.broadcastUpdate()`.
4. **All Clients** connected to `/ws/user` receive the updated state instantly.
