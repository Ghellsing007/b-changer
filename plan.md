# Informe de Diseño de Componentes de Software para b-changer

## INTRODUCCIÓN

El proyecto b-changer es una aplicación web desarrollada con Next.js y Supabase para la gestión de libros, permitiendo funcionalidades como catálogo, ventas, préstamos, carrito de compras, panel de admin y autenticación. Este informe presenta el diseño completo de los componentes de software, dividido en dos partes: la estructura UI y la lógica de negocio. El enfoque es en la modularidad, siguiendo principios como SRP (Single Responsibility Principle) y límites de líneas de código para reducir propensión a errores y facilitar el mantenimiento.

## Objetivo General

Diseñar una arquitectura modular y escalable de componentes UI y lógica de negocio para la aplicación b-changer, integrando primitivos reutilizables con Supabase para operaciones de base de datos, asegurando alta cohesión, bajo acoplamiento y facilidad de implementación y testing.

## Objetivos Específicos

- Analizar los componentes existentes en components/, ui/, hooks/ y lib/ para identificar fortalezas y áreas de mejora en modularidad y tamaño de archivos.
- Identificar y proponer componentes, hooks y servicios faltantes o a refactorizar, como BookCard para UI, useBooks para queries y BookService para lógica de negocio.
- Visualizar la arquitectura general mediante un diagrama Mermaid que muestre jerarquía, flujos y capas (UI, Lógica, Data).
- Documentar diseños clave con ejemplos de código, props/estados y beneficios, manteniendo cada unidad <100 líneas para cumplir con estándares modulares.
- Proporcionar una opinión sobre el diseño, destacando beneficios en mantenibilidad y reducción de errores.

## Explicación del Diseño

El diseño se estructura en plan.md como un documento integral. Comienza con la introducción y objetivos, seguido de la arquitectura visualizada en un diagrama Mermaid que evoluciona desde la primera parte (UI: Layout > Navigation > MainContent con BookCard, Forms descompuestos, conectados a UI Primitives) a la segunda (Lógica: Hooks como useBooks/useCart y Servicios como BookService, enlazados a Data Layer Supabase). Las secciones de diseño detallan componentes UI (e.g., BookCard stateless <60 líneas) y lógica (e.g., useBooks con useEffect para fetch <40 líneas), con ejemplos de código que ilustran props, estados y manejo de errores. Esto permite una implementación secuencial: crear UI primero, luego integrar lógica, asegurando que cada pieza sea independiente y testable.

## Opinión

Este diseño es robusto y alineado con mejores prácticas de desarrollo web, promoviendo la modularización estricta (archivos <100 líneas, funciones <25) que reduce significativamente la propensión a errores al aislar responsabilidades y facilitar debugging. La integración con Supabase a través de servicios centralizados evita duplicación de código y mejora la escalabilidad, mientras que los hooks reutilizables optimizan el rendimiento en el client-side. En general, facilita que el desarrollador implemente solo, enseñando conceptos clave como tipado TypeScript y separación de capas. Recomiendo proceder a la implementación en modo code para validar y expandir.

# Diseño de Componentes de Software - Primera Parte (UI y Estructura)


## Introducción
Este documento presenta el diseño inicial de los componentes de software para la aplicación b-changer, enfocándonos en la modularidad y reutilización. Siguiendo principios de SRP (Single Responsibility Principle), cada componente mantendrá menos de 100 líneas de código, con alta cohesión interna y bajo acoplamiento. Los componentes UI reutilizables se basan en la carpeta `components/ui/` (primitivos como Button, Card, Input), mientras que los específicos del dominio (e.g., BookCard, CartItemCard) están en `components/`.

El diseño se visualiza mediante un diagrama Mermaid que muestra la jerarquía y flujos clave, ayudando a entender cómo se integran los componentes para reducir propensión a errores (e.g., evitando dependencias circulares).

## Arquitectura General de Componentes

