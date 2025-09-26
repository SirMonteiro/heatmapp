# Welcome to Heatmapp source code repository!

> Here contains some instructions and information for the subject of solutions of problems (RP2) at University of São Paulo (USP).

## Proposta
Desenvolver uma aplicação móvel que permita que usuários possam contribuir com informações relacionadas a nível de ruído, sintomas e áreas verdes associados a sua localização atual.
Tais informações serão processadas para gerar um mapa de calor que pode ser consultado por outras pessoas, permitindo que se preparem melhor para enfrentar as diferentes condições que surgem na cidade.

## Integrantes

| Nome                                 | Número USP |
|--------------------------------------|------------|
| Gabriel Dimant                       | 14653248   |
| Gabriel Monteiro de Souza            | 14746450   |
| Gabriela Pinheiro Almeida Dantas     | 14573249   |
| Ricardo Miranda Cordovil Filho       | 14658257   |

## Como rodar o projeto

Essas instruções tem como objetivo ajudar a rodar o código assumindo que esteja em um GNU/Linux ou MacOS rodando o bash ou zsh.
Para seguir as instruções garanta que você tenha o git, curl, e no caso do MacOS adicionalmente o brew.

1. Garanta que você tenha o [mise-en-place](https://mise.jdx.dev/), caso não instale com:

```sh
curl https://mise.run | sh
CURRENT_SHELL=$(basename $SHELL) echo 'eval "$(~/.local/bin/mise activate '$CURRENT_SHELL')" ' >> ~/."$CURRENT_SHELL"rc
```

MACOS:

```sh
brew install mise
CURRENT_SHELL=$(basename $SHELL) echo 'eval "$(~/.local/bin/mise activate '$CURRENT_SHELL')" ' >> ~/."$CURRENT_SHELL"rc
```

2. Clone o repositório:

```sh
git clone https://github.com/SirMonteiro/heatmapp
cd heatmapp
```

3. Instale as dependências:

```sh
mise install
mise run install
```

4. Caso for testar nas plataformas iOS ou Android, siga as instruções de configuração do [React Native Environment Setup](https://reactnative.dev/docs/environment-setup). Em resumo você precisará instalar o Xcode (iOS) ou Android Studio (Android).

5. Rode o projeto:

```sh
mise start
```

Para também compilar e instalar no Android, rode:

```sh
mise android
```

caso não fucione, tente:

```sh
mise -E linux android
```

ou, no MacOS:

```sh
mise -E macos android
```


## More information from boilerplate

This is the boilerplate that [Infinite Red](https://infinite.red) uses as a way to test bleeding-edge changes to our React Native stack.

- [Quick start documentation](https://github.com/infinitered/ignite/blob/master/docs/boilerplate/Boilerplate.md)
- [Full documentation](https://github.com/infinitered/ignite/blob/master/docs/README.md)

### Getting Started

To make things work on your local simulator, or on your phone, you need first to [run `eas build`](https://github.com/infinitered/ignite/blob/master/docs/expo/EAS.md). We have many shortcuts on `package.json` to make it easier:

```bash
npm run build:ios:sim # build for ios simulator
npm run build:ios:dev # build for ios device
npm run build:ios:prod # build for ios device
```

#### `./assets` directory

This directory is designed to organize and store various assets, making it easy for you to manage and use them in your application. The assets are further categorized into subdirectories, including `icons` and `images`:

```tree
assets
├── icons
└── images
```

**icons**
This is where your icon assets will live. These icons can be used for buttons, navigation elements, or any other UI components. The recommended format for icons is PNG, but other formats can be used as well.

Ignite comes with a built-in `Icon` component. You can find detailed usage instructions in the [docs](https://github.com/infinitered/ignite/blob/master/docs/boilerplate/app/components/Icon.md).

**images**
This is where your images will live, such as background images, logos, or any other graphics. You can use various formats such as PNG, JPEG, or GIF for your images.

Another valuable built-in component within Ignite is the `AutoImage` component. You can find detailed usage instructions in the [docs](https://github.com/infinitered/ignite/blob/master/docs/Components-AutoImage.md).

How to use your `icon` or `image` assets:

```typescript
import { Image } from 'react-native';

const MyComponent = () => {
  return (
    <Image source={require('assets/images/my_image.png')} />
  );
};
```

### Running Maestro end-to-end tests

Follow our [Maestro Setup](https://ignitecookbook.com/docs/recipes/MaestroSetup) recipe.

### Next Steps

#### Ignite Cookbook

[Ignite Cookbook](https://ignitecookbook.com/) is an easy way for developers to browse and share code snippets (or “recipes”) that actually work.

#### Upgrade Ignite boilerplate

Read our [Upgrade Guide](https://ignitecookbook.com/docs/recipes/UpdatingIgnite) to learn how to upgrade your Ignite project.\
