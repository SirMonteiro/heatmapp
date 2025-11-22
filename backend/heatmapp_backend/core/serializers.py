from rest_framework import serializers
from .models import User, Icone, IconeComprado, Post, PostRuido


class IconeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Icone
        fields = ['id', 'titulo', 'descricao', 'preco']


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.CharField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'password', 'streak', 'moedas', 'id_icone']

    def create(self, validated_data):
        password=validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class IconeCompradoSerializer(serializers.ModelSerializer):
    class Meta:
        model = IconeComprado
        fields = ['user', 'icone']


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = "__all__"

    def create(self, validated_data):
        user = self.context["request"].user
        resultado = user.aplicar_recompensa()
        print("RESULTADO DA RECOMPENSA:", resultado)
        post = Post.objects.create(user=user, **validated_data)
        post.moedas_ganhas = resultado["moedas_ganhas"]
        post.aumentou_streak = resultado["aumentou_streak"]
        return post


class PostRuidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostRuido
        fields = ['id', 'user', 'local_latitude', 'local_longitude', 'local_data', 'decibeis']
