from django.core.exceptions import ImproperlyConfigured
from rest_framework import serializers

from .models import User, Icone, IconeComprado, Post, PostRuido, PostAreaVerde
from .services.image_storage import upload_area_verde_image


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
        user = validated_data.pop('user', None) or self.context["request"].user
        post = Post.objects.create(user=user, **validated_data)
        return post


class PostRuidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostRuido
        fields = ['id', 'user', 'local_latitude', 'local_longitude', 'local_data', 'decibeis']


class PostAreaVerdeSerializer(serializers.ModelSerializer):
    imagem_base64 = serializers.CharField(write_only=True)
    imagem_content_type = serializers.CharField(write_only=True, required=False, allow_blank=True)
    imagem_nome = serializers.CharField()
    imagem_url = serializers.SerializerMethodField()

    class Meta:
        model = PostAreaVerde
        fields = [
            'id',
            'user',
            'local_latitude',
            'local_longitude',
            'created_at',
            'titulo',
            'modo_acesso',
            'descricao',
            'imagem_nome',
            'imagem_url',
            'imagem_base64',
            'imagem_content_type',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'imagem_url']

    def get_imagem_url(self, obj):
        return obj.imagem_url

    def create(self, validated_data):
        imagem_base64 = validated_data.pop('imagem_base64', None)
        imagem_content_type = validated_data.pop('imagem_content_type', None)
        imagem_nome = validated_data.get('imagem_nome')

        if not imagem_base64:
            raise serializers.ValidationError({'imagem_base64': 'Imagem é obrigatória.'})

        if not imagem_nome:
            raise serializers.ValidationError({'imagem_nome': 'Nome do arquivo é obrigatório.'})

        try:
            upload_area_verde_image(imagem_base64, imagem_nome, imagem_content_type)
        except (ValueError, RuntimeError, ImproperlyConfigured) as exc:
            raise serializers.ValidationError({'imagem_base64': str(exc)}) from exc

        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['user'] = request.user

        return super().create(validated_data)
