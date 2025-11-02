from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import User, Icone, IconeComprado, Post, PostRuido
from .serializers import UserSerializer, IconeSerializer, IconeCompradoSerializer, PostSerializer, PostRuidoSerializer
# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class IconeViewSet(viewsets.ModelViewSet):
    queryset = Icone.objects.all()
    serializer_class = IconeSerializer


class IconeCompradoViewSet(viewsets.ModelViewSet):
    queryset = IconeComprado.objects.all()
    serializer_class = IconeCompradoSerializer


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer


class PostRuidoViewSet(viewsets.ModelViewSet):
    queryset = PostRuido.objects.all()
    serializer_class = PostRuidoSerializer


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]  # só usuários autenticados

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)