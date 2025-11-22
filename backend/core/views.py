from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from django.db import transaction, IntegrityError
from .models import User, Icone, IconeComprado, Post, PostRuido, PostAreaVerde
from .serializers import (
    UserSerializer,
    IconeSerializer,
    IconeCompradoSerializer,
    PostSerializer,
    PostRuidoSerializer,
    PostAreaVerdeSerializer,
)
# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    # User ordenado pro ranking lmao
    @action (detail=False, methods=["get"])
    def ranking(self, request):
        ranking = User.objects.all().order_by('-streak')
        serializer = self.get_serializer(ranking, many=True)
        return Response(serializer.data)

class IconeViewSet(viewsets.ModelViewSet):
    queryset = Icone.objects.all()
    serializer_class = IconeSerializer

    # Vai criar o endpoint para mostrar apenas os ícones não comprados pelo usuário na loja!
    @action (detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def disponiveis(self, request):
        ids_comprados = IconeComprado.objects.filter(user=request.user).values_list("icone_id", flat=True)
        qs = Icone.objects.exclude(id__in=ids_comprados)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    # Action de compra: vai criar o endpoint POST  /api/icones/pk/comprar
    @action (detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def comprar(self, request, pk=None):
        icone = self.get_object()
        user = request.user

        try:
            with transaction.atomic():
                # perez core: bloqueia o usuário e evita condição de corrida
                user_locked = User.objects.select_for_update().get(pk=user.pk)

                if IconeComprado.objects.filter(user=user_locked, icone=icone).exists():
                    return Response({"detail": "Você já comprou esse ícone!"}, status=400)

                if user_locked.moedas < icone.preco:
                    return Response({"detail": "Saldo insuficiente!"}, status=400)

                user_locked.moedas -= icone.preco
                user_locked.save()

                IconeComprado.objects.create(user=user_locked, icone=icone)

        except IntegrityError:
            return Response({"detail": "Erro ao processar a compra! Tente novamente."}, status=400)

        return Response({"detail": "Compra realizada com sucesso!"}, status=200)

class IconeCompradoViewSet(viewsets.ModelViewSet):
    queryset = IconeComprado.objects.all()
    serializer_class = IconeCompradoSerializer

    @action (detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def meus_icones(self, request):
        icones = IconeComprado.objects.filter(user=request.user)
        serializer = self.get_serializer(icones, many=True)
        return Response(serializer.data)



class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    def create(self, request, *args, **kwargs):
        user = request.user
        resultado_recompensa = user.aplicar_recompensa()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save(user=user)

        response_data = self.get_serializer(post).data
        return Response({"post": response_data, "recompensa": resultado_recompensa}, status=201)


class PostRuidoViewSet(viewsets.ModelViewSet):
    queryset = PostRuido.objects.all()
    serializer_class = PostRuidoSerializer

    def create(self, request, *args, **kwargs):
        user = request.user
        resultado_recompensa = user.aplicar_recompensa()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save(user=user)

        response_data = self.get_serializer(post).data
        return Response({"post": response_data, "recompensa": resultado_recompensa}, status=201)

class PostAreaVerdeViewSet(viewsets.ModelViewSet):
    queryset = PostAreaVerde.objects.all()
    serializer_class = PostAreaVerdeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]  # só usuários autenticados

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
