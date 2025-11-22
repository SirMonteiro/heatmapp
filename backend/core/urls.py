from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    IconeViewSet,
    IconeCompradoViewSet,
    PostViewSet,
    PostRuidoViewSet,
    PostAreaVerdeViewSet,
    CurrentUserView,
)

router = DefaultRouter()
router.register(r'usuarios', UserViewSet)
router.register(r'icones', IconeViewSet)
router.register(r'icones_comprados', IconeCompradoViewSet)
router.register(r'posts', PostViewSet)
router.register(r'posts_ruido', PostRuidoViewSet)
router.register(r'posts_areas', PostAreaVerdeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('current_user/', CurrentUserView.as_view(), name='current_user'),
]
