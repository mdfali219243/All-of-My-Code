from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.login_url = reverse('login')
        self.register_url = reverse('register')
        self.home_url = reverse('home')
        self.logout_url = reverse('logout')

    def test_login_page_loads(self):
        response = self.client.get(self.login_url)
        self.assertEqual(response.status_code, 200)

    def test_register_page_loads(self):
        response = self.client.get(self.register_url)
        self.assertEqual(response.status_code, 200)

    def test_home_page_requires_login(self):
        response = self.client.get(self.home_url)
        self.assertRedirects(response, f"{self.login_url}?next={self.home_url}")

    def test_login_successful(self):
        response = self.client.post(self.login_url, {'username': 'testuser', 'password': 'testpassword'})
        self.assertRedirects(response, self.home_url)

    def test_logout_successful(self):
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get(self.logout_url)
        self.assertRedirects(response, self.login_url)
