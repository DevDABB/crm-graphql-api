import { jest } from "@jest/globals";

// ============================================================
// MOCKS
// ============================================================

const mockUser = {
  id: "1",
  name: "Andres",
  email: "andres@example.com",
  role: "ADMIN",
};

const mockProduct = {
  id: "1",
  name: "Laptop",
  price: 2500,
  stock: 10,
  categoryId: "1",
};

const mockCategory = {
  id: "1",
  name: "Computers",
};

const mockOrder = {
  id: "1",
  total: 1500,
  status: "PENDING",
  userId: "1",
};

// ------------------------------------------------------------
// auth.js
// ------------------------------------------------------------

const generateToken = jest.fn(() => "mock-token");

const requireAuth = jest.fn((context) => {
  if (!context?.user) {
    throw new Error("Authentication required");
  }

  return context.user;
});

const requireRole = jest.fn((context, role) => {
  if (!context?.user) {
    throw new Error("Authentication required");
  }

  if (context.user.role !== role) {
    throw new Error("You do not have permission");
  }

  return context.user;
});

jest.unstable_mockModule("../../src/auth.js", () => ({
  generateToken,
  requireAuth,
  requireRole,
}));

// ------------------------------------------------------------
// User model
// ------------------------------------------------------------

const userFindOne = jest.fn();
const userFindById = jest.fn();

jest.unstable_mockModule("../../src/models/User.js", () => ({
  default: {
    findOne: userFindOne,
    findById: userFindById,
  },
}));

// ------------------------------------------------------------
// Category model
// ------------------------------------------------------------

const categoryFind = jest.fn();
const categoryFindById = jest.fn();

jest.unstable_mockModule("../../src/models/Category.js", () => ({
  default: {
    find: categoryFind,
    findById: categoryFindById,
  },
}));

// ------------------------------------------------------------
// Product model
// ------------------------------------------------------------

jest.unstable_mockModule("../../src/models/Product.js", () => ({
  default: {},
}));

// ------------------------------------------------------------
// Order model
// ------------------------------------------------------------

jest.unstable_mockModule("../../src/models/Order.js", () => ({
  default: {
    findById: jest.fn(),
  },
}));

// ------------------------------------------------------------
// Product service
// ------------------------------------------------------------

const getProducts = jest.fn();
const getProductById = jest.fn();
const createProduct = jest.fn();
const updateProduct = jest.fn();
const deleteProduct = jest.fn();

jest.unstable_mockModule(
  "../../src/services/productService.js",
  () => ({
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  })
);

// ------------------------------------------------------------
// Order service
// ------------------------------------------------------------

const getOrders = jest.fn();
const createOrder = jest.fn();

jest.unstable_mockModule(
  "../../src/services/orderService.js",
  () => ({
    getOrders,
    createOrder,
  })
);

// ------------------------------------------------------------
// User service
// ------------------------------------------------------------

const getUsers = jest.fn();
const getUserById = jest.fn();
const getUserByEmail = jest.fn();

jest.unstable_mockModule(
  "../../src/services/userService.js",
  () => ({
    getUsers,
    getUserById,
    getUserByEmail,
  })
);

// ============================================================
// IMPORT RESOLVERS AFTER MOCKS
// ============================================================

const { default: resolvers } = await import(
  "../../src/graphql/resolvers.js"
);

// ============================================================
// TESTS
// ============================================================

