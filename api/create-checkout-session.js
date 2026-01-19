const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { cart, email } = req.body;

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Cart is empty or invalid" });
  }

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    const lineItems = cart.map(item => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: lineItems,
      success_url: "https://jmr-laptops.vercel.app/order-confirmation.html",
      cancel_url: "https://jmr-laptops.vercel.app/cart.html"
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ error: "Stripe session failed" });
  }
};
