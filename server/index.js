import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const port = 3000;
const db = new Database('parking.db');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS parking_spots (
    id TEXT PRIMARY KEY,
    spot_number TEXT UNIQUE NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    vehicle_type TEXT,
    floor_number INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS parking_records (
    id TEXT PRIMARY KEY,
    spot_id TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    exit_time DATETIME,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spot_id) REFERENCES parking_spots(id)
  );
`);

// Insert some initial parking spots if none exist
const spotsCount = db.prepare('SELECT COUNT(*) as count FROM parking_spots').get();
if (spotsCount.count === 0) {
  const floors = [1, 2];
  floors.forEach(floor => {
    for (let i = 1; i <= 6; i++) {
      db.prepare(`
        INSERT INTO parking_spots (id, spot_number, floor_number)
        VALUES (?, ?, ?)
      `).run(`${floor}-${i}`, `${floor}${String(i).padStart(2, '0')}`, floor);
    }
  });
}

// Routes
app.get('/api/spots', (req, res) => {
  const spots = db.prepare('SELECT * FROM parking_spots ORDER BY floor_number, spot_number').all();
  res.json(spots);
});

app.get('/api/active-records', (req, res) => {
  const records = db.prepare('SELECT * FROM parking_records WHERE exit_time IS NULL').all();
  res.json(records);
});

app.post('/api/park', (req, res) => {
  const { spotId, vehicleNumber } = req.body;
  
  const stmt = db.transaction(() => {
    // Create parking record
    db.prepare(`
      INSERT INTO parking_records (id, spot_id, vehicle_number)
      VALUES (?, ?, ?)
    `).run(Date.now().toString(), spotId, vehicleNumber);

    // Update spot status
    db.prepare(`
      UPDATE parking_spots
      SET is_occupied = TRUE
      WHERE id = ?
    `).run(spotId);
  });

  try {
    stmt();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/exit', (req, res) => {
  const { recordId } = req.body;
  
  const stmt = db.transaction(() => {
    const record = db.prepare('SELECT spot_id FROM parking_records WHERE id = ?').get(recordId);
    
    // Update parking record
    db.prepare(`
      UPDATE parking_records
      SET exit_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(recordId);

    // Free up the spot
    db.prepare(`
      UPDATE parking_spots
      SET is_occupied = FALSE
      WHERE id = ?
    `).run(record.spot_id);
  });

  try {
    stmt();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});