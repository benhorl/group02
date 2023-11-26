CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    content VARCHAR,
    rating CHAR,
    alias VARCHAR,
    FOREIGN KEY (username) REFERENCES users(username)
);

CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    restaurant VARCHAR(100),
    FOREIGN KEY (username) REFERENCES users(username)
);