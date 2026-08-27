import { GraphQLError } from "graphql";
import { generateToken, requireAuth, requireRole } from "../auth.js";
import User from "../models/User.js"
import Category from "../models/Category.js"
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../services/productService.js";
import {
  getOrders,
  createOrder
} from "../services/orderService.js";
import {
  getUsers,
  getUserById,
  getUserByEmail
} from "../services/userService.js";
import {
  getHealth,
  getReadiness
} from "../services/healthService.js";




const resolvers = {

  Query: {

    health: () => {
      return getHealth();
    },

    readiness: async () => {
      return getReadiness();
    },

    me: async (_, __, context) => {
      const user = requireAuth(context);
      return context.user;
    },

    users: () => {
      return getUsers();
    },

    user: (_, { id }) => {
      return getUserById(id);
    },

    products: async (
      _,
      {
        page = 1,
        limit = 10,
        categoryId,
        minPrice,
        maxPrice,
        sortBy = "NAME",
        sortOrder = "ASC",
        search
      }
    ) => {
      if (page < 1) {
        throw new GraphQLError("Page must be greater than 0", {
          extensions: {
            code: "INVALID_PAGE"
          }
        });
      }

      if (limit < 1 || limit > 100) {
        throw new GraphQLError(
          "Limit must be between 1 and 100",
          {
            extensions: {
              code: "INVALID_LIMIT"
            }
          }
        );
      }

      if (
        minPrice !== undefined &&
        maxPrice !== undefined &&
        minPrice > maxPrice
      ) {
        throw new GraphQLError(
          "minPrice cannot be greater than maxPrice",
          {
            extensions: {
              code: "INVALID_PRICE_RANGE"
            }
          }
        );
      }

      const filter = {};

      if (categoryId) {
        const category = await Category.findById(categoryId);

        if (!category) {
          throw new GraphQLError("Category not found", {
            extensions: {
              code: "CATEGORY_NOT_FOUND"
            }
          });
        }

        filter.categoryId = categoryId;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};

        if (minPrice !== undefined) {
          filter.price.$gte = minPrice;
        }

        if (maxPrice !== undefined) {
          filter.price.$lte = maxPrice;
        }
      }

      if (search) {
        filter.name = {
          $regex: search,
          $options: "i"
        };
      }

      const sortFields = {
        NAME: "name",
        PRICE: "price",
        STOCK: "stock"
      };

      const sort = {
        [sortFields[sortBy]]: sortOrder === "ASC" ? 1 : -1
      };

      const skip = (page - 1) * limit;
      
      const { items, total } = await getProducts({
        filter,
        sort,
        skip,
        limit
      });

      const totalPages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };
    },

    product: async (_, { id }) => {
      return getProductById(id);
    },

    categories: async () => {
      return Category.find();
    },

    category: async (_, { id }) => {
      return Category.findById(id);
    },

    orders: () => {
      return getOrders();
    },
  },

  Product: {
    category: (parent, _, context) => {
      return context.categoryLoader.load(
        parent.categoryId.toString()
      );
    }
  },

  //! explicacion del N+1
  // Product: {
  //   category: async (parent) => {
  //     console.log(`Category query for product: ${parent.name}`);

  //     return Category.findById(parent.categoryId);
  //   }
  // },

  Order: {
    user: async (parent) => {
      return User.findById(parent.userId);
    }
  },




  //! MUTATION
  Mutation: {

    login: async (_, { email }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new GraphQLError("Invalid credentials", {
          extensions: {
            code: "UNAUTHENTICATED"
          }
        });
      }

      return generateToken(user);
    },

    createProduct: async (_, { input }, context) => {
      requireAuth(context);
      return createProduct(input);
    },

    updateProduct: async (_, { id, input }, context) => {
      requireAuth(context);
      return updateProduct(id, input);;
    },

    deleteProduct: async (_, { id }, context) => {
      requireRole(context, "ADMIN");
      return deleteProduct(id);
    },

    createOrder: async (_, { input }, context) => {
      requireAuth(context);
      return createOrder(input);
    },

  }

};

export default resolvers;