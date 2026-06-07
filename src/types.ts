export type UserRole = 'admin' | 'garcom' | 'cliente';
export type TableStatus = 'livre' | 'reservada' | 'ocupada' | 'cancelada';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: unknown;
}

export interface RestaurantTable {
  number: number;
  seats: number;
  area: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Entrada' | 'Prato' | 'Bebida' | 'Sobremesa';
  description: string;
  price: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Reservation {
  id: string;
  createdBy: string;
  customerName: string;
  customerPhone: string;
  tableNumber: number;
  guests: number;
  date: string;
  time: string;
  notes: string;
  status: TableStatus;
  orderItems: OrderItem[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AppNotification {
  id: string;
  userId: string;
  reservationId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: unknown;
}

export interface ReservationForm {
  customerName: string;
  customerPhone: string;
  tableNumber: number;
  guests: number;
  date: string;
  time: string;
  notes: string;
  status: TableStatus;
  orderItems: OrderItem[];
}

export const RESTAURANT_TABLES: RestaurantTable[] = [
  { number: 1, seats: 2, area: 'Janela' },
  { number: 2, seats: 2, area: 'Janela' },
  { number: 3, seats: 4, area: 'Salao' },
  { number: 4, seats: 4, area: 'Salao' },
  { number: 5, seats: 4, area: 'Salao' },
  { number: 6, seats: 6, area: 'Salao' },
  { number: 7, seats: 6, area: 'Varanda' },
  { number: 8, seats: 8, area: 'Varanda' },
  { number: 9, seats: 2, area: 'Bar' },
  { number: 10, seats: 2, area: 'Bar' },
  { number: 11, seats: 10, area: 'Eventos' },
  { number: 12, seats: 12, area: 'Eventos' },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'bruschetta',
    name: 'Bruschetta da Casa',
    category: 'Entrada',
    description: 'Pao tostado, tomate fresco, manjericao e azeite.',
    price: 24,
  },
  {
    id: 'salada-caprese',
    name: 'Salada Caprese',
    category: 'Entrada',
    description: 'Mucarela, tomate, pesto e folhas frescas.',
    price: 32,
  },
  {
    id: 'risoto-funghi',
    name: 'Risoto de Funghi',
    category: 'Prato',
    description: 'Arroz arboreo, funghi, parmesao e manteiga.',
    price: 58,
  },
  {
    id: 'file-molho-vinho',
    name: 'File ao Molho de Vinho',
    category: 'Prato',
    description: 'File grelhado, molho encorpado e batatas rusticas.',
    price: 72,
  },
  {
    id: 'massa-pesto',
    name: 'Massa ao Pesto',
    category: 'Prato',
    description: 'Massa fresca com pesto, castanhas e parmesao.',
    price: 49,
  },
  {
    id: 'agua',
    name: 'Agua Mineral',
    category: 'Bebida',
    description: 'Com ou sem gas.',
    price: 8,
  },
  {
    id: 'suco-uva',
    name: 'Suco de Uva Integral',
    category: 'Bebida',
    description: 'Taça individual.',
    price: 14,
  },
  {
    id: 'tiramisu',
    name: 'Tiramisu',
    category: 'Sobremesa',
    description: 'Creme mascarpone, cafe e cacau.',
    price: 28,
  },
  {
    id: 'pudim',
    name: 'Pudim de Leite',
    category: 'Sobremesa',
    description: 'Calda de caramelo artesanal.',
    price: 22,
  },
];
