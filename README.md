# MesaRapida

Aplicacao web feita com Vue 3, TypeScript e Firebase para controle de reservas de mesas de restaurante.

## Funcionalidades

- Cadastro de usuario com e-mail e senha.
- Login e logout via Firebase Authentication.
- Controle de acesso com perfis:
  - Cliente: visualiza as mesas livres e escolhe uma mesa para reservar.
  - Garcom: acessa todas as mesas e visualiza quais estao livres, reservadas ou lotadas.
  - Admin: acessa tudo e pode inserir, consultar, atualizar e excluir reservas.
- Cloud Firestore em tempo real.
- Mapa visual com 12 mesas do restaurante.
- Cliente ve apenas as mesas disponiveis para escolher.
- Cardapio com entradas, pratos, bebidas e sobremesas.
- Reserva com pedidos selecionados pelo cliente.
- Garcom recebe a reserva em tempo real no painel, com mesa reservada e resumo do pedido.
- Garcom filtra reservas por data e horario e pode finalizar uma reserva para liberar a mesa.
- Garcom pode avisar que esta indo atender, gerando notificacao para o cliente.
- Firebase Cloud Messaging coleta token do navegador/celular para push notifications.
- Admin visualiza informacoes dos clientes e funcionarios cadastrados.
- CRUD completo para o Admin na colecao `reservas_restaurante`.

## Como executar

1. Instale as dependencias:

```bash
npm install
```

2. Confira o arquivo `.env` com as credenciais do Firebase.

3. Ative no Firebase Console:

- Authentication com provedor E-mail/senha.
- Cloud Firestore.

4. Execute o projeto:

```bash
npm run dev
```

## Colecoes Firestore

### `usuarios`

Cada usuario cadastrado salva:

- `name`
- `email`
- `role`: `cliente`, `garcom` ou `admin`
- `createdAt`

### `reservas_restaurante`

Cada reserva salva:

- `createdBy`
- `customerName`
- `customerPhone`
- `tableNumber`
- `guests`
- `date`
- `time`
- `notes`
- `orderItems`: itens do pedido com nome, quantidade e preco unitario
- `status`: `livre`, `reservada`, `ocupada` ou `cancelada`
- `createdAt`
- `updatedAt`

### `notificacoes`

Cada notificacao salva:

- `userId`
- `reservationId`
- `title`
- `message`
- `read`
- `createdAt`

### `usuarios/{userId}/dispositivos/web`

Salva o token FCM do navegador/celular:

- `token`
- `updatedAt`

## Regras sugeridas do Firestore

Para a entrega do projeto, estas regras permitem qualquer usuario autenticado criar
reserva, clientes lerem as proprias reservas e garcons/admins acompanharem todas.
Em producao, refine as validacoes de campos conforme a necessidade.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function profile() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return signedIn() && profile().role == 'admin';
    }

    function isWaiter() {
      return signedIn() && profile().role == 'garcom';
    }

    function isClient() {
      return signedIn() && profile().role == 'cliente';
    }

    match /usuarios/{userId} {
      allow create: if signedIn() && request.auth.uid == userId;
      allow read: if signedIn() && (request.auth.uid == userId || isAdmin());
      allow update, delete: if isAdmin();

      match /dispositivos/{deviceId} {
        allow read, write: if signedIn() && request.auth.uid == userId;
      }
    }

    match /reservas_restaurante/{reservaId} {
      allow create: if signedIn()
        && request.resource.data.createdBy == request.auth.uid;

      allow read: if signedIn()
        && (resource.data.createdBy == request.auth.uid || isWaiter() || isAdmin());

      allow delete: if isAdmin();
      allow update: if isAdmin() || isWaiter();
    }

    match /notificacoes/{notificacaoId} {
      allow create: if signedIn();
      allow read, update: if signedIn() && resource.data.userId == request.auth.uid;
      allow delete: if isAdmin();
    }
  }
}
```
