# 🏨 Hotel Room Reservation System

---

## 📁 Project Structure
```
hotel-frontend/
  src/
    App.jsx        ← React single-file frontend
    main.jsx       ← Vite entry point
  package.json
```
---

### Frontend
```bash
cd hotel-frontend
npm install
npm run dev        # runs on http://localhost:5173
```

---

## 🎨 Frontend Features

| Feature | Description |
|---------|-------------|
| **Room Grid** | Visual 10-floor hotel map, floor 10 at top |
| **Color Coding** | 🟢 New booking · 🔴 Previous booking · 🟠 Random occupancy · ⬜ Available |
| **Stats Bar** | Live count of total/booked/available + occupancy % bar |
| **Booking Result** | Shows which rooms were booked + travel time + explanation |
| **Responsive** | Works on mobile (small room cells) and desktop |
| **Tooltips** | Hover any room to see room ID, floor, position, status |

---

## 🔧 Tech Stack
- **Frontend**: React 18 · Vite · Pure CSS-in-JS (no external UI libs)