-- ENUM type for URL status
CREATE TYPE url_status AS ENUM ('pending', 'malicious', 'benign');

-- ENUM type for allowed intervals
CREATE TYPE interval_value AS ENUM ('0.2', '1', '2', '3', '4', '5');

-- Complement Table
CREATE TABLE complement (
    id SERIAL PRIMARY KEY,
    protection_status BOOLEAN DEFAULT TRUE,
    token VARCHAR(255) NOT NULL UNIQUE CHECK (char_length(token) > 0),
    interval_time interval_value DEFAULT '0.2'::interval_value,
    CONSTRAINT valid_interval CHECK (interval_time IN ('0.2', '1', '2', '3', '4', '5'))
);

-- History Table
CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL UNIQUE,
    reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    report_counter INTEGER DEFAULT 1 CHECK (report_counter >= 0),
    complement_id INTEGER NOT NULL,
    FOREIGN KEY (complement_id) REFERENCES complement(id)
);

-- Reported URLs Table
CREATE TABLE reported_urls (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL UNIQUE,
    detection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status url_status DEFAULT 'pending',
    complement_id INTEGER NOT NULL,
    FOREIGN KEY (complement_id) REFERENCES complement(id)
);

-- Blacklist URLs Table
CREATE TABLE blacklist_urls (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL UNIQUE,
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    detection_counter INTEGER DEFAULT 1 CHECK (detection_counter >= 0)
);

-- Indexes for better performance
CREATE INDEX idx_history_complement ON history(complement_id);
CREATE INDEX idx_reported_urls_complement ON reported_urls(complement_id);
CREATE INDEX idx_complement_token ON complement(token);
CREATE INDEX idx_history_url ON history(url);
CREATE INDEX idx_reported_urls_url ON reported_urls(url);
CREATE INDEX idx_blacklist_url ON blacklist_urls(url);