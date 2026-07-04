# Refund System Guide

This guide explains how to use the refund system for CactiStock.

## Overview

The refund system allows you to process partial or full refunds for customer orders via Stripe. It supports:
- **Full refunds**: Refund the entire order amount
- **Partial refunds**: Refund specific amounts (e.g., for damaged items)
- **Item restoration**: Mark refunded items as available again in inventory

## Accessing the Refund System

1. Log in to the admin panel at `/admin`
2. Navigate to `/admin/orders` (or add this link to your admin menu)
3. View all paid orders with search functionality

## Processing a Refund

### Step 1: Find the Order
- Use the search bar to find the order by:
  - Order ID
  - Customer name
  - Customer email

### Step 2: Click "Process Refund"
- Click the "Process Refund" button on the order card
- A refund dialog will open

### Step 3: Configure Refund

#### Select Items to Restore (Optional)
- Check the items that need to be marked as available again
- Click "Use Selected Items Total" to auto-fill the refund amount with the total of selected items
- This is useful when specific items are damaged/cannot be delivered

#### Enter Refund Amount
- Manually enter the refund amount in Thai Baht
- Maximum refundable amount is the order total
- Example: If order is ฿1000 and one item costs ฿100, enter 100

#### Provide Refund Reason
- Explain why the refund is being processed
- Examples:
  - "Damaged cactus - cannot deliver"
  - "Customer request - wrong item ordered"
  - "Out of stock - partial fulfillment"

### Step 4: Process Refund
- Click "Process Refund" button
- Stripe will process the refund to the original payment method
- Refund typically takes 5-10 business days to appear in customer's account

## Refund Status Tracking

Orders display different status badges:
- **Paid**: Order is fully paid, no refunds processed
- **Partially Refunded**: Partial refund processed (amber badge)
- **Fully Refunded**: Full refund processed (red badge)

## Example Use Cases

### Scenario 1: Damaged Item
**Situation**: Customer paid ฿1000 for 10 cacti, but 1 cactus (฿100) is damaged and cannot be delivered.

**Steps**:
1. Find the order
2. Click "Process Refund"
3. Select the damaged cactus in the items list
4. Click "Use Selected Items Total" (auto-fills ฿100)
5. Reason: "Damaged cactus - cannot deliver"
6. Process refund

**Result**:
- Customer receives ฿100 refund
- Damaged cactus marked as available again
- Order status: "Partially Refunded"

### Scenario 2: Full Order Refund
**Situation**: Customer wants to cancel entire order.

**Steps**:
1. Find the order
2. Click "Process Refund"
3. Enter full order amount (e.g., ฿1000)
4. Reason: "Customer cancellation request"
5. Process refund

**Result**:
- Customer receives full refund
- All items marked as available again
- Order status: "Fully Refunded"

### Scenario 3: Custom Partial Refund
**Situation**: You want to refund ฿50 as compensation for late delivery.

**Steps**:
1. Find the order
2. Click "Process Refund"
3. Enter ฿50 manually
4. Reason: "Compensation for late delivery"
5. Process refund

**Result**:
- Customer receives ฿50 refund
- Items remain as sold (delivered)
- Order status: "Partially Refunded"

## Important Notes

⚠️ **Refunds cannot be undone** once processed via Stripe

⚠️ **Refund timing**: Stripe processes refunds immediately, but it may take 5-10 business days for the refund to appear in the customer's bank account

⚠️ **Inventory management**: When you select items to restore, they will be marked as available again and can be purchased by other customers

⚠️ **Multiple refunds**: You can process multiple partial refunds for the same order, but the total cannot exceed the original payment amount

## Webhook Integration

The system automatically handles Stripe refund webhooks:
- Updates order refund status to "completed"
- Sends Telegram notification (if configured)
- Logs refund events for audit trail

## Environment Variables Required

Ensure these are set in your `.env` file:
```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Troubleshooting

### "No Stripe session found for this order"
- This means the order wasn't paid via Stripe
- Check if the order was paid via a different method

### "Order is not in paid status"
- The order has already been refunded or has a different status
- Check the order status before attempting refund

### "Refund amount cannot exceed total paid amount"
- You're trying to refund more than the customer paid
- Check the order total and adjust refund amount

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Check the server logs for Stripe API errors
3. Verify your Stripe API keys are correct
4. Ensure the order has a valid `stripeSessionId`
