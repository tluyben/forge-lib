# Configuration and initialization

c = createConfig({
'implementation': ['stripe'],
'api_key': 'key_123',
'webhook_secret': 'whsec_123'
})

p = createPayments(c, 'workspace_name', test_mode=True)

# Product Operations

products = p.getProducts() # List all products
product = p.getProduct(id='prod_123') # Get specific product

product = p.createProduct({
'name': 'Premium Plan',
'description': 'Our premium offering',
'metadata': {'feature_set': 'premium'}
})

p.updateProduct('prod_123', {
'name': 'Premium Plan V2',
'active': False
})

p.deleteProduct('prod_123')

# Price Operations

prices = p.getPrices(product_id='prod_123') # Get prices for specific product
price = p.getPrice('price_123')

price = p.createPrice({
'product_id': 'prod_123',
'currency': 'USD',
'unit_amount': 2000, # $20.00
'recurring': {
'interval': 'month',
'interval_count': 1,
'trial_days': 14
}
})

p.updatePrice('price_123', {
'active': False,
'metadata': {'promo': 'summer2024'}
})

# Note: Usually you don't want to delete prices, just deactivate them

p.deletePrice('price_123')

# Bundle multiple products into a subscription plan

plan = p.createPlan({
'name': 'Enterprise Bundle',
'prices': ['price_123', 'price_456'],
'metadata': {'type': 'enterprise'}
})

# Payment Operations

payment = p.requestPayment({
'price_id': 'price_123',
'user_id': 'user_123', # or email address
'frontend': True # If True, returns a URL for payment portal
})

# If frontend=False, charge directly:

payment = p.requestPayment({
'price_id': 'price_123',
'user_id': 'user_123',
'payment_method': 'pm_123' # Stored payment method
})

p.refundPayment('payment_123', {
'amount': 1000, # Partial refund of $10.00
'reason': 'customer_request'
})

# Query payments

payments = p.getPayments({
'status': ['completed', 'refunded'],
'user_id': 'user_123',
'subscription_id': 'sub_123',
'limit': 100
})

# Subscription Operations

subscription = p.createSubscription({
'user_id': 'user_123',
'plan_id': 'plan_123',
'frontend': True # If True, returns portal URL
})

subscriptions = p.getSubscriptions({
'active': True,
'user_id': 'user_123',
'limit': 100
})

p.updateSubscription('sub_123', {
'plan_id': 'plan_456', # Upgrade/downgrade
'trial_end': '2024-12-31'
})

p.cancelSubscription('sub_123', {
'at_period_end': True # Cancel at end of billing period
})

# Webhook handling

p.handleWebhook(event_data, signature)

# Event listeners

p.on('payment.succeeded', callback_fn)
p.on('payment.failed', callback_fn)
p.on('subscription.created', callback_fn)
p.on('subscription.updated', callback_fn)
p.on('subscription.canceled', callback_fn)
