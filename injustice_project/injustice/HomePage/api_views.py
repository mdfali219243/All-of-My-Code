from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import VideoPost, UserFollow
from .serializers import RegisterSerializer, UserSerializer, PostSerializer, ProfileSerializer


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'tokens': _tokens_for_user(user),
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    from django.contrib.auth import authenticate

    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'detail': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {'detail': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response({
        'user': UserSerializer(user).data,
        'tokens': _tokens_for_user(user),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def posts_view(request):
    posts = VideoPost.objects.select_related(
        'user', 'shared_from', 'shared_from__user'
    ).prefetch_related('likes', 'comments').order_by('-created_at')
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response({'posts': serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request, username):
    profile_user = User.objects.filter(username=username).first()
    if not profile_user:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    posts = VideoPost.objects.filter(user=profile_user).select_related(
        'shared_from', 'shared_from__user'
    ).prefetch_related('likes', 'comments').order_by('-created_at')

    data = {
        'user': UserSerializer(profile_user).data,
        'posts': PostSerializer(posts, many=True, context={'request': request}).data,
        'followers_count': UserFollow.objects.filter(following=profile_user).count(),
        'following_count': UserFollow.objects.filter(follower=profile_user).count(),
        'is_following': UserFollow.objects.filter(
            follower=request.user, following=profile_user
        ).exists(),
    }
    return Response(data)
