-- Cute Crew — run this once in MySQL Workbench (as root)
CREATE DATABASE IF NOT EXISTS cute_crew
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'cutecrew'@'localhost' IDENTIFIED BY 'aU0BuEmk4mh1yDNB';
ALTER USER 'cutecrew'@'localhost' IDENTIFIED BY 'aU0BuEmk4mh1yDNB';

GRANT ALL PRIVILEGES ON cute_crew.* TO 'cutecrew'@'localhost';
FLUSH PRIVILEGES;
