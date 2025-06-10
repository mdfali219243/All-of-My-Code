SELECT AVG(rating) FROM movies JOIN ratings WHERE movies.id = ratings.movie_id AND year = '2012';
