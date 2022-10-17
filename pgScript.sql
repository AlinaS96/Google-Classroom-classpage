CREATE TABLE IF NOT EXISTS Users(
id serial PRIMARY KEY,
email VARCHAR(50)  NOT NULL UNIQUE,
username VARCHAR(60),
password VARCHAR(100)
);

CREATE TABLE class (
  id serial,
  title VARCHAR(100) NOT NULL,
  teacher_id int NOT NULL  REFERENCES Users(id) ON DELETE CASCADE ,
  creation_date timestamp DEFAULT CURRENT_TIMESTAMP,
  class_code int NOT NULL
  PRIMARY KEY (id)
);



--DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
  id serial,
  user_id int NOT NULL REFERENCES Users(id) ON DELETE CASCADE ,
 class_id int NOT NULL,
content VARCHAR(1000),
posted_date timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
  FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE
);

--DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
id serial,
  user_id int NOT NULL,
  class_id int NOT NULL,
  post_id int NOT NULL,
 content VARCHAR(1000),
commented_date timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE ,
 FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
PRIMARY KEY (id)
);

CREATE TABLE class_users(
  user_id int NOT NULL,
  class_id int NOT NULL,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE ,
 FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE,
 PRIMARY KEY (user_id,class_id);
);
