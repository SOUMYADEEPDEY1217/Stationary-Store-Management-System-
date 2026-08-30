# Security Specification

## 1. Data Invariants
- Admin users have administrative privileges across products, staff management, sales, and analytics.
- Staff users have billing access, product viewing, sales generation, and customer management.
- Product documents require positive prices, non-negative quantities, and valid names.
- Sales transactions must record valid line items, payment methods, non-negative totals, and immutable invoice numbers.

## 2. Payloads & Invariants
- Users can view and manage products and sales if authenticated.
- Role integrity ensures staff cannot escalate themselves to admin without administrative authorization.
