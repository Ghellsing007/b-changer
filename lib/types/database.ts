export type UserRole = "admin" | "staff" | "seller" | "customer"
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"
export type LoanStatus = "reserved" | "checked_out" | "returned" | "overdue" | "lost" | "cancelled"
export type ListingType = "sale" | "loan"
export type BookFormat = "hardcover" | "paperback" | "ebook" | "audiobook"

export interface Profile {
  user_id: string
  role: UserRole
  display_name?: string
  username?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  user_id: string
  line1: string
  line2?: string
  city: string
  state?: string
  postal_code?: string
  country_code?: string
  created_at: string
  updated_at: string
}

export interface Author {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Publisher {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Book {
  id: string
  title: string
  description?: string
  category_id?: string
  created_at: string
  updated_at: string
}

export interface Edition {
  id: string
  book_id: string
  publisher_id?: string
  format: BookFormat
  isbn?: string
  publication_date?: string
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  seller_id: string
  edition_id: string
  type: ListingType
  price?: number
  quantity: number
  daily_fee?: number
  max_days?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Cart {
  id: string
  user_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  cart_id: string
  listing_id: string
  quantity: number
  created_at: string
}

export interface Order {
  id: string
  buyer_id: string
  status: OrderStatus
  payment_status: PaymentStatus
  subtotal: number
  total: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  listing_id: string
  seller_id: string
  edition_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Payment {
  id: string
  order_id: string
  provider: string
  reference?: string
  status: PaymentStatus
  amount: number
  created_at: string
}

export interface Loan {
  id: string
  listing_id: string
  lender_id: string
  borrower_id: string
  status: LoanStatus
  start_date?: string
  due_date?: string
  returned_at?: string
  days?: number
  daily_fee?: number
  fine_amount?: number
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  listing_id: string
  borrower_id: string
  created_at: string
  expires_at?: string
}

export interface Fine {
  id: string
  loan_id: string
  reason?: string
  amount: number
  paid: boolean
  created_at: string
}

export interface ProductReview {
  id: string
  reviewer_id: string
  edition_id: string
  rating: number
  body?: string
  created_at: string
  updated_at: string
}

export interface Wishlist {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface WishlistItem {
  id: string
  wishlist_id: string
  edition_id: string
  created_at: string
}
