SELECT title, rating
FROM movies JOIN ratings ON movies.id = ratings.movie_id
WHERE movies.id = ratings.movie_id AND year = '2010'
ORDER BY rating DESC, title ASC;
