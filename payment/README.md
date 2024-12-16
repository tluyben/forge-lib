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

for subscriptions whe should allow;

start now with the new one and remove the previous sub
start now but combine the subs (only possible if the sub is based on quantities, like sending 100k emails; aka;
--> on 1 dec i start 100k emails sub then on 15 dec i upgrade to 200k emails then we can do: - start a new sub at 15 dec and just kill the 100k one if the emails are gone or not (normal behavior) , add the emails left to the 200k and move the start date of the sub to 15 dec, calculate 100k/{number of days in the month} and price / number of days; multiply and deduct that from the new amount to start at 15 dec ; these should all be possible
