CREATE TABLE users(
    user_id SERIAL PRIMARY KEY NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password CHAR(60) NOT NULL
);

CREATE TABLE spots(
    spot_id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    avg_rating FLOAT
);

CREATE TABLE ratings(
    rating_id SERIAL PRIMARY KEY NOT NULL,
    rating FLOAT
);

CREATE TABLE spots_to_reviews(
    spot_id INT NOT NULL,
    rating_id INT NOT NULL,
    FOREIGN KEY (spot_id) REFERENCES spots (spot_id),
    FOREIGN KEY (rating_id) REFERENCES ratings (rating_id)
);

CREATE TABLE users_to_reviews(
    user_id INT NOT NULL,
    rating_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (rating_id) REFERENCES ratings (rating_id)
);
