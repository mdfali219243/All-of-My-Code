from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from HomePage.api_views import _user_search_score, _post_search_score
from HomePage.models import VideoPost


class SearchRelevanceTests(TestCase):
    def test_user_score_prefers_exact_username(self):
        exact = User(username='foysal')
        partial = User(username='mdfoysalali')
        self.assertGreater(_user_search_score(exact, 'foysal'), _user_search_score(partial, 'foysal'))

    def test_user_score_prefers_starts_with_over_contains(self):
        starts = User(username='foysal_king')
        contains = User(username='king_foysal')
        self.assertGreater(_user_search_score(starts, 'foysal'), _user_search_score(contains, 'foysal'))

    def test_user_score_matches_partial_username(self):
        user = User(username='mdfoysalali')
        self.assertGreater(_user_search_score(user, 'foysal'), 0)

    def test_post_score_prefers_exact_caption(self):
        exact = VideoPost(caption='foysal')
        partial = VideoPost(caption='about foysal debate')
        self.assertGreater(_post_search_score(exact, 'foysal'), _post_search_score(partial, 'foysal'))


class SearchViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.auth_user = User.objects.create_user(username='searcher', password='pass1234')
        User.objects.create_user(username='foysal', password='pass1234')
        User.objects.create_user(username='mdfoysalali', password='pass1234')
        User.objects.create_user(username='King_Foysal', password='pass1234')
        User.objects.create_user(username='other', password='pass1234')
        self.client.force_authenticate(user=self.auth_user)

    def test_requires_authentication(self):
        client = APIClient()
        response = client.get('/api/search/', {'q': 'foysal'})
        self.assertEqual(response.status_code, 401)

    def test_short_query_returns_empty(self):
        response = self.client.get('/api/search/', {'q': 'f'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['users'], [])

    def test_foysal_ranks_exact_before_partial(self):
        response = self.client.get('/api/search/', {'q': 'foysal'})
        self.assertEqual(response.status_code, 200)
        usernames = [u['username'] for u in response.data['users']]
        self.assertIn('foysal', usernames)
        self.assertIn('mdfoysalali', usernames)
        self.assertIn('King_Foysal', usernames)
        self.assertEqual(usernames[0], 'foysal')
        self.assertNotIn('other', usernames)
