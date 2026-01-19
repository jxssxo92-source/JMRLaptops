import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe("YOUR_SECRET_KEY"); // sk_test_...

app.post("/create-checkout-session", async (req, res) => {
  const cart = req.body.cart;

  const lineItems = cart.map(item => ({
    price_data: {
      currency: "gbp",
      product_data: {
        name: item.name,
        images: [item.image]
      },
      unit_amount: item.price * 100
    },
    quantity: item.quantity
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: lineItems,
    success_url: "https://http://127.0.0.1:5500/index.html/order-confirmation.html",
    cancel_url: "https://YOUR-SITE.com/cart.html"
  });

  res.json({ url: session.url });
});

app.listen(4242, () => console.log("Server running on port 4242"));
