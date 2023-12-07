CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
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

CREATE TABLE followers (
    follower_username VARCHAR(50),
    following_username VARCHAR(50),
    PRIMARY KEY (follower_username, following_username),
    FOREIGN KEY (follower_username) REFERENCES users(username),
    FOREIGN KEY (following_username) REFERENCES users(username)
);
