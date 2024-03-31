CREATE DATABASE auth DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;

CREATE USER 'auth'@'localhost' IDENTIFIED BY 'password';

GRANT ALL ON auth.* TO 'auth'@'localhost';

CREATE TABLE Users (
    userID bigint NOT NULL AUTO_INCREMENT,
    name varchar(255),
    email varchar(255),
    phone varchar(255),
    hash varchar(255),
    date timestamp NOT NULL,
    active tinyint,
    PRIMARY KEY (userID)
);

CREATE TABLE Activity (
    id bigint NOT NULL AUTO_INCREMENT,
    userID bigint,
    username varchar(255),
    thumbnail text,
    date timestamp NOT NULL,
    PRIMARY KEY (id)
);
