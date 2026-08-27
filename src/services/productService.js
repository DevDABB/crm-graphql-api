import Product from "../models/Product.js";
import { notFound, badRequest } from "../errors/index.js";

const getProducts = async ({
  filter = {},
  sort = {},
  skip = 0,
  limit = 10
}) => {
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),

    Product.countDocuments(filter)
  ]);

  return {
    items,
    total
  };
};

const getProductById = async (id) => {
  const product = await Product.findById(id);

  if (!product) {
    throw notFound(
      "Product not found",
      "PRODUCT_NOT_FOUND"
    );
  }

  return product;
};

const createProduct = async (input) => {
  if (!input.name?.trim()) {
    throw badRequest(
      "Product name is required",
      "INVALID_PRODUCT_NAME"
    );
  }

  if (input.price <= 0) {
    throw badRequest(
      "Product price must be greater than 0",
      "INVALID_PRODUCT_PRICE"
    );
  }

  if (input.stock < 0) {
    throw badRequest(
      "Product stock cannot be negative",
      "INVALID_PRODUCT_STOCK"
    );
  }

  if (!input.categoryId) {
    throw badRequest(
      "Category is required",
      "INVALID_PRODUCT_CATEGORY"
    );
  }

  const product = new Product(input);

  return product.save();
};

const updateProduct = async (id, input) => {
  if (input.name !== undefined && !input.name.trim()) {
    throw badRequest(
      "Product name cannot be empty",
      "INVALID_PRODUCT_NAME"
    );
  }

  if (input.price !== undefined && input.price <= 0) {
    throw badRequest(
      "Product price must be greater than 0",
      "INVALID_PRODUCT_PRICE"
    );
  }

  if (input.stock !== undefined && input.stock < 0) {
    throw badRequest(
      "Product stock cannot be negative",
      "INVALID_PRODUCT_STOCK"
    );
  }

  const product = await Product.findByIdAndUpdate(
    id,
    input,
    {
      returnDocument: "after",
      runValidators: true
    }
  );

  if (!product) {
    throw notFound(
      "Product not found",
      "PRODUCT_NOT_FOUND"
    );
  }

  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    throw notFound(
      "Product not found",
      "PRODUCT_NOT_FOUND"
    );
  }

  return true;
};

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};