```mermaid
graph TD
    A[Layout.tsx] --> B[Navigation<br/>- MobileHeader<br/>- BottomNavigation<br/>- SearchBar]
    A --> C[MainContent<br/>- CatalogPage<br/>-- BookList<br/>--- BookCard<br/>- DashboardPage<br/>- AdminPanel<br/>-- UserList<br/>-- OrderTable]
    A --> D[Forms & Actions<br/>- BookUploadForm<br/>-- PdfUploader<br/>-- CoverUploader<br/>-- FormSubmit<br/>- LendBookForm<br/>- SellBookForm<br/>- AddToCartButton<br/>- RequestLoanButton<br/>- CheckoutButton]
    B --> E[UI Primitives<br/>- Button<br/>- Card<br/>- Input<br/>- Select<br/>- Dialog<br/>- Table]
    C --> E
    D --> E
    C --> L[Logic Layer<br/>- Hooks: useBooks, useCart<br/>- Services: BookService, UserService]
    D --> L
    L --> M[Data Layer<br/>Supabase DB<br/>- client.ts<br/>- server.ts]
    F[Flujo Carrito] --> G[BookCard --> useBooks --> AddToCartButton --> useCart --> CheckoutButton]
    H[Flujo Admin] --> I[AdminPage --> UserList/Table --> useUsers --> Actions (Edit/Ban)]
    J[Flujo Préstamo] --> K[BookCard --> RequestLoanButton --> useLoans --> LendBookForm]
```

### Explicación del Diagrama
- **Jerarquía**: Layout es el contenedor raíz que integra navegación y contenido principal. Los formularios y acciones se componen de subcomponentes pequeños para modularidad.
- **Flujos**: Muestran interacciones secuenciales, e.g., desde visualización de libro (BookCard) a acción (AddToCartButton), promoviendo reutilización de UI primitives.
- **Modularización**: Componentes grandes existentes (e.g., BookUploadForm >150 líneas) se descomponen en subcomponentes independientes, cada uno <50 líneas, exportados desde index.ts para interfaces claras.
- **Beneficios**: Reduce errores al aislar responsabilidades (e.g., PdfUploader solo maneja subida de PDF, no validación general), facilita testing (mock solo el subcomponente) y mantenimiento.

## Diseño de Componentes Clave

### BookCard
- **Propósito**: Muestra un libro individual en el catálogo o wishlist, con imagen, título, autor, precio, condición y botones de acción (e.g., AddToCartButton).
- **Props**: interface BookCardProps { book: { id: string; title: string; author: string; coverUrl: string; price: number; condition: string; }; onAddToCart?: (id: string) => void; }
- **Estados**: Ninguno (stateless, pasa callbacks para acciones).
- **Modularización**: <60 líneas. Usa Card de ui/, AspectRatio para imagen, Badge para condición, Button para acciones. Exporta desde components/index.ts.
- **Ejemplo de estructura**:
  ```tsx
  export function BookCard({ book, onAddToCart }: BookCardProps) {
    return (
      <Card>
        <CardHeader>
          <AspectRatio ratio={3/4}>
            <Image src={book.coverUrl} alt={book.title} />
          </AspectRatio>
          <CardTitle>{book.title}</CardTitle>
          <CardDescription>{book.author}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={book.condition === 'new' ? 'default' : 'secondary'}>{book.condition}</Badge>
          <p>${book.price}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => onAddToCart?.(book.id)}>Agregar al Carrito</Button>
        </CardFooter>
      </Card>
    );
  }
  ```
- **Beneficios**: Reutiliza UI primitives, tipado estricto previene errores en props, fácil de testear (renderiza con mocks de imagen).

### UserProfile
- **Propósito**: Muestra y permite editar perfil de usuario en dashboard o auth pages.
- **Props**: interface UserProfileProps { user: { id: string; name: string; email: string; avatarUrl?: string; }; onUpdate?: (updatedUser: Partial<User>) => void; }
- **Estados**: useState para edición local (e.g., editingName: string).
- **Modularización**: <50 líneas. Usa Avatar, Input, Button de ui/. Hook separado si lógica crece.
- **Ejemplo de estructura**:
  ```tsx
  "use client"
  import { useState } from 'react';
  export function UserProfile({ user, onUpdate }: UserProfileProps) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const handleSave = () => { onUpdate?.({ name }); setEditing(false); };
    return (
      <Card>
        <CardHeader>
          <Avatar src={user.avatarUrl} />
          {editing ? <Input value={name} onChange={(e) => setName(e.target.value)} /> : <CardTitle>{user.name}</CardTitle>}
        </CardHeader>
        <CardContent>
          <p>{user.email}</p>
        </CardContent>
        <CardFooter>
          {editing ? <Button onClick={handleSave}>Guardar</Button> : <Button onClick={() => setEditing(true)}>Editar</Button>}
        </CardFooter>
      </Card>
    );
  }
  ```
