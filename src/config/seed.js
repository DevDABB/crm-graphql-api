import "dotenv/config";

import connectDB from "./db.js";

import User from "../models/User.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const seed = async () => {
  try {
    await connectDB();

    // Limpiar colecciones
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // USERS
    const users = await User.create([
      {
        name: "Andres",
        email: "andres@example.com",
        role: "ADMIN"
      },
      {
        name: "Carlos",
        email: "carlos@example.com",
        role: "SELLER"
      }
    ]);

    // CATEGORIES
    const categories = await Category.create([
      {
        name: "Computers"
      },
      {
        name: "Accessories"
      }
    ]);

    // PRODUCTS
    const products = await Product.create([
      {
        name: "Laptop",
        price: 2500.50,
        stock: 10,
        categoryId: categories[0]._id
      },
      {
        name: "Keyboard",
        price: 150.99,
        stock: 25,
        categoryId: categories[1]._id
      },
      {
        name: "Mouse",
        price: 75.50,
        stock: 50,
        categoryId: categories[1]._id
      }
    ]);

    // ORDERS
    await Order.create([
      {
        total: 2751.49,
        status: "PENDING",
        userId: users[0]._id
      },
      {
        total: 150.99,
        status: "COMPLETED",
        userId: users[1]._id
      }
    ]);

    console.log("Database seeded successfully");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();