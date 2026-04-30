-- ==========================================================
--  Bookshelf — database schema
--  ---------------------------------------------------------
--  This file is meant to be imported in phpMyAdmin (MySQL)
--  or in any SQL client. It creates the three tables
--  required by the website : users, books, commande.
--  ==========================================================

-- 1. drop & create the database (optional)
CREATE DATABASE IF NOT EXISTS bookshelf
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bookshelf;


-- 2. users  (people who can sign up, log in, sell or buy)
DROP TABLE IF EXISTS commande;   -- drop child first to keep foreign keys happy
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL,
    email       VARCHAR(120) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,           -- store the hash, never the clear text
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 3. books  (one row per book on sale, linked to its owner)
CREATE TABLE books (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,           -- the seller
    title       VARCHAR(150) NOT NULL,
    author      VARCHAR(120) NOT NULL,
    cover       VARCHAR(255) NOT NULL,           -- relative path to the uploaded image
    pages       VARCHAR(20)  NOT NULL,           -- "0-100", "100-200", "200-300", "300-400", "400+"
    genres      VARCHAR(255) NOT NULL,           -- comma-separated ("Fiction,Classics")
    quality     ENUM('New','Very Good','Good','Acceptable','Low Quality') NOT NULL,
    price       DECIMAL(7,2) NOT NULL,
    info        TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_books_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);


-- 4. commande  (orders : one row per book bought by a user)
CREATE TABLE commande (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,                    -- the buyer
    book_id     INT NOT NULL,                    -- the bought book
    bought_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cmd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cmd_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);


-- 5. handy indexes for the catalog filters
CREATE INDEX idx_books_quality ON books(quality);
CREATE INDEX idx_books_pages   ON books(pages);
