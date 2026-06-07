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
- Admin visualiza informacoes dos clientes e funcionarios cadastrados.
- CRUD completo para o Admin na colecao `reservas_restaurante`.