describe("GraphQL Resolvers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // QUERY - USERS
  // ==========================================================

  describe("Query.users", () => {
    test("debería devolver todos los usuarios", async () => {
      const users = [mockUser];

      getUsers.mockResolvedValue(users);

      const result = await resolvers.Query.users();

      expect(getUsers).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  // ==========================================================
  // QUERY - USER
  // ==========================================================

  describe("Query.user", () => {
    test("debería devolver un usuario por ID", async () => {
      getUserById.mockResolvedValue(mockUser);

      const result = await resolvers.Query.user(
        null,
        { id: "1" }
      );

      expect(getUserById).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockUser);
    });
  });

  // ==========================================================
  // QUERY - ME
  // ==========================================================

  describe("Query.me", () => {
    test("debería devolver el usuario autenticado", async () => {
      const context = {
        user: mockUser,
      };

      const result = await resolvers.Query.me(
        null,
        null,
        context
      );

      expect(requireAuth).toHaveBeenCalledWith(context);
      expect(result).toEqual(mockUser);
    });

    test("debería exigir autenticación", async () => {
      requireAuth.mockImplementationOnce(() => {
        throw new Error("Authentication required");
      });

      await expect(
        resolvers.Query.me(null, null, { user: null })
      ).rejects.toThrow("Authentication required");
    });
  });

  // ==========================================================
  // QUERY - PRODUCTS
  // ==========================================================

  describe("Query.products", () => {
    beforeEach(() => {
      getProducts.mockResolvedValue({
        items: [mockProduct],
        total: 25,
      });

      categoryFindById.mockResolvedValue(mockCategory);
    });

    test("debería devolver productos paginados", async () => {
      const result = await resolvers.Query.products(
        null,
        {
          page: 1,
          limit: 10,
        }
      );

      expect(getProducts).toHaveBeenCalledWith({
        filter: {},
        sort: {
          name: 1,
        },
        skip: 0,
        limit: 10,
      });

      expect(result).toEqual({
        items: [mockProduct],
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    test("debería rechazar page menor que 1", async () => {
      await expect(
        resolvers.Query.products(
          null,
          {
            page: 0,
            limit: 10,
          }
        )
      ).rejects.toMatchObject({
        extensions: {
          code: "INVALID_PAGE",
        },
      });

      expect(getProducts).not.toHaveBeenCalled();
    });

    test("debería rechazar limit menor que 1", async () => {
      await expect(
        resolvers.Query.products(
          null,
          {
            page: 1,
            limit: 0,
          }
        )
      ).rejects.toMatchObject({
        extensions: {
          code: "INVALID_LIMIT",
        },
      });
    });

    test("debería rechazar limit mayor que 100", async () => {
      await expect(
        resolvers.Query.products(
          null,
          {
            page: 1,
            limit: 101,
          }
        )
      ).rejects.toMatchObject({
        extensions: {
          code: "INVALID_LIMIT",
        },
      });
    });

    test("debería rechazar rango de precios inválido", async () => {
      await expect(
        resolvers.Query.products(
          null,
          {
            page: 1,
            limit: 10,
            minPrice: 500,
            maxPrice: 100,
          }
        )
      ).rejects.toMatchObject({
        extensions: {
          code: "INVALID_PRICE_RANGE",
        },
      });
    });

    test("debería filtrar por categoría", async () => {
      await resolvers.Query.products(
        null,
        {
          page: 2,
          limit: 5,
          categoryId: "1",
        }
      );

      expect(categoryFindById).toHaveBeenCalledWith("1");

      expect(getProducts).toHaveBeenCalledWith({
        filter: {
          categoryId: "1",
        },
        sort: {
          name: 1,
        },
        skip: 5,
        limit: 5,
      });
    });

    test("debería devolver error si la categoría no existe", async () => {
      categoryFindById.mockResolvedValue(null);

      await expect(
        resolvers.Query.products(
          null,
          {
            page: 1,
            limit: 10,
            categoryId: "999",
          }
        )
      ).rejects.toMatchObject({
        extensions: {
          code: "CATEGORY_NOT_FOUND",
        },
      });

      expect(getProducts).not.toHaveBeenCalled();
    });

    test("debería filtrar por precio mínimo", async () => {
      await resolvers.Query.products(
        null,
        {
          page: 1,
          limit: 10,
          minPrice: 100,
        }
      );

      expect(getProducts).toHaveBeenCalledWith({
        filter: {
          price: {
            $gte: 100,
          },
        },
        sort: {
          name: 1,
        },
        skip: 0,
        limit: 10,
      });
    });

    test("debería filtrar por precio máximo", async () => {
      await resolvers.Query.products(
        null,
        {
          page: 1,
          limit: 10,
          maxPrice: 1000,
        }
      );

      expect(getProducts).toHaveBeenCalledWith({
        filter: {
          price: {
            $lte: 1000,
          },
        },
        sort: {
          name: 1,
        },
        skip: 0,
        limit: 10,
      });
    });

    test("debería filtrar por rango de precios", async () => {
      await resolvers.Query.products(
        null,
        {
          page: 1,
          limit: 10,
          minPrice: 100,
          maxPrice: 1000,
        }
      );

      expect(getProducts).toHaveBeenCalledWith({
        filter: {
          price: {
            $gte: 100,
            $lte: 1000,
          },
        },
        sort: {
          name: 1,
        },
        skip: 0,
        limit: 10,
      });
    });

    test("debería buscar por nombre", async () => {
      await resolvers.Query.products(
        null,
        {
          page: 1,
          limit: 10,
          search: "laptop",
        }
      );

      expect(getProducts).toHaveBeenCalledWith({
        filter: {
          name: {
            $regex: "laptop",
            $options: "i",
          },
        },
        sort: {
          name: 1,
        },
        skip: 0,
        limit: 10,
      });
    });

    test("debería ordenar por precio descendente", async () => {
      await resolvers.Query.products(
        null,
        {
          page: 1,
          limit: 10,
          sortBy: "PRICE",
          sortOrder: "DESC",
        }
      );

      expect(getProducts).toHaveBeenCalledWith({
        filter: {},
        sort: {
          price: -1,
        },
        skip: 0,
        limit: 10,
      });
    });

    test("debería ordenar por stock", async () => {
      await resolvers.Query.products(
        null,
        {
          page: 1,
          limit: 10,
          sortBy: "STOCK",
          sortOrder: "ASC",
        }
      );

      expect(getProducts).toHaveBeenCalledWith({
        filter: {},
        sort: {
          stock: 1,
        },
        skip: 0,
        limit: 10,
      });
    });
  });

  // ==========================================================
  // QUERY - PRODUCT
  // ==========================================================

  describe("Query.product", () => {
    test("debería devolver producto por ID", async () => {
      getProductById.mockResolvedValue(mockProduct);

      const result = await resolvers.Query.product(
        null,
        { id: "1" }
      );

      expect(getProductById).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockProduct);
    });
  });

  // ==========================================================
  // QUERY - CATEGORIES
  // ==========================================================

  describe("Query.categories", () => {
    test("debería devolver todas las categorías", async () => {
      categoryFind.mockResolvedValue([mockCategory]);

      const result = await resolvers.Query.categories();

      expect(categoryFind).toHaveBeenCalled();
      expect(result).toEqual([mockCategory]);
    });
  });

  // ==========================================================
  // QUERY - CATEGORY
  // ==========================================================

  describe("Query.category", () => {
    test("debería devolver una categoría por ID", async () => {
      categoryFindById.mockResolvedValue(mockCategory);

      const result = await resolvers.Query.category(
        null,
        { id: "1" }
      );

      expect(categoryFindById).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockCategory);
    });

    test("debería devolver null si no existe", async () => {
      categoryFindById.mockResolvedValue(null);

      const result = await resolvers.Query.category(
        null,
        { id: "999" }
      );

      expect(result).toBeNull();
    });
  });

  // ==========================================================
  // QUERY - ORDERS
  // ==========================================================

  describe("Query.orders", () => {
    test("debería devolver todas las órdenes", async () => {
      getOrders.mockResolvedValue([mockOrder]);

      const result = await resolvers.Query.orders();

      expect(getOrders).toHaveBeenCalled();
      expect(result).toEqual([mockOrder]);
    });
  });

  // ==========================================================
  // PRODUCT CATEGORY - DATALOADER
  // ==========================================================

  describe("Product.category", () => {
    test("debería obtener categoría usando DataLoader", async () => {
      const load = jest.fn().mockResolvedValue(mockCategory);

      const context = {
        categoryLoader: {
          load,
        },
      };

      const parent = {
        ...mockProduct,
        categoryId: {
          toString: () => "1",
        },
      };

      const result = await resolvers.Product.category(
        parent,
        null,
        context
      );

      expect(load).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockCategory);
    });
  });

  // ==========================================================
  // ORDER USER
  // ==========================================================

  describe("Order.user", () => {
    test("debería obtener usuario de la orden", async () => {
      userFindById.mockResolvedValue(mockUser);

      const result = await resolvers.Order.user(
        {
          userId: "1",
        }
      );

      expect(userFindById).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockUser);
    });
  });

  // ==========================================================
  // MUTATION - LOGIN
  // ==========================================================

  describe("Mutation.login", () => {
    test("debería generar token con credenciales válidas", async () => {
      userFindOne.mockResolvedValue(mockUser);

      const result = await resolvers.Mutation.login(
        null,
        {
          email: mockUser.email,
        }
      );

      expect(userFindOne).toHaveBeenCalledWith({
        email: mockUser.email,
      });

      expect(generateToken).toHaveBeenCalledWith(mockUser);

      expect(result).toBe("mock-token");
    });

    test("debería rechazar usuario inexistente", async () => {
      userFindOne.mockResolvedValue(null);

      await expect(
        resolvers.Mutation.login(
          null,
          {
            email: "unknown@example.com",
          }
        )
      ).rejects.toMatchObject({
        extensions: {
          code: "UNAUTHENTICATED",
        },
      });

      expect(generateToken).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // MUTATION - CREATE PRODUCT
  // ==========================================================

  describe("Mutation.createProduct", () => {
    test("debería crear producto autenticado", async () => {
      createProduct.mockResolvedValue(mockProduct);

      const context = {
        user: mockUser,
      };

      const result = await resolvers.Mutation.createProduct(
        null,
        {
          input: {
            name: "Laptop",
            price: 2500,
            stock: 10,
            categoryId: "1",
          },
        },
        context
      );

      expect(requireAuth).toHaveBeenCalledWith(context);

      expect(createProduct).toHaveBeenCalledWith({
        name: "Laptop",
        price: 2500,
        stock: 10,
        categoryId: "1",
      });

      expect(result).toEqual(mockProduct);
    });
  });

  // ==========================================================
  // MUTATION - UPDATE PRODUCT
  // ==========================================================

  describe("Mutation.updateProduct", () => {
    test("debería actualizar producto autenticado", async () => {
      updateProduct.mockResolvedValue(mockProduct);

      const context = {
        user: mockUser,
      };

      const result = await resolvers.Mutation.updateProduct(
        null,
        {
          id: "1",
          input: {
            price: 3000,
          },
        },
        context
      );

      expect(requireAuth).toHaveBeenCalledWith(context);

      expect(updateProduct).toHaveBeenCalledWith(
        "1",
        {
          price: 3000,
        }
      );

      expect(result).toEqual(mockProduct);
    });
  });

  // ==========================================================
  // MUTATION - DELETE PRODUCT
  // ==========================================================

  describe("Mutation.deleteProduct", () => {
    test("debería eliminar producto siendo ADMIN", async () => {
      deleteProduct.mockResolvedValue(true);

      const context = {
        user: {
          ...mockUser,
          role: "ADMIN",
        },
      };

      const result = await resolvers.Mutation.deleteProduct(
        null,
        {
          id: "1",
        },
        context
      );

      expect(requireRole).toHaveBeenCalledWith(
        context,
        "ADMIN"
      );

      expect(deleteProduct).toHaveBeenCalledWith("1");

      expect(result).toBe(true);
    });
  });

  // ==========================================================
  // MUTATION - CREATE ORDER
  // ==========================================================

  describe("Mutation.createOrder", () => {
    test("debería crear orden autenticado", async () => {
      createOrder.mockResolvedValue(mockOrder);

      const context = {
        user: mockUser,
      };

      const input = {
        total: 1500,
        status: "PENDING",
        userId: "1",
      };

      const result = await resolvers.Mutation.createOrder(
        null,
        { input },
        context
      );

      expect(requireAuth).toHaveBeenCalledWith(context);
      expect(createOrder).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockOrder);
    });
  });
});