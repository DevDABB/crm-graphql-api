import { jest } from "@jest/globals";
import { ApolloServer } from "@apollo/server";

const findByIdMock = jest.fn();
const findByIdAndUpdateMock = jest.fn();
const findByIdAndDeleteMock = jest.fn();
const saveMock = jest.fn();

const ProductMock = jest.fn(() => ({
  save: saveMock
}));

ProductMock.findById = findByIdMock;
ProductMock.findByIdAndUpdate = findByIdAndUpdateMock;
ProductMock.findByIdAndDelete = findByIdAndDeleteMock;

jest.unstable_mockModule(
  "../../src/models/Product.js",
  () => ({
    default: ProductMock
  })
);

const { default: typeDefs } = await import(
  "../../src/graphql/schema.js"
);

const { default: resolvers } = await import(
  "../../src/graphql/resolvers.js"
);

const server = new ApolloServer({
  typeDefs,
  resolvers
});

const authenticatedContext = {
  user: {
    id: "user-1",
    name: "Andres",
    email: "andres@example.com",
    role: "ADMIN"
  }
};

describe("GraphQL - Product", () => {

  beforeEach(() => {
    findByIdMock.mockReset();
    findByIdAndUpdateMock.mockReset();
    findByIdAndDeleteMock.mockReset();
    saveMock.mockReset();
    ProductMock.mockClear();
  });

  test("debería devolver un producto por ID", async () => {

    findByIdMock.mockResolvedValue({
      id: "1",
      name: "Laptop",
      price: 2500,
      stock: 10,
      categoryId: "1"
    });

    const response = await server.executeOperation(
      {
        query: `
          query {
            product(id: "1") {
              id
              name
              price
              stock
            }
          }
        `
      },
      {
        contextValue: authenticatedContext
      }
    );

    const result = response.body.singleResult;

    expect(result.errors).toBeUndefined();

    expect(result.data.product).toEqual({
      id: "1",
      name: "Laptop",
      price: 2500,
      stock: 10
    });
  });

  test("debería devolver PRODUCT_NOT_FOUND cuando no existe", async () => {

    findByIdMock.mockResolvedValue(null);

    const response = await server.executeOperation(
      {
        query: `
          query {
            product(id: "999") {
              id
              name
            }
          }
        `
      },
      {
        contextValue: authenticatedContext
      }
    );

    const result = response.body.singleResult;

    expect(result.data.product).toBeNull();

    expect(result.errors).toBeDefined();

    expect(result.errors[0].message).toBe(
      "Product not found"
    );
  });

  test("debería crear un producto", async () => {

    const createdProduct = {
      id: "10",
      name: "Monitor",
      price: 800,
      stock: 20,
      categoryId: "1"
    };

    saveMock.mockResolvedValue(createdProduct);

    const response = await server.executeOperation(
      {
        query: `
          mutation {
            createProduct(
              input: {
                name: "Monitor"
                price: 800
                stock: 20
                categoryId: "1"
              }
            ) {
              id
              name
              price
              stock
            }
          }
        `
      },
      {
        contextValue: authenticatedContext
      }
    );

    const result = response.body.singleResult;

    expect(result.errors).toBeUndefined();

    expect(result.data.createProduct).toEqual({
      id: "10",
      name: "Monitor",
      price: 800,
      stock: 20
    });

    expect(ProductMock).toHaveBeenCalledWith({
      name: "Monitor",
      price: 800,
      stock: 20,
      categoryId: "1"
    });

    expect(saveMock).toHaveBeenCalled();
  });

  test("debería actualizar un producto", async () => {

    const updatedProduct = {
      id: "1",
      name: "Laptop Pro",
      price: 3000,
      stock: 15,
      categoryId: "1"
    };

    findByIdAndUpdateMock.mockResolvedValue(
      updatedProduct
    );

    const response = await server.executeOperation(
      {
        query: `
          mutation {
            updateProduct(
              id: "1"
              input: {
                name: "Laptop Pro"
                price: 3000
                stock: 15
              }
            ) {
              id
              name
              price
              stock
            }
          }
        `
      },
      {
        contextValue: authenticatedContext
      }
    );

    const result = response.body.singleResult;

    expect(result.errors).toBeUndefined();

    expect(result.data.updateProduct).toEqual({
      id: "1",
      name: "Laptop Pro",
      price: 3000,
      stock: 15
    });
  });

  test("debería eliminar un producto", async () => {

    findByIdAndDeleteMock.mockResolvedValue({
      id: "1",
      name: "Laptop"
    });

    const response = await server.executeOperation(
      {
        query: `
          mutation {
            deleteProduct(id: "1")
          }
        `
      },
      {
        contextValue: authenticatedContext
      }
    );

    const result = response.body.singleResult;

    expect(result.errors).toBeUndefined();

    expect(result.data.deleteProduct).toBe(true);

    expect(findByIdAndDeleteMock)
      .toHaveBeenCalledWith("1");
  });

});