- **Beneficios**: Estado local aislado evita re-renders globales, validación en onUpdate reduce errores, modular para futuras expansiones (e.g., agregar PasswordChange).

## Diseño de Lógica de Negocio

### useBooks (Hook)
- **Propósito**: Maneja queries y mutaciones para libros desde Supabase, con estados loading/error/data para UI (e.g., en BookCard o CatalogPage).
- **Retornos**: { data: Book[]; loading: boolean; error: Error | null; refetch: () => void; }
- **Modularización**: <40 líneas. Usa useState para estados, useEffect para fetch inicial, createClient de lib/supabase. Caché simple con useMemo para evitar re-queries.
- **Ejemplo de estructura**:
  ```tsx
  "use client"
  import { useState, useEffect, useMemo } from 'react';
  import { createClient } from '@/lib/supabase/client';
  import type { Book } from '@/lib/types/database'; // Asumiendo tipos de DB
  export function useBooks() {
    const [data, setData] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const supabase = createClient();
    useEffect(() => {
      async function fetchBooks() {
        try {
          setLoading(true);
          const { data, error } = await supabase.from('books').select('*');
          if (error) throw error;
          setData(data || []);
        } catch (err) {
          setError(err as Error);
        } finally {
          setLoading(false);
        }
      }
      fetchBooks();
    }, []);
    const refetch = async () => { /* similar fetch */ };
    const cachedData = useMemo(() => data, [data]);
    return { data: cachedData, loading, error, refetch };
  }
  ```
- **Beneficios**: Centraliza queries (evita duplicación en componentes), maneja errores/ loading para UI consistente, fácil de testear con mocks de Supabase.

### useCart (Hook)
- **Propósito**: Gestiona estado del carrito (add/remove/update), persistiendo en localStorage para sesiones no autenticadas.
- **Retornos**: { items: CartItem[]; addItem: (item: CartItem) => void; removeItem: (id: string) => void; updateQuantity: (id: string, qty: number) => void; total: number; }
- **Modularización**: <30 líneas. Usa useState para items, useEffect para sync con localStorage.
- **Ejemplo de estructura**:
  ```tsx
  "use client"
  import { useState, useEffect } from 'react';
  interface CartItem { id: string; quantity: number; /* ... */ }
  export function useCart() {
    const [items, setItems] = useState<CartItem[]>(() => {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    });
    useEffect(() => {
      localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);
    const addItem = (item: CartItem) => setItems(prev => [...prev, item]);
    const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
    const updateQuantity = (id: string, qty: number) => setItems(prev => prev.map(i => i.id === id ? {...i, quantity: qty} : i));
    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    return { items, addItem, removeItem, updateQuantity, total };
  }
  ```
- **Beneficios**: Persistencia local reduce pérdida de data, funciones puras para add/update facilitan testing, integra con AddToCartButton sin acoplamiento.

### BookService (Servicio)
- **Propósito**: Lógica de negocio para libros (e.g., upload, calculateLoanFee), abstrae Supabase server/client.
- **Métodos**: uploadBook(bookData: BookData): Promise<Book>; calculateLoanFee(days: number, baseFee: number): number;
- **Modularización**: <50 líneas. Función pura para cálculos, async para DB con try/catch.
- **Ejemplo de estructura**:
  ```ts
  import { createClient } from '@/lib/supabase/server';
  import type { Book, BookData } from '@/lib/types/database';
  export class BookService {
    private supabase = createClient();
    async uploadBook(bookData: BookData): Promise<Book> {
      try {
        const { data, error } = await this.supabase.from('books').insert([bookData]).select().single();
        if (error) throw new Error(`Upload failed: ${error.message}`);
        return data;
      } catch (err) {
        throw new Error(`BookService Error: ${err.message}`);
      }
    }
    calculateLoanFee(days: number, baseFee: number): number {
      return days * baseFee; // Lógica simple, expandable
    }
  }
  ```
- **Beneficios**: Centraliza errores (custom Error para logging), separa lógica de UI/DB, reusable en server-side (e.g., API routes) y client-side, reduce propensión a errores en queries duplicadas.

## Próximos Pasos
Con esta documentación de la segunda parte (lógica de negocio), el diseño completo está listo. Procederemos a presentar y confirmar la implementación.
