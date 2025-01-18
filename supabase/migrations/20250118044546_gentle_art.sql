/*
  # Parking Lot Management Schema

  1. New Tables
    - `parking_spots`
      - `id` (uuid, primary key)
      - `spot_number` (text, unique)
      - `is_occupied` (boolean)
      - `vehicle_type` (text)
      - `floor_number` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `parking_records`
      - `id` (uuid, primary key)
      - `spot_id` (uuid, foreign key)
      - `vehicle_number` (text)
      - `entry_time` (timestamp)
      - `exit_time` (timestamp)
      - `amount_paid` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create parking spots table
CREATE TABLE IF NOT EXISTS parking_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_number text UNIQUE NOT NULL,
  is_occupied boolean DEFAULT false,
  vehicle_type text,
  floor_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create parking records table
CREATE TABLE IF NOT EXISTS parking_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid REFERENCES parking_spots(id),
  vehicle_number text NOT NULL,
  entry_time timestamptz DEFAULT now(),
  exit_time timestamptz,
  amount_paid decimal(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to parking spots"
  ON parking_spots
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow update access to parking spots"
  ON parking_spots
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to parking records"
  ON parking_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to parking records"
  ON parking_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to parking records"
  ON parking_records
  FOR UPDATE
  TO authenticated
  USING (true);