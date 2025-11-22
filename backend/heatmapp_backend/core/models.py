from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.utils import timezone
# Create your models here.

MAX_RECOMPENSA = 50

class Icone (models.Model):
    titulo = models.CharField(max_length=100)
    descricao = models.TextField()
    preco = models.IntegerField()

    def __str__(self):
        return self.titulo
    
class User(AbstractUser):
    username_validator = UnicodeUsernameValidator()
    username = models.CharField(
        max_length=15,
        unique=True,
        validators=[username_validator],
        error_messages={
            "unique": "Já existe um usuário com este nome.",
        },
    )

    streak = models.IntegerField(default=0)
    moedas = models.IntegerField(default=5)
    email = models.EmailField(
        unique=True,
        error_messages={
            "unique": "Este e-mail já está cadastrado.",
        },
    )
    id_icone = models.ForeignKey(Icone, on_delete=models.SET_NULL,
                                 null=True, blank=True)
    
    def __str__(self):
        return self.username
    
    def aplicar_recompensa(self):
        hoje = timezone.localdate()
        postou_hoje = Post.objects.filter(user = self, local_data = hoje).exists()

        if postou_hoje:
            self.moedas += 1
            self.save()
            return {
                "aumentou_streak": False,
                "moedas_ganhas": 1
            }
        # primeiro post do dia
        recompensa = min(MAX_RECOMPENSA, self.streak + 1)
        self.moedas += recompensa
        self.streak += 1
        self.save()

        return {
                "aumentou_streak": True,
                "moedas_ganhas": recompensa
            }

class IconeComprado(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    icone = models.ForeignKey(Icone, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'icone')

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    local_latitude = models.FloatField()
    local_longitude = models.FloatField()
    local_data = models.DateField(auto_now_add=True)

class PostRuido(Post):
    decibeis = models.FloatField()
