CREATE TABLE users(
    user_id SERIAL PRIMARY KEY NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password CHAR(60) NOT NULL
);

CREATE TABLE spots(
    spot_id SERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(50) UNIQUE NOT NULL,
    avg_rating FLOAT,
    long FLOAT,
    lat FLOAT
);

CREATE TABLE ratings(
    rating_id SERIAL PRIMARY KEY NOT NULL,
    rating FLOAT,
    spot_id INT NOT NULL,
    user_id INT NOT NULL
);
