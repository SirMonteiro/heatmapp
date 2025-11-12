from django.core.management.base import BaseCommand
from core.models import Icone

class Command(BaseCommand):
    help = "Popula a tabela Icones com esses ícones padrão (a maioria é de gatos meu deus do ceu)."
        
    def handle (self, *args, **options):
        icones = [
            {
                "titulo": "Ícone Gato Língua",
                "descricao": "Customize seu perfil com esse ícone de gato!",
                "preco": 5,
            },
            {
                "titulo": "Ícone Gato Sentido",
                "descricao": "Customize seu perfil com esse ícone de gato disciplinado!",
                "preco": 10,
            },
            {
                "titulo": "Ícone Gato em Recuperação",
                "descricao": "Customize seu perfil com esse ícone de gato que foi mal na prova de Cálculo 2...",
                "preco": 15,
            },
            {
                "titulo": "Ícone Gato Bobo",
                "descricao": "Customize seu perfil com esse ícone de gato bobo!",
                "preco": 20,
            },
            {
                "titulo": "Ícone Gato Bobo 2",
                "descricao": "Customize seu perfil com esse ícone de bobo!",
                "preco": 25,
            },
            {
                "titulo": "Ícone Gato Estudioso",
                "descricao": "Customize seu perfil com esse ícone de gato que estuda para a prova de Cálculo 2!",
                "preco": 50,
            },
            {
                "titulo": "Ícone Bocchi",
                "descricao": "Customize seu perfil com esse ícone ansioso...",
                "preco": 200,
            },
            {
                "titulo": "Ícone Gato Lendário",
                "descricao": "Customize seu perfil com o melhor ícone de todos!",
                "preco": 2000,
            },
        ]

        for icone_data in icones:
            icone, created = Icone.objects.get_or_create(**icone_data)
            if created:
                    self.stdout.write(self.style.SUCCESS(f'Ícone "{icone.titulo}" criado!'))
            else:
                    self.stdout.write(f'Ícone "{icone.titulo}" já existe.')