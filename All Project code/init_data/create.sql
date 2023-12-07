CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL,
    preferences CHAR(100) NOT NULL,
    state CHAR(60) NOT NULL,
    city CHAR(60) NOT NULL
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    restaurant VARCHAR(200) NOT NULL,
    located VARCHAR(100) NOT NULL,
    content VARCHAR,
    rating CHAR,
    alias VARCHAR,
    FOREIGN KEY (username) REFERENCES users(username)
);

CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    restaurant VARCHAR(200),
    located VARCHAR(100),
    alias VARCHAR,
    FOREIGN KEY (username) REFERENCES users(username)
);