import { jest } from "@jest/globals";
import { ApolloServer } from "@apollo/server";

const findByIdAndDeleteMock = jest.fn();

const ProductMock = {
  findByIdAndDelete: findByIdAndDeleteMock
};

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

describe("GraphQL - Authentication & Authorization", () => {

  beforeEach(() => {
    findByIdAndDeleteMock.mockReset();
  });

  test("debería rechazar una operación sin usuario autenticado", async () => {

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
            }
          }
        `
      },
      {
        contextValue: {
          user: null
        }
      }
    );

    const result = response.body.singleResult;

    expect(result.errors).toBeDefined();

    expect(result.errors[0].message).toBe(
      "Authentication required"
    );
  });

  test("debería rechazar un usuario sin permisos", async () => {

    const response = await server.executeOperation(
      {
        query: `
          mutation {
            deleteProduct(id: "1")
          }
        `
      },
      {
        contextValue: {
          user: {
            id: "user-2",
            name: "Carlos",
            email: "carlos@example.com",
            role: "USER"
          }
        }
      }
    );

    const result = response.body.singleResult;

    expect(result.errors).toBeDefined();

    expect(result.errors[0].message).toBe(
      "You do not have permission"
    );

    expect(
      findByIdAndDeleteMock
    ).not.toHaveBeenCalled();
  });

  test("debería permitir la operación a un usuario autorizado", async () => {

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
        contextValue: {
          user: {
            id: "admin-1",
            name: "Andres",
            email: "andres@example.com",
            role: "ADMIN"
          }
        }
      }
    );

    const result = response.body.singleResult;

    expect(result.errors).toBeUndefined();

    expect(
      result.data.deleteProduct
    ).toBe(true);

    expect(
      findByIdAndDeleteMock
    ).toHaveBeenCalledWith("1");
  });

});